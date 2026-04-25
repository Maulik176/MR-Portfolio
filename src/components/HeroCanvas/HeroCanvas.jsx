import React, {useEffect, useRef} from 'react';
import * as THREE from 'three';
import {ensureGsapPlugins, gsap, ScrollTrigger} from '../../lib/gsap';
import './HeroCanvas.scss';

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export default function HeroCanvas() {
  const mountRef = useRef(null);

  useEffect(() => {
    ensureGsapPlugins();

    const mount = mountRef.current;
    if (!mount) return undefined;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      // Let browser choose optimal buffer; avoids extra GPU cost on some devices.
      depth: false,
      stencil: false,
    });
    // Keep DPR conservative for smooth scrolling on high-DPI screens.
    renderer.setPixelRatio(clamp(window.devicePixelRatio || 1, 1, 1.35));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.physicallyCorrectLights = false;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 4.4);

    const group = new THREE.Group();
    scene.add(group);

    // Depth layers for scroll parallax (cheap: a few groups + one ScrollTrigger timeline).
    const backLayer = new THREE.Group();
    const midLayer = new THREE.Group();
    const frontLayer = new THREE.Group();
    scene.add(backLayer);
    scene.add(midLayer);
    scene.add(frontLayer);

    const lights = new THREE.Group();
    lights.add(new THREE.AmbientLight(0xffffff, 0.9));
    const key = new THREE.DirectionalLight(0xffffff, 1.25);
    key.position.set(3.5, 2.5, 4.5);
    lights.add(key);
    scene.add(lights);

    // Detail 36 is extremely expensive. Keep this moderate for stable FPS.
    const geometry = new THREE.IcosahedronGeometry(1.15, 6);
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#19f4b6'),
      roughness: 0.22,
      metalness: 0.15,
      transparent: true,
      opacity: 0.92,
    });
    const blob = new THREE.Mesh(geometry, material);
    group.add(blob);

    const wire = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        wireframe: true,
        transparent: true,
        opacity: 0.06,
      })
    );
    group.add(wire);

    const particlesCount = 520;
    const positions = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount; i += 1) {
      const i3 = i * 3;
      // Distribute around a loose sphere shell
      const r = 3 + Math.random() * 2.3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.cos(phi);
      positions[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const pGeom = new THREE.BufferGeometry();
    pGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pMat = new THREE.PointsMaterial({
      size: 0.011,
      color: new THREE.Color('#d8fff5'),
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    const stars = new THREE.Points(pGeom, pMat);
    stars.position.z = -0.55;
    backLayer.add(stars);

    // Mid dust (very light) for depth.
    const midCount = 260;
    const midPos = new Float32Array(midCount * 3);
    for (let i = 0; i < midCount; i += 1) {
      const i3 = i * 3;
      const r = 2.2 + Math.random() * 2.0;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      midPos[i3] = r * Math.sin(phi) * Math.cos(theta);
      midPos[i3 + 1] = r * Math.cos(phi);
      midPos[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const midGeom = new THREE.BufferGeometry();
    midGeom.setAttribute('position', new THREE.BufferAttribute(midPos, 3));
    const midMat = new THREE.PointsMaterial({
      size: 0.018,
      color: new THREE.Color('#19f4b6'),
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const midDust = new THREE.Points(midGeom, midMat);
    midDust.position.z = 0.05;
    midLayer.add(midDust);

    // Front glints (few, larger) for "lens" depth without heavy shaders.
    const glintCount = 42;
    const glintPos = new Float32Array(glintCount * 3);
    for (let i = 0; i < glintCount; i += 1) {
      const i3 = i * 3;
      const r = 1.3 + Math.random() * 1.6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      glintPos[i3] = r * Math.sin(phi) * Math.cos(theta);
      glintPos[i3 + 1] = r * Math.cos(phi);
      glintPos[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const glintGeom = new THREE.BufferGeometry();
    glintGeom.setAttribute('position', new THREE.BufferAttribute(glintPos, 3));
    const glintMat = new THREE.PointsMaterial({
      size: 0.032,
      color: new THREE.Color('#ffffff'),
      transparent: true,
      opacity: 0.05,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const glints = new THREE.Points(glintGeom, glintMat);
    glints.position.z = 0.75;
    frontLayer.add(glints);

    mount.appendChild(renderer.domElement);

    let bounds = mount.getBoundingClientRect();
    let baseScale = 1;
    let baseCamZ = 4.4;
    let smallPhone = false;
    let refreshRaf = 0;
    const scheduleScrollRefresh = () => {
      if (refreshRaf) return;
      refreshRaf = window.requestAnimationFrame(() => {
        refreshRaf = 0;
        try {
          ScrollTrigger.refresh();
        } catch (_) {
          // no-op
        }
      });
    };
    const resize = () => {
      bounds = mount.getBoundingClientRect();
      const {width, height} = bounds;
      camera.aspect = width / Math.max(1, height);

      // Portrait/mobile screens make the sphere feel too large behind the portrait.
      // We treat "small phone" more aggressively, and also reduce extra front layers.
      const aspect = camera.aspect;
      smallPhone = width < 520 || aspect < 0.72;
      const compact = width < 740 || aspect < 0.9;

      baseScale = smallPhone ? 0.56 : compact ? 0.74 : 1;
      baseCamZ = smallPhone ? 7.2 : compact ? 5.9 : 4.4;
      camera.position.z = baseCamZ;
      group.scale.set(baseScale, baseScale, baseScale);
      // Push sphere slightly downward on small phones so it reads as a backdrop.
      group.position.y = smallPhone ? -0.55 : compact ? -0.25 : 0;

      // Remove "sparkle" artifacts on small phones (they can land near the face).
      midDust.visible = !smallPhone;
      glints.visible = !smallPhone;

      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      if (!prefersReducedMotion) scheduleScrollRefresh();
    };
    resize();
    window.addEventListener('resize', resize);

    let mouseX = 0;
    let mouseY = 0;
    const onPointerMove = (e) => {
      const {width, height, left, top} = bounds;
      const nx = ((e.clientX - left) / Math.max(1, width)) * 2 - 1;
      const ny = ((e.clientY - top) / Math.max(1, height)) * 2 - 1;
      mouseX = clamp(nx, -1, 1);
      mouseY = clamp(ny, -1, 1);
    };
    // Throttle pointer updates to avoid work on every mouse event.
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

    // GSAP intro
    if (!prefersReducedMotion) {
      gsap.set(group.scale, {x: baseScale * 0.7, y: baseScale * 0.7, z: baseScale * 0.7});
      gsap.set(group.position, {z: -0.25});
      gsap.fromTo(
        group.scale,
        {x: baseScale * 0.65, y: baseScale * 0.65, z: baseScale * 0.65},
        {x: baseScale, y: baseScale, z: baseScale, duration: 1.25, ease: 'expo.out'}
      );
      gsap.fromTo(material, {opacity: 0}, {opacity: 0.92, duration: 0.9, ease: 'sine.out'});
      gsap.fromTo(pMat, {opacity: 0}, {opacity: 0.55, duration: 1.1, ease: 'sine.out', delay: 0.15});
    }

    // Scroll-driven rotation (GSAP + ScrollTrigger)
    let scrollRotY = 0;
    const st = ScrollTrigger.create({
      trigger: mount,
      start: 'top top',
      end: 'bottom top',
      scrub: 0.5,
      onUpdate: (self) => {
        if (prefersReducedMotion) return;
        scrollRotY = self.progress * Math.PI * 1.8;
      },
    });

    // Scroll-linked depth parallax (3 layers move at different speeds).
    let parallaxTl = null;
    if (!prefersReducedMotion) {
      parallaxTl = gsap.timeline({
        scrollTrigger: {
          trigger: document.body,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.5,
          invalidateOnRefresh: true,
        },
      });

      parallaxTl.to(backLayer.position, {x: -0.20, y: 0.22, z: -0.90, ease: 'none'}, 0);
      parallaxTl.to(midLayer.position, {x: 0.10, y: 0.10, z: -0.05, ease: 'none'}, 0);
      parallaxTl.to(frontLayer.position, {x: 0.24, y: -0.06, z: 0.68, ease: 'none'}, 0);
      parallaxTl.to(camera.position, {z: () => baseCamZ + 0.22, ease: 'none'}, 0);
    }

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
    };

    // Only animate when needed; keeps scroll smoother on weaker GPUs.
    const tick = () => {
      if (!running) return;
      const t = clock.getElapsedTime();

      // Idle motion + subtle parallax
      const targetRotX = (prefersReducedMotion ? 0 : mouseY) * -0.22 + Math.sin(t * 0.55) * 0.03;
      const targetRotZ = (prefersReducedMotion ? 0 : mouseX) * -0.12 + Math.cos(t * 0.45) * 0.02;
      group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, targetRotX, 0.06);
      group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, targetRotZ, 0.06);

      if (!prefersReducedMotion) {
        // Keep y rotation stable: scroll sets the base, we add a small autosweep.
        group.rotation.y = scrollRotY + t * 0.18;
        backLayer.rotation.y = t * 0.03;
        backLayer.rotation.x = t * 0.01;
        midLayer.rotation.y = -t * 0.02;
        frontLayer.rotation.y = t * 0.015;
      }

      renderer.render(scene, camera);
      raf = window.requestAnimationFrame(tick);
    };

    // Pause rendering when offscreen or tab is hidden for smoother scroll.
    const io = new IntersectionObserver(
      ([entry]) => {
        inView = Boolean(entry && entry.isIntersecting);
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

    // Render once even if reduced motion is on.
    if (prefersReducedMotion) {
      renderer.render(scene, camera);
    } else {
      start();
    }

    return () => {
      window.removeEventListener('resize', resize);
      mount.removeEventListener('pointermove', onPointerMoveThrottled);
      if (refreshRaf) {
        window.cancelAnimationFrame(refreshRaf);
        refreshRaf = 0;
      }
      st.kill();
      if (parallaxTl) {
        try {
          parallaxTl.scrollTrigger && parallaxTl.scrollTrigger.kill();
        } catch (_) {
          // no-op
        }
        try {
          parallaxTl.kill();
        } catch (_) {
          // no-op
        }
      }
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);

      window.cancelAnimationFrame(raf);
      mount.removeChild(renderer.domElement);

      pGeom.dispose();
      pMat.dispose();
      midGeom.dispose();
      midMat.dispose();
      glintGeom.dispose();
      glintMat.dispose();
      geometry.dispose();
      material.dispose();
      wire.material.dispose();
      renderer.dispose();
    };
  }, []);

  return <div className="heroCanvas" ref={mountRef} aria-hidden="true" />;
}
