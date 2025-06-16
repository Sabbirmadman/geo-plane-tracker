import { usePlane } from '@react-three/cannon';
import * as THREE from 'three';
import { useMemo } from 'react';

interface GroundProps {
  showCollider?: boolean;
}

export function Ground({ showCollider = false }: GroundProps) {
  // Physics plane for collision with proper typing
  const [ref] = usePlane<THREE.Mesh>(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, 0, 0],
    material: {
      friction: 0.4,
      restitution: 0.3,
    },
  }));

  // Simplified grid texture with reduced canvas size
  const gridTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128; // Reduced from 256
    canvas.height = 128;
    const context = canvas.getContext('2d')!;
    
    // Simple solid color - no complex patterns
    context.fillStyle = '#8B7355';
    context.fillRect(0, 0, 128, 128);
    
    // Minimal grid lines
    context.strokeStyle = '#654321';
    context.lineWidth = 1;
    
    const gridSize = 16; // Larger grid for fewer lines
    for (let i = 0; i <= 128; i += gridSize) {
      if (i % 32 === 0) { // Only draw every other line
        context.beginPath();
        context.moveTo(i, 0);
        context.lineTo(i, 128);
        context.stroke();
        
        context.beginPath();
        context.moveTo(0, i);
        context.lineTo(128, i);
        context.stroke();
      }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(10, 10); // Reduced repeat
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter; // Faster filtering
    
    return texture;
  }, []);

  return (
    <group>
      {/* Main ground mesh */}
      <mesh ref={ref} receiveShadow={false}>
        <planeGeometry args={[80, 80, 1, 1]} />
        <meshLambertMaterial map={gridTexture} />
      </mesh>
      
      {/* Ground collider visualization */}
      {showCollider && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <planeGeometry args={[80, 80]} />
          <meshBasicMaterial 
            color="#0000ff" 
            wireframe={true} 
            transparent={true} 
            opacity={0.3} 
          />
        </mesh>
      )}
    </group>
  );
}

