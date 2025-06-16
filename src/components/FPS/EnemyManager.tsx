import { useState, useCallback, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { EnemyState, EnemyConfig } from '../../types/enemy';
import { useEnemyAI } from '../../hooks/useEnemyAI';
import { useDamageSystem } from '../../hooks/useDamageSystem';
import { EnemyPlayer } from './EnemyPlayer';
import { DamageNumbers } from './DamageNumbers';

interface EnemyManagerProps {
  playerPosition: THREE.Vector3;
  onPlayerHit: (damage: number, hitPosition: THREE.Vector3) => void;
}

export function EnemyManager({ playerPosition, onPlayerHit }: EnemyManagerProps) {
  const lastTime = useRef(performance.now());
  
  const enemyConfig: EnemyConfig = {
    health: 50,
    maxHealth: 50,
    detectionRange: 15,
    radarAngle: Math.PI / 3, // 60 degrees
    fireRate: 2, // 2 shots per second
    bulletSpeed: 30,
    bulletDamage: 15,
    moveSpeed: 5,
    rotationSpeed: 2
  };

  // Initial enemies
  const [enemies, setEnemies] = useState<EnemyState[]>([
    {
      id: 'enemy1',
      position: new THREE.Vector3(10, 1, 10),
      rotation: 0,
      health: enemyConfig.maxHealth,
      maxHealth: enemyConfig.maxHealth,
      isDetectingPlayer: false,
      lastShotTime: 0,
      target: null
    },
    {
      id: 'enemy2',
      position: new THREE.Vector3(-10, 1, -10),
      rotation: Math.PI,
      health: enemyConfig.maxHealth,
      maxHealth: enemyConfig.maxHealth,
      isDetectingPlayer: false,
      lastShotTime: 0,
      target: null
    }
  ]);

  const { updateEnemyBehavior, canShoot, performRaycast } = useEnemyAI(enemyConfig);
  const { damageNumbers, addDamageNumber, updateDamageNumbers } = useDamageSystem();

  const handleEnemyPositionUpdate = useCallback((id: string, position: THREE.Vector3) => {
    setEnemies(prev => prev.map(enemy => 
      enemy.id === id ? { ...enemy, position } : enemy
    ));
  }, []);

  useFrame(() => {
    const currentTime = performance.now();
    const deltaTime = (currentTime - lastTime.current) / 1000;
    lastTime.current = currentTime;

    // Update damage numbers
    updateDamageNumbers(deltaTime);

    // Update enemies
    setEnemies(prev => prev.map(enemy => {
      const updatedEnemy = updateEnemyBehavior(enemy, playerPosition, deltaTime);
      
      // Check if enemy can shoot
      if (canShoot(updatedEnemy)) {
        // Perform raycast to check hit
        const shootDirection = new THREE.Vector3(
          Math.sin(updatedEnemy.rotation),
          0,
          Math.cos(updatedEnemy.rotation)
        );
        
        const hitResult = performRaycast(
          updatedEnemy.position,
          shootDirection,
          enemyConfig.detectionRange,
          playerPosition
        );
        
        if (hitResult.hit) {
          onPlayerHit(hitResult.damage, hitResult.position);
          addDamageNumber(hitResult.position, hitResult.damage);
        }
        
        updatedEnemy.lastShotTime = performance.now();
      }
      
      return updatedEnemy;
    }));
  });

  return (
    <group>
      {enemies.map(enemy => (
        <EnemyPlayer
          key={enemy.id}
          enemy={enemy}
          config={enemyConfig}
          onPositionUpdate={handleEnemyPositionUpdate}
        />
      ))}
      <DamageNumbers damageNumbers={damageNumbers} />
    </group>
  );
}
