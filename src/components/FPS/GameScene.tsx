import { useState, useCallback, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Player } from './Player';
import { EnemyState, EnemyConfig } from '../../types/enemy';
import { EnemyPlayer } from './EnemyPlayer';
import { Ground } from './Ground';
import { ObstacleBox } from './ObstacleBox';

export function GameScene() {
  const [playerPosition, setPlayerPosition] = useState(new THREE.Vector3(0, 1, 0));
  const [playerTakeDamage, setPlayerTakeDamage] = useState<((damage: number, hitPosition: THREE.Vector3) => boolean) | null>(null);
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
    },
    {
      id: 'enemy3',
      position: new THREE.Vector3(15, 1, -5),
      rotation: Math.PI / 2,
      health: enemyConfig.maxHealth,
      maxHealth: enemyConfig.maxHealth,
      isDetectingPlayer: false,
      lastShotTime: 0,
      target: null
    }
  ]);

  const handlePlayerUpdate = useCallback((position: THREE.Vector3, takeDamageFunc: (damage: number, hitPosition: THREE.Vector3) => boolean) => {
    setPlayerPosition(position);
    setPlayerTakeDamage(() => takeDamageFunc);
  }, []);

  const handleEnemyPositionUpdate = useCallback((id: string, position: THREE.Vector3) => {
    setEnemies(prev => prev.map(enemy => 
      enemy.id === id ? { ...enemy, position } : enemy
    ));
  }, []);

  // Simple enemy AI and shooting logic
  useFrame(() => {
    const currentTime = performance.now();
    const deltaTime = (currentTime - lastTime.current) / 1000;
    lastTime.current = currentTime;

    // Update enemies
    setEnemies(prev => prev.map(enemy => {
      const updatedEnemy = { ...enemy };
      
      // Check if player is in detection range
      const toPlayer = playerPosition.clone().sub(enemy.position);
      const distance = toPlayer.length();
      
      if (distance <= enemyConfig.detectionRange) {
        // Calculate enemy forward direction
        const enemyForward = new THREE.Vector3(
          Math.sin(enemy.rotation),
          0,
          Math.cos(enemy.rotation)
        );
        
        // Normalize direction to player
        toPlayer.normalize();
        
        // Calculate angle between enemy forward and direction to player
        const angle = Math.acos(Math.max(-1, Math.min(1, enemyForward.dot(toPlayer))));
        
        // Check if player is within V-shaped radar cone
        updatedEnemy.isDetectingPlayer = angle <= enemyConfig.radarAngle / 2;
        
        if (updatedEnemy.isDetectingPlayer) {
          // Rotate towards player
          const targetRotation = Math.atan2(toPlayer.x, toPlayer.z);
          
          // Smooth rotation
          let rotationDiff = targetRotation - enemy.rotation;
          
          // Normalize rotation difference
          while (rotationDiff > Math.PI) rotationDiff -= 2 * Math.PI;
          while (rotationDiff < -Math.PI) rotationDiff += 2 * Math.PI;
          
          const rotationStep = enemyConfig.rotationSpeed * deltaTime;
          if (Math.abs(rotationDiff) < rotationStep) {
            updatedEnemy.rotation = targetRotation;
          } else {
            updatedEnemy.rotation += Math.sign(rotationDiff) * rotationStep;
          }
          
          // Check if enemy can shoot
          const timeSinceLastShot = currentTime - enemy.lastShotTime;
          const fireInterval = 1000 / enemyConfig.fireRate;
          
          if (timeSinceLastShot >= fireInterval && playerTakeDamage) {
            // Simple hit check - if player is close enough and in front
            if (distance < enemyConfig.detectionRange && Math.abs(rotationDiff) < 0.2) {
              const hitPosition = playerPosition.clone();
              playerTakeDamage(enemyConfig.bulletDamage, hitPosition);
              updatedEnemy.lastShotTime = currentTime;
            }
          }
        }
      } else {
        updatedEnemy.isDetectingPlayer = false;
      }
      
      return updatedEnemy;
    }));
  });

  return (
    <group>
      {/* Ground */}
      <Ground />
      
      {/* Obstacles */}
      <ObstacleBox position={[5, 1, 5]} />
      <ObstacleBox position={[-5, 1, -5]} />
      <ObstacleBox position={[0, 1, 8]} />
      
      {/* Player */}
      <Player onPlayerUpdate={handlePlayerUpdate} />
      
      {/* Enemies */}
      {enemies.map(enemy => (
        <EnemyPlayer
          key={enemy.id}
          enemy={enemy}
          config={enemyConfig}
          onPositionUpdate={handleEnemyPositionUpdate}
        />
      ))}
    </group>
  );
}
