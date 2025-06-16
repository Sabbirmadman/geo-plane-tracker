import { useBox } from '@react-three/cannon';
import * as THREE from 'three';

interface ObstacleBoxProps {
  position: [number, number, number];
  size?: [number, number, number];
  color?: string;
}

export function ObstacleBox({ 
  position, 
  size = [2, 2, 2], 
  color = "#8B4513" 
}: ObstacleBoxProps) {
  const [ref] = useBox<THREE.Mesh>(() => ({
    position,
    mass: 0, // Static object
    material: {
      friction: 0.8,
      restitution: 0.1,
    },
  }));

  return (
    <mesh ref={ref} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshLambertMaterial color={color} />
    </mesh>
  );
}
