import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface HealthBarProps {
  position: THREE.Vector3;
  health: number;
  maxHealth: number;
  isEnemy?: boolean;
}

export function HealthBar({ position, health, maxHealth, isEnemy = false }: HealthBarProps) {
  const healthPercentage = Math.max(0, Math.min(100, (health / maxHealth) * 100));
  const barColor = isEnemy ? 'bg-red-500' : 'bg-green-500';
  
  return (
    <Html
      position={[position.x, position.y + 2, position.z]}
      center
      distanceFactor={10}
      sprite
    >
      <div className="bg-black bg-opacity-75 px-2 py-1 rounded">
        <div className="w-16 h-2 bg-gray-700 rounded overflow-hidden">
          <div 
            className={`h-full ${barColor} transition-all duration-200`}
            style={{ width: `${healthPercentage}%` }}
          />
        </div>
        <div className="text-white text-xs text-center mt-1">
          {Math.round(health)}/{maxHealth}
        </div>
      </div>
    </Html>
  );
}
