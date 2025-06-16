import { usePlane } from '@react-three/cannon';
import * as THREE from 'three';
import { useMemo } from 'react';

export function Ground() {
  // Physics plane for collision with proper typing
  const [ref] = usePlane<THREE.Mesh>(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, 0, 0],
    material: {
      friction: 0.4,
      restitution: 0.3,
    },
  }));

  // Create grid texture
  const gridTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d')!;
    
    // Fill with white background
    context.fillStyle = '#f0f0f0';
    context.fillRect(0, 0, 512, 512);
    
    // Draw grid lines
    context.strokeStyle = '#d0d0d0';
    context.lineWidth = 2;
    
    const gridSize = 32;
    for (let i = 0; i <= 512; i += gridSize) {
      context.beginPath();
      context.moveTo(i, 0);
      context.lineTo(i, 512);
      context.stroke();
      
      context.beginPath();
      context.moveTo(0, i);
      context.lineTo(512, i);
      context.stroke();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(20, 20);
    
    return texture;
  }, []);

  return (
    <mesh ref={ref} receiveShadow>
      <planeGeometry args={[100, 100]} />
      <meshLambertMaterial map={gridTexture} />
    </mesh>
  );
}
