import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { gsap } from 'gsap';

interface Embedding3D { id: string; x: number; y: number; z: number }
interface Meta { id: string; title?: string; url: string; tags?: string[] }

type Props = {
  onSelectProject?: (id: string) => void;
  onReady?: () => void;
  selectedTags?: string[];
};

export default function ThreeViewer({ onSelectProject, onReady, selectedTags = [] }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const spritesRef = useRef<THREE.Sprite[]>([]);
  const spriteById = useRef<Map<string, THREE.Sprite>>(new Map());
  const selectedRef = useRef<THREE.Sprite | null>(null);
  const sceneRadiusRef = useRef<number>(60);

  useEffect(() => {
    const container = containerRef.current!;
    const scene = new THREE.Scene();
    const width = container.clientWidth;
    const height = container.clientHeight;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 5000);
    camera.position.set(0, 0, 200);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.sortObjects = true;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableRotate = true;
    controls.zoomSpeed = 1.0;
    controls.panSpeed = 1.0;

    rendererRef.current = renderer;
    sceneRef.current = scene;
    cameraRef.current = camera;
    controlsRef.current = controls;

    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    const raycaster = new THREE.Raycaster();
    (raycaster.params as any).Sprite = { threshold: 0.8 };
    const mouse = new THREE.Vector2();
    let hovered: THREE.Sprite | null = null;

    const onPointerMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(spritesRef.current, false);
      const sprite = intersects.length ? (intersects[0].object as THREE.Sprite) : null;
      if (hovered && hovered !== sprite && hovered !== selectedRef.current) {
        const s = (hovered.userData.baseScale as number) || hovered.scale.x;
        hovered.scale.setScalar(s);
        hovered.material.opacity = 1.0;
      }
      hovered = sprite;
      if (sprite && sprite !== selectedRef.current) {
        const s = (sprite.userData.baseScale as number) * 1.15;
        sprite.scale.setScalar(s);
        sprite.material.opacity = 1.0;
      }
    };

    const flyToSprite = (sprite: THREE.Sprite) => {
      const target = sprite.position.clone();
      const startPos = camera.position.clone();
      const startTarget = controls.target.clone();
      const viewDir = startPos.clone().sub(startTarget).normalize();
      const desiredDist = Math.max(30, sceneRadiusRef.current * 0.8);
      const endPos = target.clone().add(viewDir.multiplyScalar(desiredDist));
      const tweenObj = { t: 0 };
      gsap.to(tweenObj, {
        t: 1,
        duration: 0.9,
        ease: 'power2.out',
        onUpdate: () => {
          const tt = tweenObj.t;
          camera.position.lerpVectors(startPos, endPos, tt);
          controls.target.set(
            startTarget.x + (target.x - startTarget.x) * tt,
            startTarget.y + (target.y - startTarget.y) * tt,
            startTarget.z + (target.z - startTarget.z) * tt,
          );
          camera.lookAt(controls.target);
          controls.update();
        }
      });
    };

    const onClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(spritesRef.current, false);
      const sprite = intersects.length ? (intersects[0].object as THREE.Sprite) : null;
      if (sprite) {
        selectedRef.current = sprite;
        flyToSprite(sprite);
        if (sprite.userData.id) onSelectProject?.(sprite.userData.id as string);
      }
    };

    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('click', onClick);

    const animate = () => { controls.update(); renderer.render(scene, camera); requestAnimationFrame(animate); };
    animate();

    (async () => {
      const [embeds3d, metas] = await Promise.all([
        fetch('http://localhost:8000/embeddings/3d').then(r => r.json()),
        fetch('http://localhost:8000/images').then(r => r.json())
      ]);
      const e3 = Array.isArray(embeds3d) ? (embeds3d as Embedding3D[]) : [];
      const mlist = Array.isArray(metas) ? (metas as Meta[]) : [];
      if (!e3.length || !mlist.length) { return; }
      const map = new Map(e3.map(e => [e.id, e]));
      const rawItems = mlist.filter(m => map.has(m.id)).map(m => ({
        id: m.id,
        x: map.get(m.id)!.x,
        y: map.get(m.id)!.y,
        z: map.get(m.id)!.z,
        url: `http://localhost:8000${m.url.replace(/\.jpg$/i, '.png')}`,
        tags: m.tags || []
      }));
      if (!rawItems.length) { return; }

      // Compute bounds
      const box = new THREE.Box3();
      rawItems.forEach(it => box.expandByPoint(new THREE.Vector3(it.x, it.y, it.z)));
      const size = new THREE.Vector3();
      box.getSize(size);
      const center = new THREE.Vector3();
      box.getCenter(center);
      const radius = Math.max(size.x, size.y, size.z) * 0.6 || 60;
      sceneRadiusRef.current = radius;

      // Normalize to origin and scale
      const targetRadius = 60;
      const scale = radius > 0 ? targetRadius / radius : 1;
      const items = rawItems.map(it => ({
        id: it.id,
        x: (it.x - center.x) * scale,
        y: (it.y - center.y) * scale,
        z: (it.z - center.z) * scale,
        url: it.url,
        tags: it.tags
      }));

      // Place camera
      camera.position.set(0, 0, targetRadius * 2.2);
      controls.target.set(0, 0, 0);
      controls.update();

      // Preload textures
      const manager = new THREE.LoadingManager();
      const loader = new THREE.TextureLoader(manager);
      loader.setCrossOrigin('anonymous');
      const textures = new Map<string, THREE.Texture>();
      items.forEach(it => {
        const tex = loader.load(it.url);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
        textures.set(it.id, tex);
      });
      manager.onLoad = () => {
        items.forEach(it => {
          const tex = textures.get(it.id)!;
          const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 1.0, depthTest: true, depthWrite: false });
          const sp = new THREE.Sprite(mat);
          sp.position.set(it.x, it.y, it.z);
          const scaleSprite = 6;
          sp.scale.set(scaleSprite, scaleSprite, 1);
          sp.userData = { id: it.id, baseScale: scaleSprite, tags: it.tags };
          sp.renderOrder = Math.floor(-it.z * 1000);
          spritesRef.current.push(sp);
          spriteById.current.set(it.id, sp);
          scene.add(sp);
        });
        applyTagFilter(selectedTags);
        onReady?.();
      };
    })();

    return () => {
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('click', onClick);
      controls.dispose();
      renderer.dispose();
      container.innerHTML = '';
      spritesRef.current = [];
      spriteById.current.clear();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onSelectProject, onReady]);

  // Apply OR-mode tag filtering by toggling visibility only
  useEffect(() => {
    applyTagFilter(selectedTags);
  }, [selectedTags]);

  function applyTagFilter(tags: string[]) {
    const tagSet = new Set(tags || []);
    const showAll = tagSet.size === 0;
    spritesRef.current.forEach(sp => {
      const sTags: string[] = (sp.userData.tags as string[]) || [];
      sp.visible = showAll || sTags.some(t => tagSet.has(t));
    });
  }

  return <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />;
}