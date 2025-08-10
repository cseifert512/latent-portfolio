import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { gsap } from 'gsap';

interface Embedding3D { id: string; x: number; y: number; z: number }
interface Meta { id: string; title?: string; url: string; tags?: string[] }

type Props = {
  onSelectProject?: (id: string) => void;
  onReady?: () => void;
  onTagClick?: (tag: string) => void;
  selectedTags?: string[];
  searchQuery?: string;
};

export default function ThreeViewer({ onSelectProject, onReady, onTagClick, selectedTags = [], searchQuery = '' }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const spritesRef = useRef<THREE.Sprite[]>([]);
  const spriteById = useRef<Map<string, THREE.Sprite>>(new Map());
  const selectedRef = useRef<THREE.Sprite | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const sceneRadiusRef = useRef<number>(60);
  const hoveredRef = useRef<THREE.Sprite | null>(null);
  const [overlayTags, setOverlayTags] = useState<string[]>([]);
  const overlayTagsRef = useRef<string[]>([]);

  function setOverlayTagsImmediate(tags: string[]) {
    overlayTagsRef.current = tags;
    setOverlayTags(tags);
    if (overlayRef.current) {
      overlayRef.current.style.display = tags.length ? 'block' : 'none';
    }
  }

  function applySelectionDim() {
    const selectedId = selectedIdRef.current;
    spritesRef.current.forEach(sp => {
      const isSelected = !!selectedId && (sp.userData.id === selectedId);
      sp.material.opacity = selectedId ? (isSelected ? 1.0 : 0.6) : 1.0;
    });
  }

  function promoteSelectedOnTop(sel: THREE.Sprite | null, prev?: THREE.Sprite | null) {
    if (prev && prev !== sel) {
      const prevOrig = (prev.userData.origRenderOrder as number) ?? prev.renderOrder;
      prev.renderOrder = prevOrig;
      prev.material.depthTest = true;
      prev.material.needsUpdate = true;
    }
    if (sel) {
      if (sel.userData.origRenderOrder === undefined) sel.userData.origRenderOrder = sel.renderOrder;
      sel.renderOrder = 2_000_000_000;
      sel.material.depthTest = false;
      sel.material.needsUpdate = true;
    }
  }

  function clearSelection() {
    const prev = selectedRef.current;
    if (prev) {
      promoteSelectedOnTop(null, prev);
      selectedRef.current = null;
    }
    selectedIdRef.current = null;
    setOverlayTagsImmediate([]);
    if (overlayRef.current) overlayRef.current.style.display = 'none';
  }

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

    const onPointerMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(spritesRef.current, false);
      const sprite = intersects.length ? (intersects[0].object as THREE.Sprite) : null;

      if (hoveredRef.current && hoveredRef.current !== selectedRef.current) {
        const s = (hoveredRef.current.userData.baseScale as number) || hoveredRef.current.scale.x;
        hoveredRef.current.scale.setScalar(s);
      }
      hoveredRef.current = sprite;
      if (sprite && sprite !== selectedRef.current) {
        const s = (sprite.userData.baseScale as number) * 1.15;
        sprite.scale.setScalar(s);
      }
      applySelectionDim();
    };

    const flyToSprite = (sprite: THREE.Sprite) => {
      const target = sprite.position.clone();
      const startPos = camera.position.clone();
      const startTarget = controls.target.clone();
      const viewDir = startPos.clone().sub(startTarget).normalize();
      const desiredDist = Math.max(8, sceneRadiusRef.current * 0.2);
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
        const prev = selectedRef.current;
        selectedRef.current = sprite;
        selectedIdRef.current = (sprite.userData.id as string) || null;
        promoteSelectedOnTop(sprite, prev);
        applySelectionDim();
        flyToSprite(sprite);
        const tags: string[] = (sprite.userData.tags as string[]) || [];
        setOverlayTagsImmediate(tags);
        if (sprite.userData.id) onSelectProject?.(sprite.userData.id as string);
      }
    };

    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('click', onClick);

    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      // Update overlay position to bottom-left of selected sprite
      const overlayEl = overlayRef.current;
      const sel = selectedRef.current;
      if (overlayEl && sel) {
        const rect = renderer.domElement.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;
        // Camera billboard axes
        const camRight = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0).normalize();
        const camUp = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1).normalize();
        const halfW = sel.scale.x / 2;
        const halfH = sel.scale.y / 2;
        const bottomLeft = sel.position.clone()
          .add(camRight.clone().multiplyScalar(-halfW))
          .add(camUp.clone().multiplyScalar(-halfH));
        const blNdc = bottomLeft.clone().project(camera);
        const xBL = rect.left + (blNdc.x + 1) / 2 * w;
        const yBL = rect.top + (1 - blNdc.y) / 2 * h;
        overlayEl.style.display = overlayTagsRef.current.length ? 'block' : 'none';
        overlayEl.style.left = `${Math.round(xBL)}px`;
        overlayEl.style.top = `${Math.round(yBL + 6)}px`; // small gap below sprite
      } else if (overlayEl) {
        overlayEl.style.display = 'none';
      }
      requestAnimationFrame(animate);
    };
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
        tags: m.tags || [],
        title: m.title || m.id
      }));
      if (!rawItems.length) { return; }

      const box = new THREE.Box3();
      rawItems.forEach(it => box.expandByPoint(new THREE.Vector3(it.x, it.y, it.z)));
      const size = new THREE.Vector3();
      box.getSize(size);
      const center = new THREE.Vector3();
      box.getCenter(center);
      const radius = Math.max(size.x, size.y, size.z) * 0.6 || 60;
      sceneRadiusRef.current = radius;

      const targetRadius = 60;
      const scale = radius > 0 ? targetRadius / radius : 1;
      const items = rawItems.map(it => ({
        id: it.id,
        x: (it.x - center.x) * scale,
        y: (it.y - center.y) * scale,
        z: (it.z - center.z) * scale,
        url: it.url,
        tags: it.tags,
        title: it.title
      }));

      camera.position.set(0, 0, targetRadius * 2.2);
      controls.target.set(0, 0, 0);
      controls.update();

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
          sp.userData = { id: it.id, baseScale: scaleSprite, tags: it.tags, titleLower: (it.title || '').toLowerCase(), tagsLower: it.tags.map(t => t.toLowerCase()), origRenderOrder: sp.renderOrder };
          sp.renderOrder = Math.floor(-it.z * 1000);
          spritesRef.current.push(sp);
          spriteById.current.set(it.id, sp);
          scene.add(sp);
        });
        applyFilters(selectedTags, searchQuery);
        applySelectionDim();
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

  useEffect(() => {
    // Clear selection when filters/search change so all visible reset to full opacity
    const prev = selectedRef.current;
    if (prev) promoteSelectedOnTop(null, prev);
    selectedRef.current = null;
    applyFilters(selectedTags, searchQuery);
    applySelectionDim();
  }, [selectedTags, searchQuery]);

  function applyFilters(tags: string[], query: string) {
    const tagSet = new Set(tags || []);
    const showAllTags = tagSet.size === 0;
    const q = (query || '').trim().toLowerCase();
    const hasQuery = q.length > 0;
    spritesRef.current.forEach(sp => {
      const tagsLower: string[] = (sp.userData.tagsLower as string[]) || [];
      const titleLower: string = (sp.userData.titleLower as string) || '';
      const tagOk = showAllTags || tagsLower.some(t => tagSet.has(t));
      const textOk = !hasQuery || titleLower.includes(q) || tagsLower.some(t => t.includes(q));
      sp.visible = tagOk && textOk;
    });
  }

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
      <div ref={overlayRef} style={{ position: 'fixed', zIndex: 5, pointerEvents: 'auto', display: 'none' }}>
        <div
          style={{
            display: 'inline-flex',
            gap: 6,
            flexWrap: 'wrap',
            alignItems: 'center',
            background: 'rgba(255,255,255,0.9)',
            border: '1px solid #bbb',
            borderRadius: 8,
            padding: '6px 8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
          }}
        >
          {overlayTags.map(tag => {
            const isSelected = (selectedTags || []).includes(tag);
            return (
              <button
                key={tag}
                onClick={() => onTagClick?.(tag)}
                style={{
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: 999,
                  border: isSelected ? '1px solid #111' : '1px solid #bbb',
                  background: isSelected ? '#111' : '#fff',
                  color: isSelected ? '#fff' : '#111',
                  fontSize: 12,
                  lineHeight: 1.2,
                }}
                title={isSelected ? 'Remove tag filter' : 'Filter by tag'}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}