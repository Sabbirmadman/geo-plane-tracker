import { useRef, useCallback } from 'react';
import * as THREE from 'three';
import { EnemyConfig, EnemyState, HitResult } from '../types/enemy';

export function useEnemyAI(config: EnemyConfig) {
  const raycaster = useRef(new THREE.Raycaster());

  const isPlayerInRadar = useCallback((
    enemyPosition: THREE.Vector3,
    enemyRotation: number,
    playerPosition: THREE.Vector3
  ): boolean => {
    // Calculate direction to player
    const toPlayer = playerPosition.clone().sub(enemyPosition);
    const distance = toPlayer.length();
    
    if (distance > config.detectionRange) return false;
    
    // Calculate enemy forward direction
    const enemyForward = new THREE.Vector3(
      Math.sin(enemyRotation),
      0,
      Math.cos(enemyRotation)
    );
    
    // Normalize direction to player
    toPlayer.normalize();
    
    // Calculate angle between enemy forward and direction to player
    const angle = Math.acos(enemyForward.dot(toPlayer));
    
    // Check if player is within V-shaped radar cone
    return angle <= config.radarAngle / 2;
  }, [config.detectionRange, config.radarAngle]);

  const updateEnemyBehavior = useCallback((
    enemy: EnemyState,
    playerPosition: THREE.Vector3,
    deltaTime: number
  ): EnemyState => {
    const newEnemy = { ...enemy };
    
    // Check if player is in radar
    newEnemy.isDetectingPlayer = isPlayerInRadar(
      enemy.position,
      enemy.rotation,
      playerPosition
    );
    
    if (newEnemy.isDetectingPlayer) {
      // Rotate towards player
      const toPlayer = playerPosition.clone().sub(enemy.position);
      const targetRotation = Math.atan2(toPlayer.x, toPlayer.z);
      
      // Smooth rotation
      let rotationDiff = targetRotation - enemy.rotation;
      
      // Normalize rotation difference
      while (rotationDiff > Math.PI) rotationDiff -= 2 * Math.PI;
      while (rotationDiff < -Math.PI) rotationDiff += 2 * Math.PI;
      
      const rotationStep = config.rotationSpeed * deltaTime;
      if (Math.abs(rotationDiff) < rotationStep) {
        newEnemy.rotation = targetRotation;
      } else {
        newEnemy.rotation += Math.sign(rotationDiff) * rotationStep;
      }
      
      newEnemy.target = playerPosition.clone();
    }
    
    return newEnemy;
  }, [config.rotationSpeed, isPlayerInRadar]);

  const canShoot = useCallback((enemy: EnemyState): boolean => {
    const now = performance.now();
    const timeSinceLastShot = now - enemy.lastShotTime;
    const fireInterval = 1000 / config.fireRate;
    
    return enemy.isDetectingPlayer && timeSinceLastShot >= fireInterval;
  }, [config.fireRate]);

  const performRaycast = useCallback((
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    maxDistance: number,
    playerPosition: THREE.Vector3
  ): HitResult => {
    raycaster.current.set(origin, direction);
    
    // Check if ray hits player (simple sphere collision)
    const toPlayer = playerPosition.clone().sub(origin);
    const projectedDistance = toPlayer.dot(direction);
    
    if (projectedDistance < 0 || projectedDistance > maxDistance) {
      return { hit: false, damage: 0, position: new THREE.Vector3() };
    }
    
    const closestPoint = origin.clone().add(direction.clone().multiplyScalar(projectedDistance));
    const distanceToPlayer = closestPoint.distanceTo(playerPosition);
    
    const playerRadius = 0.4; // Player cylinder radius
    if (distanceToPlayer <= playerRadius) {
      return {
        hit: true,
        damage: config.bulletDamage,
        position: closestPoint
      };
    }
    
    return { hit: false, damage: 0, position: new THREE.Vector3() };
  }, [config.bulletDamage]);

  return {
    isPlayerInRadar,
    updateEnemyBehavior,
    canShoot,
    performRaycast
  };
}
