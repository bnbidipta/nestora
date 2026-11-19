'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CompassRoseIcon, CantileverBeamIcon, SunArcIcon, AcousticWaveIcon, ShieldVerifiedIcon } from './BespokeIcons';

interface Hotspot {
  id: string;
  label: string;
  category: string;
  detail: string;
  metric: string;
  icon: React.ReactNode;
}

const HOTSPOTS: Hotspot[] = [
  {
    id: 'foundation',
    label: 'Isolated Raft Footing',
    category: 'Subsurface Geotech',
    detail: 'Soil bearing verified at 150 kN/m² with zero differential settlement under maximum dead + live load.',
    metric: '150 kN/m² Capacity',
    icon: <CantileverBeamIcon className="w-4 h-4 text-sage-800" />
  },
  {
    id: 'cantilever',
    label: 'Solar Cantilever Louvers',
    category: 'Bioclimatic Envelope',
    detail: 'Calculated 1.2m shading projection cuts peak Mumbai midday heat gain by 68% while allowing winter daylight.',
    metric: '32° Solar Cutoff',
    icon: <SunArcIcon className="w-4 h-4 text-champagne" />
  },
  {
    id: 'acoustic',
    label: 'Acoustic Double Facade',
    category: 'Sound Dampening',
    detail: 'Dampens road traffic noise down from 68 dB to an ambient 32 dB whisper in living and sleeping zones.',
    metric: 'STC-48 Sound Rating',
    icon: <AcousticWaveIcon className="w-4 h-4 text-sage-700" />
  }
];

export default function ArchitecturalPavilion3D({ scrollProgress = 0 }: { scrollProgress?: number }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activeHotspot, setActiveHotspot] = useState<Hotspot>(HOTSPOTS[1]);
  const [isWireframe, setIsWireframe] = useState<boolean>(false);
  const wireframeRef = useRef<boolean>(false);
  wireframeRef.current = isWireframe;
  const scrollRef = useRef<number>(0);
  scrollRef.current = scrollProgress;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || 600;
    let height = container.clientHeight || 560;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xF7F6F2);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    camera.position.set(5.8, 3.6, 6.2);
    camera.lookAt(0, 0.3, 0);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff6e5, 2.0);
    sunLight.position.set(9, 14, 7);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 30;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    const softFill = new THREE.DirectionalLight(0xcedcd3, 0.8);
    softFill.position.set(-8, 5, -5);
    scene.add(softFill);

    // Interior Warm Glow
    const interiorGlow = new THREE.PointLight(0xffd59e, 1.5, 6);
    interiorGlow.position.set(0, 0.6, 0);
    scene.add(interiorGlow);

    // 5. Villa Group
    const villaGroup = new THREE.Group();
    scene.add(villaGroup);

    // Ground Plane
    const groundGeo = new THREE.PlaneGeometry(16, 16);
    const groundMat = new THREE.MeshStandardMaterial({ 
      color: 0xEFECE4,
      roughness: 0.95
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.8;
    ground.receiveShadow = true;
    villaGroup.add(ground);

    // Fine Architectural Grid
    const grid = new THREE.GridHelper(12, 24, 0xD3CDC0, 0xE5E1D6);
    grid.position.y = -0.79;
    villaGroup.add(grid);

    // Building Materials (Tracked for Wireframe Toggle)
    const architecturalMeshes: THREE.Mesh[] = [];

    // Foundation Plinth
    const plinthGeo = new THREE.BoxGeometry(4.4, 0.4, 3.6);
    const plinthMat = new THREE.MeshStandardMaterial({ color: 0xD6D0C4, roughness: 0.8 });
    const plinth = new THREE.Mesh(plinthGeo, plinthMat);
    plinth.position.set(0, -0.6, 0);
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    villaGroup.add(plinth);
    architecturalMeshes.push(plinth);

    // Ground Floor Living Volume (Warm Limestone)
    const gfGeo = new THREE.BoxGeometry(3.8, 1.35, 3.0);
    const gfMat = new THREE.MeshStandardMaterial({ color: 0xF2EFE9, roughness: 0.6 });
    const gfVolume = new THREE.Mesh(gfGeo, gfMat);
    gfVolume.position.set(-0.2, 0.28, 0);
    gfVolume.castShadow = true;
    gfVolume.receiveShadow = true;
    villaGroup.add(gfVolume);
    architecturalMeshes.push(gfVolume);

    // Ground Floor Glass Opening (Low-Iron Sage Glass)
    const glassGeo = new THREE.BoxGeometry(2.6, 1.15, 0.08);
    const glassMat = new THREE.MeshPhysicalMaterial({ 
      color: 0xB8C8BD,
      transparent: true,
      opacity: 0.5,
      roughness: 0.1,
      transmission: 0.7
    });
    const gfGlass = new THREE.Mesh(glassGeo, glassMat);
    gfGlass.position.set(-0.2, 0.28, 1.51);
    villaGroup.add(gfGlass);
    architecturalMeshes.push(gfGlass);

    // Cantilevered Upper Volume (Deep Architectural Sage)
    const ufGeo = new THREE.BoxGeometry(4.0, 1.3, 3.4);
    const ufMat = new THREE.MeshStandardMaterial({ color: 0x2A3B31, roughness: 0.45 });
    const ufVolume = new THREE.Mesh(ufGeo, ufMat);
    ufVolume.position.set(0.35, 1.6, 0.2); // Cantilever forward and right
    ufVolume.castShadow = true;
    ufVolume.receiveShadow = true;
    villaGroup.add(ufVolume);
    architecturalMeshes.push(ufVolume);

    // Champagne Timber Shading Pergola / Louvers
    const louverGroup = new THREE.Group();
    for (let i = 0; i < 7; i++) {
      const louverGeo = new THREE.BoxGeometry(0.08, 1.0, 0.25);
      const louverMat = new THREE.MeshStandardMaterial({ color: 0xC5A880, roughness: 0.35 });
      const louver = new THREE.Mesh(louverGeo, louverMat);
      louver.position.set(-1.0 + (i * 0.35), 1.6, 1.95);
      louver.castShadow = true;
      louverGroup.add(louver);
      architecturalMeshes.push(louver);
    }
    villaGroup.add(louverGroup);

    // Slender Structural Columns (Matte Bronze Steel)
    const colGeo = new THREE.CylinderGeometry(0.045, 0.045, 3.0, 16);
    const colMat = new THREE.MeshStandardMaterial({ color: 0x1A241E, metalness: 0.8, roughness: 0.2 });
    
    const colPositions: [number, number, number][] = [
      [2.1, 0.7, 1.7],
      [2.1, 0.7, -1.3],
      [-1.9, 0.7, 1.7],
    ];

    colPositions.forEach(([x, y, z]) => {
      const col = new THREE.Mesh(colGeo, colMat);
      col.position.set(x, y, z);
      col.castShadow = true;
      villaGroup.add(col);
      architecturalMeshes.push(col);
    });

    // Mouse Tracking with Inertia
    let targetRotY = 0;
    let targetRotX = 0;
    let curRotY = 0;
    let curRotX = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetRotY = x * 0.45;
      targetRotX = y * 0.2;
    };

    container.addEventListener('mousemove', handleMouseMove);

    // Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Wireframe toggle update
      const wf = wireframeRef.current;
      architecturalMeshes.forEach(m => {
        if (Array.isArray(m.material)) {
          m.material.forEach(mat => { 
            if ('wireframe' in mat) {
              (mat as THREE.MeshStandardMaterial).wireframe = wf; 
            }
          });
        } else if (m.material && 'wireframe' in m.material) {
          (m.material as THREE.MeshStandardMaterial).wireframe = wf;
        }
      });

      // Smooth camera orbit & scroll-driven rotation
      curRotY += (targetRotY - curRotY) * 0.05;
      curRotX += (targetRotX - curRotX) * 0.05;

      const idleFloat = Math.sin(Date.now() * 0.0012) * 0.03;
      const scrollRotation = scrollRef.current * Math.PI * 1.2;
      villaGroup.rotation.y = curRotY + idleFloat + scrollRotation;
      villaGroup.rotation.x = curRotX;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth;
      height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-[540px] lg:h-[600px] rounded-3xl overflow-hidden bg-gradient-to-b from-[#F9F8F6] to-[#EFECE6] border border-stone-border shadow-2xl select-none">
      {/* 3D WebGL Canvas */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Left: Editorial Micro-badge */}
      <div className="absolute top-6 left-6 flex items-center space-x-2 text-sage-900 text-xs tracking-wider uppercase font-semibold bg-white/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-stone-border shadow-sm">
        <CompassRoseIcon className="w-3.5 h-3.5 text-sage-700 animate-spin" style={{ animationDuration: '40s' }} />
        <span>Live 3D Specimen • 30×40 G+1 Pavilion</span>
      </div>

      {/* Top Right: Wireframe / Solid Mode Toggle & Hotspots */}
      <div className="absolute top-6 right-6 flex items-center space-x-2">
        <button
          onClick={() => setIsWireframe(!isWireframe)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md border transition-all ${
            isWireframe
              ? 'bg-sage-900 text-ivory-50 border-sage-900 shadow-md'
              : 'bg-white/80 text-sage-800 border-stone-border hover:bg-white'
          }`}
        >
          {isWireframe ? 'Wireframe Mode: ON' : 'Toggle CAD Wireframe'}
        </button>

        {HOTSPOTS.map((spot) => (
          <button
            key={spot.id}
            onClick={() => setActiveHotspot(spot)}
            className={`hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all backdrop-blur-md border ${
              activeHotspot.id === spot.id
                ? 'bg-sage-900 text-ivory-50 border-sage-900 shadow-md scale-105'
                : 'bg-white/80 text-sage-800 border-stone-border hover:bg-white'
            }`}
          >
            {spot.icon}
            <span>{spot.label}</span>
          </button>
        ))}
      </div>

      {/* Bottom Center Rationale Card */}
      <div className="absolute bottom-6 left-6 right-6 sm:left-6 sm:right-auto sm:max-w-md bg-white/90 backdrop-blur-lg p-5 rounded-2xl border border-stone-border shadow-xl transition-all duration-300">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] uppercase font-bold tracking-widest text-champagne">
            {activeHotspot.category}
          </span>
          <span className="text-xs font-bold text-sage-800 bg-sage-50 px-2.5 py-0.5 rounded-full border border-sage-200">
            {activeHotspot.metric}
          </span>
        </div>
        <h4 className="text-sm font-bold text-sage-900 mb-1">{activeHotspot.label}</h4>
        <p className="text-xs text-stone-muted leading-relaxed">{activeHotspot.detail}</p>
        <div className="mt-3 pt-2 border-t border-stone-border/60 flex items-center justify-between text-[11px] text-sage-700">
          <span className="flex items-center space-x-1">
            <ShieldVerifiedIcon className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-medium">Deterministic Physics Validated</span>
          </span>
          <span className="text-stone-muted">Move mouse to orbit</span>
        </div>
      </div>
    </div>
  );
}
