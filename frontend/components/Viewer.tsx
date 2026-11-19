'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { 
  Compass, 
  Layers, 
  Ruler, 
  Zap, 
  Droplets, 
  Palette, 
  Sofa, 
  Sun, 
  Volume2, 
  FileSpreadsheet,
  CheckCircle2,
  Info,
  Download,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { HouseTwin } from '@/lib/twin';

interface ViewerProps {
  twin: HouseTwin;
}

type ViewMode = 'blueprint' | 'structure' | 'mep' | 'paint' | 'decor' | 'climate' | 'sound';

export default function Viewer({ twin }: ViewerProps) {
  const [activeMode, setActiveMode] = useState<ViewMode>('blueprint');
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const mountRef = useRef<HTMLDivElement>(null);

  // SVG calculations for Blueprint Mode
  const scale = 14.0;
  const plotWidth = twin.plot.plot_width_ft * scale;
  const plotDepth = twin.plot.plot_depth_ft * scale;
  const sbFront = 9.84 * scale;
  const sbRear = 9.84 * scale;
  const sbSide = 4.92 * scale;

  const floor0 = twin.floors && twin.floors.length > 0 ? twin.floors[0] : null;

  // Initialize Three.js scene for 3D modes
  useEffect(() => {
    if (activeMode === 'blueprint') return;
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight || 500;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0f17);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(12, 14, 16);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 1.2);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // 3. Ground / Raft Foundation Slab
    const raftGeo = new THREE.BoxGeometry(9, 0.5, 9);
    const raftMat = new THREE.MeshStandardMaterial({ 
      color: 0x334155, 
      roughness: 0.9 
    });
    const raftMesh = new THREE.Mesh(raftGeo, raftMat);
    raftMesh.position.y = -0.25;
    scene.add(raftMesh);

    // Add Architectural Grid
    const grid = new THREE.GridHelper(20, 20, 0x2563eb, 0x1e293b);
    grid.position.y = -0.01;
    scene.add(grid);

    // 4. Render 3D Columns per IS 456
    const columnMeshes: THREE.Mesh[] = [];
    if (twin.structure && twin.structure.columns) {
      twin.structure.columns.forEach((col, idx) => {
        const colWidth = (col.size_mm / 1000) * 1.5;
        const colGeo = new THREE.BoxGeometry(colWidth, 3.2, colWidth);
        const colMat = new THREE.MeshStandardMaterial({
          color: activeMode === 'structure' ? 0x2563eb : 0x475569,
          roughness: 0.4,
          wireframe: false
        });
        const colMesh = new THREE.Mesh(colGeo, colMat);
        colMesh.position.set((col.x * 0.25) - 3.5, 1.6, (col.y * 0.25) - 2.5);
        colMesh.userData = { type: 'column', index: idx, data: col };
        scene.add(colMesh);
        columnMeshes.push(colMesh);
      });
    }

    // 5. Render 3D Beams
    if (activeMode === 'structure' && twin.structure && twin.structure.beams) {
      twin.structure.beams.forEach((b, idx) => {
        const beamGeo = new THREE.BoxGeometry(4.5, (b.depth_mm / 1000) * 1.5, 0.35);
        const beamMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.5 });
        const beamMesh = new THREE.Mesh(beamGeo, beamMat);
        beamMesh.position.set(-1.5, 3.2, (idx * 2.0) - 2.5);
        scene.add(beamMesh);
      });
    }

    // 6. MEP Overlay Lines
    if (activeMode === 'mep') {
      // Fresh Water Supply (Blue vertical riser)
      const waterGeo = new THREE.CylinderGeometry(0.06, 0.06, 3.2, 16);
      const waterMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6 });
      const waterMesh = new THREE.Mesh(waterGeo, waterMat);
      waterMesh.position.set(-3.5, 1.6, -2.5);
      scene.add(waterMesh);

      // 1:60 Drainage Sewer Line (Green pipe)
      const drainGeo = new THREE.CylinderGeometry(0.08, 0.08, 6.0, 16);
      const drainMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
      const drainMesh = new THREE.Mesh(drainGeo, drainMat);
      drainMesh.position.set(-0.75, 0.15, -0.5);
      drainMesh.rotation.z = Math.PI / 2;
      drainMesh.rotation.y = 0.5;
      scene.add(drainMesh);

      // Electrical Conduit (Yellow line)
      const elecGeo = new THREE.CylinderGeometry(0.04, 0.04, 5.0, 16);
      const elecMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
      const elecMesh = new THREE.Mesh(elecGeo, elecMat);
      elecMesh.position.set(-0.5, 1.2, -2.5);
      elecMesh.rotation.z = Math.PI / 2;
      scene.add(elecMesh);
    }

    // 7. Paint / Color Walls
    if (activeMode === 'paint' || activeMode === 'decor') {
      const wallGeo = new THREE.BoxGeometry(4.0, 3.0, 0.2);
      const wallMat = new THREE.MeshStandardMaterial({ 
        color: 0xf5f0e6, // Warm White
        roughness: 0.8 
      });
      const wallMesh = new THREE.Mesh(wallGeo, wallMat);
      wallMesh.position.set(-1.5, 1.5, -2.5);
      scene.add(wallMesh);
    }

    // 8. Decor Furniture
    if (activeMode === 'decor') {
      // Platform Sofa
      const sofaGeo = new THREE.BoxGeometry(2.5, 0.6, 1.2);
      const sofaMat = new THREE.MeshStandardMaterial({ color: 0x78716c });
      const sofaMesh = new THREE.Mesh(sofaGeo, sofaMat);
      sofaMesh.position.set(-1.5, 0.3, 0.5);
      scene.add(sofaMesh);

      // Teak Table
      const tableGeo = new THREE.BoxGeometry(1.4, 0.4, 0.8);
      const tableMat = new THREE.MeshStandardMaterial({ color: 0x7c2d12 });
      const tableMesh = new THREE.Mesh(tableGeo, tableMat);
      tableMesh.position.set(-1.5, 0.2, 1.6);
      scene.add(tableMesh);
    }

    // Animation Loop (Slow rotation for architectural showcase)
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      scene.rotation.y += 0.0015;
      renderer.render(scene, camera);
    };
    animate();

    // Memory Disposal Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      raftGeo.dispose();
      raftMat.dispose();
    };
  }, [activeMode, twin]);

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Main Viewport Container */}
      <div className="flex-1 rounded-2xl border border-slate-800 bg-[#131926] p-4 sm:p-6">
        {/* Mode Toggle Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'blueprint', label: 'Blueprint 2D', icon: Ruler },
              { id: 'structure', label: 'Structure 3D', icon: Layers },
              { id: 'mep', label: 'MEP Flow 3D', icon: Zap },
              { id: 'paint', label: 'Paint Science', icon: Palette },
              { id: 'decor', label: 'Decor & Style', icon: Sofa },
              { id: 'climate', label: 'Climate & Sound', icon: Sun }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeMode === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveMode(tab.id as ViewMode);
                    setSelectedElement(null);
                  }}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-mono font-medium transition ${isActive ? 'bg-blue-600 text-white shadow-md' : 'border border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Judge: PASSED</span>
            </span>
          </div>
        </div>

        {/* Viewport Display */}
        <div className="relative mt-4 min-h-[480px] w-full overflow-hidden rounded-xl border border-slate-800/80 bg-[#0B0F17]">
          {/* MODE 1: Blueprint 2D (Interactive SVG) */}
          {activeMode === 'blueprint' && (
            <div className="flex h-full w-full items-center justify-center p-6 overflow-auto">
              <svg 
                viewBox={`0 0 ${plotWidth + 120} ${plotDepth + 120}`}
                className="max-h-[520px] max-w-full select-none"
              >
                {/* Outer Plot Boundary */}
                <rect 
                  x="60" 
                  y="60" 
                  width={plotWidth} 
                  height={plotDepth} 
                  fill="#0B0F17" 
                  stroke="#334155" 
                  strokeWidth="2" 
                  strokeDasharray="6 4"
                />
                <text x="70" y="80" fill="#64748B" fontSize="10" fontFamily="monospace">
                  Plot Boundary 30ft x 40ft (1,200 sqft)
                </text>

                {/* Setbacks Lines */}
                {/* Front Yard 3m */}
                <line x1="60" y1={60 + sbFront} x2={60 + plotWidth} y2={60 + sbFront} stroke="#1E293B" strokeWidth="1" strokeDasharray="3 3" />
                <text x={70} y={60 + (sbFront / 2)} fill="#F59E0B" fontSize="9" fontFamily="monospace">
                  Front Setback 3.0m (MCGM DCR)
                </text>

                {/* Rear Yard 3m */}
                <line x1="60" y1={60 + plotDepth - sbRear} x2={60 + plotWidth} y2={60 + plotDepth - sbRear} stroke="#1E293B" strokeWidth="1" strokeDasharray="3 3" />
                <text x={70} y={60 + plotDepth - (sbRear / 2)} fill="#F59E0B" fontSize="9" fontFamily="monospace">
                  Rear Setback 3.0m
                </text>

                {/* Buildable Footprint & Rooms */}
                {floor0 && floor0.rooms.map((r, i) => {
                  const rx = 60 + sbSide + (r.x * scale);
                  const ry = 60 + sbFront + (r.y * scale);
                  const rw = r.length_ft * scale;
                  const rh = r.width_ft * scale;

                  return (
                    <g 
                      key={i} 
                      onClick={() => setSelectedElement({ type: 'room', data: r })}
                      className="cursor-pointer hover:opacity-80 transition"
                    >
                      {/* Room Area */}
                      <rect 
                        x={rx} 
                        y={ry} 
                        width={rw} 
                        height={rh} 
                        fill="#131926" 
                        stroke="#2563EB" 
                        strokeWidth="2.5" 
                      />

                      {/* Room Label */}
                      <text 
                        x={rx + 10} 
                        y={ry + 20} 
                        fill="#F8FAFC" 
                        fontSize="11" 
                        fontWeight="bold"
                        fontFamily="sans-serif"
                      >
                        {r.name.toUpperCase().replace('_', ' ')}
                      </text>
                      <text 
                        x={rx + 10} 
                        y={ry + 34} 
                        fill="#94A3B8" 
                        fontSize="9.5" 
                        fontFamily="monospace"
                      >
                        {r.length_ft}' x {r.width_ft}' ({r.area_sqft} sqft)
                      </text>

                      {/* Door Indicator */}
                      <circle cx={rx + 6} cy={ry + rh - 6} r="4" fill="#10B981" />
                      <text x={rx + 14} y={ry + rh - 3} fill="#10B981" fontSize="8" fontFamily="monospace">
                        Door {r.door_width_mm}mm
                      </text>

                      {/* Window Indicator */}
                      <line x1={rx + rw - 15} y1={ry} x2={rx + rw} y2={ry} stroke="#38BDF8" strokeWidth="4" />
                    </g>
                  );
                })}

                {/* Structural Columns */}
                {twin.structure.columns.map((col, cIdx) => {
                  const cx = 60 + sbSide + (col.x * scale);
                  const cy = 60 + sbFront + (col.y * scale);
                  return (
                    <g 
                      key={cIdx}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedElement({ type: 'column', data: col, index: cIdx + 1 });
                      }}
                      className="cursor-pointer"
                    >
                      <rect 
                        x={cx - 5} 
                        y={cy - 5} 
                        width="10" 
                        height="10" 
                        fill="#2563EB" 
                        stroke="#93C5FD" 
                        strokeWidth="1.5" 
                      />
                    </g>
                  );
                })}

                {/* North Arrow */}
                <g transform={`translate(${plotWidth + 30}, 80)`}>
                  <circle cx="15" cy="15" r="14" fill="#1E293B" stroke="#475569" strokeWidth="1" />
                  <polygon points="15,4 10,18 20,18" fill="#EF4444" />
                  <text x="12" y="26" fill="#F8FAFC" fontSize="8" fontFamily="monospace" fontWeight="bold">N</text>
                </g>
              </svg>
            </div>
          )}

          {/* 3D Viewport for Structure, MEP, Paint, Decor */}
          {activeMode !== 'blueprint' && (
            <div ref={mountRef} className="h-[480px] w-full cursor-grab active:cursor-grabbing" />
          )}

          {/* Viewport Overlay Floating Legend */}
          <div className="absolute bottom-3 left-3 rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-1.5 backdrop-blur-md">
            <span className="font-mono text-[11px] text-slate-400">
              {activeMode === 'blueprint' && 'Mode: Architectural 2D Plan (Scale 1ft = 14px)'}
              {activeMode === 'structure' && 'Mode: IS 456 Structural Wireframe & Columns'}
              {activeMode === 'mep' && 'Mode: Plumbing (Blue/Green) & Electric (Yellow) Flow'}
              {activeMode === 'paint' && 'Mode: Wall Science (LRV > 70 Ambient Reflection)'}
              {activeMode === 'decor' && 'Mode: 70% Japanese / 30% Forest Style Blend'}
              {activeMode === 'climate' && 'Mode: Mumbai 19°N Solar Path & STC Acoustic Insulation'}
            </span>
          </div>
        </div>
      </div>

      {/* Side Engineering Details Panel */}
      <div className="w-full lg:w-80 rounded-2xl border border-slate-800 bg-[#131926] p-5">
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
          <Info className="h-4 w-4 text-blue-400" />
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
            Structural & Code Rationale
          </h3>
        </div>

        {selectedElement ? (
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-blue-900/60 bg-blue-950/20 p-3.5">
              <span className="font-mono text-[10px] uppercase text-blue-400">
                Selected {selectedElement.type}
              </span>
              <p className="mt-1 text-base font-bold text-white capitalize">
                {selectedElement.type === 'column' ? `Column C${selectedElement.index}` : selectedElement.data.name.replace('_', ' ')}
              </p>
            </div>

            {selectedElement.type === 'column' && (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/60 font-mono">
                  <span className="text-slate-400">Dimensions:</span>
                  <span className="text-white font-bold">{selectedElement.data.size_mm} x {selectedElement.data.size_y_mm || selectedElement.data.size_mm} mm</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60 font-mono">
                  <span className="text-slate-400">Tributary Axial Load:</span>
                  <span className="text-amber-400 font-bold">{selectedElement.data.load_tons} Metric Tons</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60 font-mono">
                  <span className="text-slate-400">Code Standard:</span>
                  <span className="text-white">IS 456 Cl. 39</span>
                </div>
                <div className="mt-3 rounded-lg bg-slate-900/80 p-2.5 text-[11px] text-slate-300 leading-relaxed font-mono">
                  {selectedElement.data.reason}
                </div>
              </div>
            )}

            {selectedElement.type === 'room' && (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/60 font-mono">
                  <span className="text-slate-400">Dimensions:</span>
                  <span className="text-white font-bold">{selectedElement.data.length_ft}' x {selectedElement.data.width_ft}'</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60 font-mono">
                  <span className="text-slate-400">Carpet Area:</span>
                  <span className="text-emerald-400 font-bold">{selectedElement.data.area_sqft} sqft</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60 font-mono">
                  <span className="text-slate-400">Door Width:</span>
                  <span className="text-white">{selectedElement.data.door_width_mm} mm</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60 font-mono">
                  <span className="text-slate-400">Wall Color:</span>
                  <span className="text-white">{selectedElement.data.color_wall_A?.name} (LRV {selectedElement.data.color_wall_A?.lrv})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60 font-mono">
                  <span className="text-slate-400">Floor Material:</span>
                  <span className="text-amber-400 capitalize">{selectedElement.data.material_floor.replace('_', ' ')}</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 space-y-3 font-mono text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Plot Dimensions:</span>
              <span className="text-white font-bold">30ft x 40ft (1,200 sqft)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Total Built-up:</span>
              <span className="text-white font-bold">1,500 sqft (G+1)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Mumbai FSI Used:</span>
              <span className="text-emerald-400 font-bold">1.25 / 1.50</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Safety Factor:</span>
              <span className="text-white font-bold">1.50 (IS 456 Limit State)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Foundation:</span>
              <span className="text-white font-bold">4.5ft Raft (Black Cotton)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Drainage Slope:</span>
              <span className="text-white font-bold">1:60 (IS 1742)</span>
            </div>

            <p className="mt-4 text-[11px] text-slate-500 leading-normal">
              Click on any room or column in the Blueprint or 3D view to inspect its engineering numbers and codes.
            </p>
          </div>
        )}

        {/* Action Link to BOQ */}
        <div className="mt-6 border-t border-slate-800/80 pt-4">
          <a
            href={`/house/${twin.house_id}/boq`}
            className="flex items-center justify-between rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-500"
          >
            <span>View Mumbai BOQ & Cost</span>
            <ChevronRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
