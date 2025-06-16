import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/cannon';
import { Sky } from '@react-three/drei';
import { Crosshair } from '../components/FPS/Crosshair';
import { Ground } from '../components/FPS/Ground';
import { Player } from '../components/FPS/Player';
import { ObstacleBox } from '../components/FPS/ObstacleBox';
import { PerformanceMonitor } from '../components/FPS/PerformanceMonitor';


export default function FPSPage() {
  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden">
      {/* Crosshair */}
      <Crosshair />
      
      {/* Performance Monitor - moved outside Canvas */}
      <PerformanceMonitor />
      
      {/* Game Info */}
      <div className="absolute top-4 left-4 z-20 text-white">
        <div className="bg-black bg-opacity-75 px-4 py-2 rounded-lg">
          <h1 className="text-xl font-bold text-green-400 mb-2">FPS Arena</h1>
          <div className="text-sm space-y-1">
            <p>🎮 WASD: Move</p>
            <p>🖱️ Mouse: Look around</p>
            <p>🔫 Left Click: Shoot</p>
            <p>🎯 Cylinder Physics Combat</p>
            <p>📱 Click to lock mouse</p>
            <p>🚪 ESC: Unlock mouse</p>
          </div>
        </div>
      </div>

      {/* 3D Scene */}
      <Canvas
        camera={{ 
          position: [0, 5, 10], 
          fov: 75,
          near: 0.1,
          far: 1000
        }}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
        }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.3} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1} 
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={50}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
        />

        {/* Sky */}
        <Sky sunPosition={[100, 20, 100]} />

        {/* Physics World */}
        <Physics gravity={[0, -30, 0]} broadphase="SAP">
          <Suspense fallback={null}>
            {/* Ground with Grid */}
            <Ground />
            
            {/* Player Sphere */}
            <Player />
            
            {/* Physics-enabled obstacle boxes */}
            <ObstacleBox position={[5, 1, 0]} />
            <ObstacleBox position={[-5, 1, 0]} />
            <ObstacleBox position={[0, 1, -5]} />
            <ObstacleBox position={[0, 1, 5]} />
            <ObstacleBox position={[3, 1, 3]} size={[1, 3, 1]} color="#654321" />
            <ObstacleBox position={[-3, 1, -3]} size={[1, 3, 1]} color="#654321" />
          </Suspense>
        </Physics>
      </Canvas>
    </div>
  );
}

