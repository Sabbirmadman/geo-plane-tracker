import React, { Suspense, useState, useCallback, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/cannon';
import { Sky } from '@react-three/drei';
import * as THREE from 'three';
import { Crosshair } from '../components/FPS/Crosshair';
import { Ground } from '../components/FPS/Ground';
import { Player } from '../components/FPS/Player';
import { ObstacleBox } from '../components/FPS/ObstacleBox';
import { PerformanceMonitor } from '../components/FPS/PerformanceMonitor';

export default function FPSPage() {
  const [playerPosition, setPlayerPosition] = useState(new THREE.Vector3(0, 1, 0));
  const [playerTakeDamage, setPlayerTakeDamage] = useState<((damage: number, hitPosition: THREE.Vector3) => boolean) | null>(null);
  const [showColliders, setShowColliders] = useState(false);

  const handlePlayerUpdate = useCallback((position: THREE.Vector3, takeDamageFunc: (damage: number, hitPosition: THREE.Vector3) => boolean) => {
    setPlayerPosition(position);
    setPlayerTakeDamage(() => takeDamageFunc);
  }, []);

  // Add F8 key handler for collider toggle
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'F8') {
        setShowColliders(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden">
      {/* Crosshair */}
      <Crosshair />
      
      {/* Performance Monitor */}
      <PerformanceMonitor />
      
      {/* Game Info */}
      <div className="absolute top-4 left-4 z-20 text-white">
        <div className="bg-black bg-opacity-75 px-4 py-2 rounded-lg">
          <h1 className="text-xl font-bold text-green-400 mb-2">FPS Arena</h1>
          <div className="text-sm space-y-1">
            <p>🎮 WASD: Move</p>
            <p>🖱️ Mouse: Look around</p>
            <p>🔫 Left Click: Shoot</p>
            <p>🦘 Space: Jump</p>
            <p>🔍 F8: Toggle Colliders</p>
            <p>📱 Click to lock mouse</p>
            <p>🚪 ESC: Unlock mouse</p>
          </div>
        </div>
      </div>

      {/* 3D Scene with performance optimizations */}
      <Canvas
        camera={{ 
          position: [0, 5, 10], 
          fov: 75,
          near: 0.1,
          far: 50 // Reduced far plane significantly
        }}
        gl={{
          antialias: false,
          powerPreference: "high-performance",
          alpha: false,
          stencil: false,
          depth: true,
          logarithmicDepthBuffer: false, // Disable for better performance
        }}
        dpr={[0.5, 1]}
        frameloop="demand" // Only render when needed
        performance={{ min: 0.2 }} // Aggressive performance scaling
      >
        {/* Minimal lighting */}
        <ambientLight intensity={0.6} />
        
        {/* Simplified sky without complex sun positioning */}
        <Sky />

        {/* Physics World with higher update frequency */}
        <Physics 
          gravity={[0, -25, 0]}
          broadphase="Naive"
          tolerance={0.001}
          iterations={8}  // Increased from 5 for smoother physics
          allowSleep={false} // Disable sleep for consistent movement
        >
          <Suspense fallback={null}>
            <Ground showCollider={showColliders} />
            
            <Player 
              onPlayerUpdate={handlePlayerUpdate}
              showCollider={showColliders}
            />
            
            {/* Arena boundaries with debug visualization */}
            <ObstacleBox position={[0, 3, 20]} size={[40, 6, 1]} color="#D2B48C" showCollider={showColliders} />  
            <ObstacleBox position={[0, 3, -20]} size={[40, 6, 1]} color="#D2B48C" showCollider={showColliders} /> 
            <ObstacleBox position={[20, 3, 0]} size={[1, 6, 40]} color="#D2B48C" showCollider={showColliders} />  
            <ObstacleBox position={[-20, 3, 0]} size={[1, 6, 40]} color="#D2B48C" showCollider={showColliders} /> 
            
            {/* Reference object with debug visualization */}
            <ObstacleBox position={[0, 1, 0]} size={[1, 1, 1]} color="#A0522D" showCollider={showColliders} />
          </Suspense>
        </Physics>
      </Canvas>
    </div>
  );
}