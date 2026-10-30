'use client';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
export default function HeroScene() {
  const host = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); } catch { setFailed(true); return; }
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.z = 7;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    const group = new THREE.Group();
    const material = new THREE.MeshNormalMaterial();
    const geometry = new THREE.BoxGeometry(0.22, 2.4, 0.45);
    const capGeometry = new THREE.BoxGeometry(0.8, 0.22, 0.45);
    for (const side of [-1, 1]) {
      const spine = new THREE.Mesh(geometry, material); spine.position.x = side * 1.1; group.add(spine);
      for (const y of [-1.1, 1.1]) { const cap = new THREE.Mesh(capGeometry, material); cap.position.set(side * 0.8, y, 0); group.add(cap); }
    }
    scene.add(group);
    const resize = () => { const { width, height } = container.getBoundingClientRect(); renderer.setSize(width, height); camera.aspect = width / Math.max(height, 1); camera.updateProjectionMatrix(); };
    const observer = new ResizeObserver(resize); observer.observe(container); resize();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    const render = () => { if (!reduced.matches) group.rotation.y += 0.006; group.rotation.x = 0.18; renderer.render(scene, camera); frame = requestAnimationFrame(render); }; render();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); geometry.dispose(); capGeometry.dispose(); material.dispose(); renderer.dispose(); renderer.domElement.remove(); };
  }, []);
  return failed ? <span className="scene-status">3D unavailable — showing the static artwork.</span> : <div ref={host} className="scene" aria-hidden="true" />;
}
