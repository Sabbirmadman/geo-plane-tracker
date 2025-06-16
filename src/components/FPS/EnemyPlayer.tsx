import { useRef, useEffect } from 'react';
import { useSphere } from '@react-three/cannon';
import * as THREE from 'three';
import { EnemyState, EnemyConfig } from '../../types/enemy';
import { Gun } from './Gun';
import { HealthBar } from './HealthBar';

interface EnemyPlayerProps {
  enemy: EnemyState;
  config: EnemyConfig;
  onPositionUpdate: (id: string, position: THREE.Vector3) => void;
}

export function EnemyPlayer({ enemy, config, onPositionUpdate }: EnemyPlayerProps) {
  const [enemyRef, enemyApi] = useSphere<THREE.Mesh>(() => ({
    mass: 1,
    position: [enemy.position.x, enemy.position.y, enemy.position.z],
    material: {
      friction: 0.1,
      restitution: 0.1,
    },
    fixedRotation: true,
    linearDamping: 0.4,
    angularDamping: 1,
  }));

  const positionRef = useRef<[number, number, number]>([0, 0, 0]);

  // Subscribe to position updates
  useEffect(() => {
    const unsubscribe = enemyApi.position.subscribe((position) => {
      positionRef.current = position;
      onPositionUpdate(enemy.id, new THREE.Vector3(...position));
    });
    
    return unsubscribe;
  }, [enemyApi, enemy.id, onPositionUpdate]);

  // Calculate gun position
  const gunOffset = new THREE.Vector3(0.3, 0.1, 0.4);
  const rotationMatrix = new THREE.Matrix4().makeRotationY(enemy.rotation);
  gunOffset.applyMatrix4(rotationMatrix);
  
  const gunPosition: [number, number, number] = [
    enemy.position.x + gunOffset.x,
    enemy.position.y + gunOffset.y,
    enemy.position.z + gunOffset.z
  ];

  // Calculate damage indicator color based on health
  const healthPercent = enemy.health / enemy.maxHealth;
  const enemyColor = healthPercent > 0.6 ? "#ff4444" : 
                    healthPercent > 0.3 ? "#ff6666" : "#ff8888";

  // Radar visualization (only when detecting player)
  const radarGeometry = new THREE.ConeGeometry(
    config.detectionRange * Math.tan(config.radarAngle / 2),
    config.detectionRange,
    8,
    1,
    true
  );

  return (
    <group>
      {/* Enemy cylinder body with health-based color */}
      <mesh ref={enemyRef} castShadow rotation={[0, enemy.rotation, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 1.0, 8]} />
        <meshLambertMaterial color={enemyColor} />
      </mesh>
      
      {/* Gun */}
      <group 
        position={gunPosition}
        rotation={[0, enemy.rotation, 0]}
      >
        <Gun position={[0, 0, 0]} rotation={[0, 0, 0]} />
      </group>
      
      {/* Health bar */}
      <HealthBar 
        position={enemy.position}
        health={enemy.health}
        maxHealth={enemy.maxHealth}
        isEnemy={true}
      />
      
      {/* Radar visualization when detecting player */}
      {enemy.isDetectingPlayer && (
        <mesh 
          position={[enemy.position.x, enemy.position.y + 0.1, enemy.position.z]}
          rotation={[-Math.PI / 2, enemy.rotation, 0]}
        >
          <primitive object={radarGeometry} />
          <meshBasicMaterial 
            color="#ff0000" 
            transparent 
            opacity={0.2} 
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}
