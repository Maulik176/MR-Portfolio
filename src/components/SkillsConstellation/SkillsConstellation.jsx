import React, {useEffect, useMemo, useRef, useState} from 'react';
import * as THREE from 'three';
import {ensureGsapPlugins, gsap} from '../../lib/gsap';
import './SkillsConstellation.scss';

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function fibonacciSpherePoints(count, radius) {
  const pts = [];
  const offset = 2 / count;
  const increment = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i += 1) {
    const y = i * offset - 1 + offset / 2;
    const r = Math.sqrt(1 - y * y);
    const phi = i * increment;
    pts.push(new THREE.Vector3(Math.cos(phi) * r * radius, y * radius, Math.sin(phi) * r * radius));
  }
  return pts;
}

function makeGlowTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const grd = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.22, 'rgba(255,255,255,0.85)');
  grd.addColorStop(0.55, 'rgba(255,255,255,0.18)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function buildConnections(points, k) {
  const edges = new Set();
  const edgePairs = [];

  for (let i = 0; i < points.length; i += 1) {
    const dists = [];
    for (let j = 0; j < points.length; j += 1) {
      if (i === j) continue;
      const d = points[i].distanceToSquared(points[j]);
      dists.push({j, d});
    }
    dists.sort((a, b) => a.d - b.d);
    for (let n = 0; n < Math.min(k, dists.length); n += 1) {
      const j = dists[n].j;
      const a = Math.min(i, j);
      const b = Math.max(i, j);
      const key = `${a}:${b}`;
      if (edges.has(key)) continue;
      edges.add(key);
      edgePairs.push([a, b]);
    }
  }
  return edgePairs;
}

export default function SkillsConstellation({skills}) {
  const mountRef = useRef(null);
  const [active, setActive] = useState({name: null, iconUrl: null});

  const nodes = useMemo(() => {
    const list = Array.isArray(skills) ? skills : [];
    // Cap to keep perf stable
    return list.slice(0, 48).map((s) => ({
      name: s?.name || 'Skill',
      color: s?.bgColor || '#19f4b6',
      iconUrl: s?.iconUrl || '',
    }));
  }, [skills]);

  useEffect(() => {
    ensureGsapPlugins();

    const mount = mountRef.current;
    if (!mount || nodes.length === 0) return undefined;
    let isUnmounted = false;
    const iconTextures = new Set();

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      depth: false,
      stencil: false,
    });
    renderer.setPixelRatio(clamp(window.devicePixelRatio || 1, 1, 1.35));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(0, 0, 5.6);

    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambient);
    const rim = new THREE.DirectionalLight(0xffffff, 0.9);
    rim.position.set(-4, 2, 5);
    scene.add(rim);

    const group = new THREE.Group();
    scene.add(group);

    const radius = 2.2;
    const targets = fibonacciSpherePoints(nodes.length, radius);
    const edgePairs = buildConnections(targets, 3);

    const loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';

    const nodeGroups = [];
    const hitMeshes = [];
    const visuals = [];

    const hitGeom = new THREE.SphereGeometry(0.18, 12, 12);
    const hitMat = new THREE.MeshBasicMaterial({transparent: true, opacity: 0});

    const glowTex = makeGlowTexture();
    const bgGeom = new THREE.CircleGeometry(0.17, 32);

    nodes.forEach((n, i) => {
      const node = new THREE.Group();
      node.userData = {name: n.name, index: i, iconUrl: n.iconUrl || ''};
      node.position.set(0, 0, 0);

      // Raycast target
      const hit = new THREE.Mesh(hitGeom, hitMat);
      hit.userData = {index: i};
      node.add(hit);
      hitMeshes.push(hit);

      const bg = new THREE.Mesh(bgGeom, new THREE.MeshBasicMaterial({
        color: new THREE.Color(n.color),
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      }));
      bg.position.set(0, 0, 0);
      node.add(bg);

      // Always-visible glowing dot (kept subtle so the logo is the hero).
      const dotMat = new THREE.SpriteMaterial({
        map: glowTex || null,
        color: new THREE.Color(n.color),
        transparent: true,
        opacity: 0.52,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      });
      const dot = new THREE.Sprite(dotMat);
      dot.scale.set(0.30, 0.30, 0.30);
      dot.renderOrder = 5;
      node.add(dot);

      const haloMat = new THREE.SpriteMaterial({
        map: glowTex || null,
        color: new THREE.Color(n.color),
        transparent: true,
        opacity: 0.16,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      });
      const halo = new THREE.Sprite(haloMat);
      halo.scale.set(0.56, 0.56, 0.56);
      halo.renderOrder = 4;
      node.add(halo);

      // Small dark badge behind the icon to keep it readable regardless of icon colors.
      const plateMat = new THREE.SpriteMaterial({
        map: glowTex || null,
        color: new THREE.Color('#0a0f1c'),
        transparent: true,
        opacity: 0.38,
        depthWrite: false,
        depthTest: false,
        blending: THREE.NormalBlending,
      });
      const plate = new THREE.Sprite(plateMat);
      plate.scale.set(0.46, 0.46, 0.46);
      plate.renderOrder = 11;
      node.add(plate);

      let sprite = null;
      let spriteMaterial = null;
      if (n.iconUrl) {
        spriteMaterial = new THREE.SpriteMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.78,
          alphaTest: 0.02,
          depthTest: false,
          depthWrite: false,
        });
        sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(0.44, 0.44, 0.44);
        sprite.renderOrder = 12;
        node.add(sprite);

        loader.load(
          n.iconUrl,
          (tex) => {
            if (isUnmounted) {
              tex.dispose();
              return;
            }
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4);
            spriteMaterial.map = tex;
            spriteMaterial.needsUpdate = true;
            iconTextures.add(tex);
          },
          undefined,
          () => {
            // Fallback: leave sprite without texture
          }
        );
      }

      group.add(node);
      nodeGroups.push(node);
      visuals.push({bg, dot, dotMat, halo, haloMat, plate, plateMat, sprite, spriteMaterial});
    });

    // Link lines
    const lineGeom = new THREE.BufferGeometry();
    const linePositions = new Float32Array(edgePairs.length * 2 * 3);
    lineGeom.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    });
    const lines = new THREE.LineSegments(lineGeom, lineMat);
    group.add(lines);

    // Dust particles for depth
    const dustCount = 520;
    const dustPositions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i += 1) {
      const i3 = i * 3;
      const r = 3.2 + Math.random() * 1.6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      dustPositions[i3] = r * Math.sin(phi) * Math.cos(theta);
      dustPositions[i3 + 1] = r * Math.cos(phi);
      dustPositions[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const dustGeom = new THREE.BufferGeometry();
    dustGeom.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dustMat = new THREE.PointsMaterial({
      size: 0.012,
      color: new THREE.Color('#b7fff0'),
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const dust = new THREE.Points(dustGeom, dustMat);
    group.add(dust);

    mount.appendChild(renderer.domElement);

    let bounds = mount.getBoundingClientRect();
    let boundsDirty = false;

    const refreshBounds = () => {
      bounds = mount.getBoundingClientRect();
      boundsDirty = false;
    };

    const markBoundsDirty = () => {
      boundsDirty = true;
    };

    const resize = () => {
      refreshBounds();
      const {width, height} = bounds;
      camera.aspect = width / Math.max(1, height);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    resize();
    window.addEventListener('resize', resize);
    // Scrolling changes the element's top/left; keep cached bounds correct for raycasting.
    window.addEventListener('scroll', markBoundsDirty, {passive: true});

    // Animate nodes outward (GSAP)
    let linesDirty = true;
    let introTl = null;
    if (!prefersReducedMotion) {
      introTl = gsap.timeline({defaults: {duration: 1.1, ease: 'expo.out'}});
      nodeGroups.forEach((node, i) => {
        const t = targets[i];
        introTl.to(node.position, {x: t.x, y: t.y, z: t.z}, i === 0 ? 0 : 0.03);
        introTl.fromTo(node.scale, {x: 0.6, y: 0.6, z: 0.6}, {x: 1, y: 1, z: 1}, '<');
      });
      introTl.eventCallback('onUpdate', () => {
        linesDirty = true;
      });
    } else {
      nodeGroups.forEach((node, i) => node.position.copy(targets[i]));
    }

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2(0, 0);
    let hoverIndex = -1;
    let prevHoverIndex = -1;
    let pointerDirty = true;

    // Interactivity state (kept out of React to avoid re-rendering).
    let pinnedIndex = -1;
    let dragging = false;
    let dragMoved = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let lastDragX = 0;
    let lastDragY = 0;
    let velX = 0;
    let velY = 0;
    let rotX = 0;
    let rotY = 0;

    const setActiveFromIndex = (idx) => {
      if (idx < 0) {
        setActive({name: null, iconUrl: null});
        return;
      }
      const n = nodeGroups[idx];
      if (!n) return;
      setActive({name: n.userData.name, iconUrl: n.userData.iconUrl || null});
    };

    const onPointerMove = (e) => {
      // Always refresh bounds on pointer movement.
      // Scrolling/transforms can change the element's top/left without a resize event.
      bounds = mount.getBoundingClientRect();
      boundsDirty = false;

      const {width, height, left, top} = bounds;
      const x = ((e.clientX - left) / Math.max(1, width)) * 2 - 1;
      const y = -(((e.clientY - top) / Math.max(1, height)) * 2 - 1);
      pointer.set(clamp(x, -1, 1), clamp(y, -1, 1));
      pointerDirty = true;

      // Drag rotation is event-driven (no extra per-frame cost).
      if (dragging) onPointerDragMove(e);
    };
    // Throttle pointer updates to one per frame.
    let pointerScheduled = false;
    let lastPointerEvent = null;
    const onPointerMoveThrottled = (e) => {
      lastPointerEvent = e;
      if (pointerScheduled) return;
      pointerScheduled = true;
      window.requestAnimationFrame(() => {
        pointerScheduled = false;
        if (lastPointerEvent) onPointerMove(lastPointerEvent);
      });
    };
    mount.addEventListener('pointermove', onPointerMoveThrottled, {passive: true});
    mount.addEventListener('pointerenter', markBoundsDirty, {passive: true});

    const levelFor = (idx) => {
      if (idx < 0) return 0;
      if (!dragging && idx === hoverIndex) return 2; // hover wins
      if (idx === pinnedIndex) return 1;
      return 0;
    };

    const applyLevel = (idx, level) => {
      if (idx < 0) return;
      const node = nodeGroups[idx];
      const v = visuals[idx];
      if (!node || !v) return;

      const isHover = level === 2;
      const isPinned = level === 1;

      const nodeScale = isHover ? 1.45 : isPinned ? 1.28 : 1;
      const dotScale = isHover ? 0.44 : isPinned ? 0.38 : 0.30;
      const haloScale = isHover ? 0.86 : isPinned ? 0.72 : 0.56;
      const dotOpacity = isHover ? 0.92 : isPinned ? 0.74 : 0.52;
      const haloOpacity = isHover ? 0.42 : isPinned ? 0.26 : 0.16;
      const plateScale = isHover ? 0.56 : isPinned ? 0.50 : 0.46;
      const plateOpacity = isHover ? 0.58 : isPinned ? 0.46 : 0.38;
      const iconScale = isHover ? 0.58 : isPinned ? 0.50 : 0.44;
      const iconOpacity = isHover ? 1 : isPinned ? 0.92 : 0.78;

      if (!prefersReducedMotion) {
        gsap.to(node.scale, {x: nodeScale, y: nodeScale, z: nodeScale, duration: 0.22, ease: 'power2.out', overwrite: 'auto'});
        gsap.to(v.dot.scale, {x: dotScale, y: dotScale, duration: 0.22, ease: 'power2.out', overwrite: 'auto'});
        gsap.to(v.halo.scale, {x: haloScale, y: haloScale, duration: 0.22, ease: 'power2.out', overwrite: 'auto'});
        gsap.to(v.dotMat, {opacity: dotOpacity, duration: 0.22, ease: 'power2.out', overwrite: 'auto'});
        gsap.to(v.haloMat, {opacity: haloOpacity, duration: 0.22, ease: 'power2.out', overwrite: 'auto'});
        gsap.to(v.plate.scale, {x: plateScale, y: plateScale, duration: 0.22, ease: 'power2.out', overwrite: 'auto'});
        gsap.to(v.plateMat, {opacity: plateOpacity, duration: 0.22, ease: 'power2.out', overwrite: 'auto'});
        if (v.sprite) gsap.to(v.sprite.scale, {x: iconScale, y: iconScale, duration: 0.22, ease: 'power2.out', overwrite: 'auto'});
        if (v.spriteMaterial) gsap.to(v.spriteMaterial, {opacity: iconOpacity, duration: 0.22, ease: 'power2.out', overwrite: 'auto'});
      } else {
        node.scale.set(nodeScale, nodeScale, nodeScale);
        v.dot.scale.set(dotScale, dotScale, 1);
        v.halo.scale.set(haloScale, haloScale, 1);
        v.dotMat.opacity = dotOpacity;
        v.haloMat.opacity = haloOpacity;
        v.plate.scale.set(plateScale, plateScale, 1);
        v.plateMat.opacity = plateOpacity;
        if (v.sprite) v.sprite.scale.set(iconScale, iconScale, 1);
        if (v.spriteMaterial) v.spriteMaterial.opacity = iconOpacity;
      }
    };

    const setPinned = (idx) => {
      const prev = pinnedIndex;
      pinnedIndex = idx;
      // Update visuals for prev/new pinned based on current hover.
      applyLevel(prev, levelFor(prev));
      applyLevel(pinnedIndex, levelFor(pinnedIndex));
      if (hoverIndex < 0) setActiveFromIndex(pinnedIndex);
    };

    const onPointerDown = (e) => {
      if (prefersReducedMotion) return;
      dragging = true;
      dragMoved = false;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      lastDragX = e.clientX;
      lastDragY = e.clientY;
      velX = 0;
      velY = 0;

      // Stop hover while dragging for a cleaner "play" feel.
      if (hoverIndex >= 0) {
        applyLevel(hoverIndex, hoverIndex === pinnedIndex ? 1 : 0);
        hoverIndex = -1;
        prevHoverIndex = -1;
        if (pinnedIndex >= 0) setActiveFromIndex(pinnedIndex);
        else setActive({name: null, iconUrl: null});
      }

      try {
        mount.setPointerCapture(e.pointerId);
      } catch (_) {
        // no-op
      }
    };

    const onPointerUp = (e) => {
      if (!dragging) return;
      dragging = false;

      const movedEnough = dragMoved || Math.hypot(e.clientX - dragStartX, e.clientY - dragStartY) > 6;
      if (!movedEnough) {
        // Treat as click: pin/unpin node.
        onPointerMove(e);
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(hitMeshes, false);
        const idx = hits.length ? hits[0].object.userData.index : -1;
        if (idx >= 0) setPinned(pinnedIndex === idx ? -1 : idx);
      }

      try {
        mount.releasePointerCapture(e.pointerId);
      } catch (_) {
        // no-op
      }
    };

    const onPointerDragMove = (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastDragX;
      const dy = e.clientY - lastDragY;
      lastDragX = e.clientX;
      lastDragY = e.clientY;

      if (!dragMoved && Math.hypot(e.clientX - dragStartX, e.clientY - dragStartY) > 4) {
        dragMoved = true;
      }

      // Scale by viewport size so it feels consistent.
      const denom = Math.max(280, bounds.width || 1);
      const k = 2.8 / denom;
      velY = dx * k;
      velX = dy * k;
      rotY += velY;
      rotX = clamp(rotX + velX, -0.55, 0.55);
    };

    mount.addEventListener('pointerdown', onPointerDown);
    mount.addEventListener('pointerup', onPointerUp);
    mount.addEventListener('pointercancel', onPointerUp);

    const killHoverTweens = () => {
      // Prevent GSAP tweens from continuing while the canvas is paused/offscreen.
      try {
        gsap.killTweensOf(nodeGroups.map((n) => n.scale));
        visuals.forEach((v) => {
          if (v.dot) gsap.killTweensOf(v.dot.scale);
          if (v.halo) gsap.killTweensOf(v.halo.scale);
          if (v.plate) gsap.killTweensOf(v.plate.scale);
          if (v.sprite) gsap.killTweensOf(v.sprite.scale);
          if (v.dotMat) gsap.killTweensOf(v.dotMat);
          if (v.haloMat) gsap.killTweensOf(v.haloMat);
          if (v.plateMat) gsap.killTweensOf(v.plateMat);
          if (v.spriteMaterial) gsap.killTweensOf(v.spriteMaterial);
        });
      } catch (_) {
        // no-op
      }
    };

    const resetHover = () => {
      hoverIndex = -1;
      prevHoverIndex = -1;
      pinnedIndex = -1;
      setActive({name: null, iconUrl: null});
      // Force "no hit" until the next pointermove updates the pointer coords.
      pointer.set(2, 2);
      pointerDirty = false;

      nodeGroups.forEach((node) => node.scale.set(1, 1, 1));
      visuals.forEach((v) => {
        if (v.dotMat) v.dotMat.opacity = 0.52;
        if (v.haloMat) v.haloMat.opacity = 0.16;
        if (v.plateMat) v.plateMat.opacity = 0.38;
        if (v.spriteMaterial) v.spriteMaterial.opacity = 0.78;
        if (v.dot) v.dot.scale.set(0.30, 0.30, 1);
        if (v.halo) v.halo.scale.set(0.56, 0.56, 1);
        if (v.plate) v.plate.scale.set(0.46, 0.46, 1);
        if (v.sprite) v.sprite.scale.set(0.44, 0.44, 1);
      });
    };

    mount.addEventListener('pointerleave', resetHover);

    const updateLines = () => {
      // Connect nodes by nearest-neighbor edges
      const posAttr = lineGeom.getAttribute('position');
      for (let e = 0; e < edgePairs.length; e += 1) {
        const [aIdx, bIdx] = edgePairs[e];
        const a = nodeGroups[aIdx].position;
        const b = nodeGroups[bIdx].position;
        const base = e * 2;
        posAttr.setXYZ(base, a.x, a.y, a.z);
        posAttr.setXYZ(base + 1, b.x, b.y, b.z);
      }
      posAttr.needsUpdate = true;
    };
    updateLines();
    linesDirty = false;

    const clock = new THREE.Clock();
    let raf = 0;
    let running = false;
    let inView = true;
    let pageVisible = typeof document !== 'undefined' ? !document.hidden : true;

    const start = () => {
      if (running || prefersReducedMotion) return;
      running = true;
      raf = window.requestAnimationFrame(tick);
    };

    const stop = () => {
      if (!running) return;
      running = false;
      window.cancelAnimationFrame(raf);
      raf = 0;
      killHoverTweens();
      resetHover();
    };

    const tick = () => {
      if (!running) return;
      const t = clock.getElapsedTime();

      if (boundsDirty) refreshBounds();

      if (!prefersReducedMotion) {
        // Idle drift is subtle. The main "play" interaction is drag + inertia.
        if (!dragging) {
          velX *= 0.92;
          velY *= 0.92;
          rotY += velY + 0.0008;
          rotX = clamp(rotX + velX, -0.55, 0.55);
        }
        group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, rotY, 0.14);
        group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, rotX, 0.14);
        dust.rotation.y = -t * 0.03;
      }

      // Ultra-smooth: only raycast when pointer moved or when we already have a hover.
      let nextHover = hoverIndex;
      if (!dragging && (pointerDirty || hoverIndex !== -1)) {
        pointerDirty = false;
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(hitMeshes, false);
        nextHover = hits.length ? hits[0].object.userData.index : -1;
      }
      if (nextHover !== hoverIndex) {
        prevHoverIndex = hoverIndex;
        hoverIndex = nextHover;
        if (hoverIndex >= 0) setActiveFromIndex(hoverIndex);
        else if (pinnedIndex >= 0) setActiveFromIndex(pinnedIndex);
        else setActive({name: null, iconUrl: null});

        // Reset previous hovered node and apply state to new hovered node.
        applyLevel(prevHoverIndex, levelFor(prevHoverIndex));
        applyLevel(hoverIndex, levelFor(hoverIndex));
      }

      if (linesDirty) {
        updateLines();
        linesDirty = false;
      }

      renderer.render(scene, camera);
      raf = window.requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        inView = Boolean(entry && entry.isIntersecting);
        if (inView) refreshBounds();
        if (inView && pageVisible) start();
        else stop();
      },
      {threshold: 0.05}
    );
    io.observe(mount);

    const onVis = () => {
      pageVisible = !document.hidden;
      if (pageVisible && inView) start();
      else stop();
    };
    document.addEventListener('visibilitychange', onVis);

    if (prefersReducedMotion) {
      renderer.render(scene, camera);
    } else {
      start();
    }

    return () => {
      isUnmounted = true;
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', markBoundsDirty);
      mount.removeEventListener('pointermove', onPointerMoveThrottled);
      mount.removeEventListener('pointerenter', markBoundsDirty);
      mount.removeEventListener('pointerleave', resetHover);
      mount.removeEventListener('pointerdown', onPointerDown);
      mount.removeEventListener('pointerup', onPointerUp);
      mount.removeEventListener('pointercancel', onPointerUp);
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      window.cancelAnimationFrame(raf);
      if (introTl) introTl.kill();
      killHoverTweens();
      mount.removeChild(renderer.domElement);

      lineGeom.dispose();
      lineMat.dispose();
      hitGeom.dispose();
      hitMat.dispose();
      dustGeom.dispose();
      dustMat.dispose();
      bgGeom.dispose();
      iconTextures.forEach((tex) => {
        if (tex && typeof tex.dispose === 'function') tex.dispose();
      });
      iconTextures.clear();
      visuals.forEach((v) => {
        if (v.spriteMaterial && typeof v.spriteMaterial.dispose === 'function') {
          v.spriteMaterial.map = null;
          v.spriteMaterial.dispose();
        }
        if (v.dotMat && typeof v.dotMat.dispose === 'function') v.dotMat.dispose();
        if (v.haloMat && typeof v.haloMat.dispose === 'function') v.haloMat.dispose();
        if (v.plateMat && typeof v.plateMat.dispose === 'function') v.plateMat.dispose();
        if (v.bg && v.bg.material && typeof v.bg.material.dispose === 'function') v.bg.material.dispose();
      });
      if (glowTex && typeof glowTex.dispose === 'function') glowTex.dispose();
      renderer.dispose();
    };
  }, [nodes]);

  if (nodes.length === 0) return null;

  return (
    <div className="skillsConstellation js-reveal">
      <div className="skillsConstellation__canvas" ref={mountRef} aria-hidden="true" />
      <div className="skillsConstellation__label">
        <span className="skillsConstellation__labelTitle">Drag to rotate • Click to pin</span>
        <span className="skillsConstellation__labelValue">
          {active?.iconUrl ? (
            <img className="skillsConstellation__labelIcon" src={active.iconUrl} alt="" />
          ) : null}
          <span>{active?.name || 'Skills constellation'}</span>
        </span>
      </div>
    </div>
  );
}
