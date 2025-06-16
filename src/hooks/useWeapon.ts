import { useRef, useEffect, useState, useCallback } from 'react';
import { BulletParticle, WeaponConfig } from '../types/weapon';
import * as THREE from 'three';

export function useWeapon(
  config: WeaponConfig, 
  onEnemyHit?: (enemyId: string, damage: number, position: THREE.Vector3) => void,
  enemies?: Array<{ id: string; position: THREE.Vector3; }>
) {
  const [bullets, setBullets] = useState<BulletParticle[]>([]);
  const lastShotTime = useRef(0);
  const bulletIdCounter = useRef(0);
  const raycaster = useRef(new THREE.Raycaster());

  // Pre-defined obstacle data for faster collision detection
  const obstacleData = useRef([
    // Perimeter walls
    { center: [0, 3, 30], size: [60, 6, 2] },   // North wall
    { center: [0, 3, -30], size: [60, 6, 2] },  // South wall
    { center: [30, 3, 0], size: [2, 6, 60] },   // East wall
    { center: [-30, 3, 0], size: [2, 6, 60] },  // West wall
    
    // Corner towers
    { center: [20, 3, 20], size: [3, 6, 3] },
    { center: [-20, 3, 20], size: [3, 6, 3] },
    { center: [20, 3, -20], size: [3, 6, 3] },
    { center: [-20, 3, -20], size: [3, 6, 3] },
    
    // Central structures
    { center: [0, 1, 0], size: [4, 2, 4] },
    { center: [8, 1.5, 8], size: [2, 3, 6] },
    { center: [-8, 1.5, -8], size: [2, 3, 6] },
    { center: [8, 1.5, -8], size: [6, 3, 2] },
    { center: [-8, 1.5, 8], size: [6, 3, 2] },
    
    // Defensive positions
    { center: [12, 1.5, 0], size: [2, 3, 8] },
    { center: [-12, 1.5, 0], size: [2, 3, 8] },
    { center: [0, 1.5, 12], size: [8, 3, 2] },
    { center: [0, 1.5, -12], size: [8, 3, 2] },
    
    // Major pillars
    { center: [6, 2, 3], size: [1, 4, 1] },
    { center: [-6, 2, -3], size: [1, 4, 1] },
    { center: [3, 2, -6], size: [1, 4, 1] },
    { center: [-3, 2, 6], size: [1, 4, 1] },
  ]);

  // Mouse click handler
  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (event.button === 0 && document.pointerLockElement) {
        event.preventDefault();
      }
    };

    const handleMouseUp = (event: MouseEvent) => {
      if (event.button === 0 && document.pointerLockElement) {
        event.preventDefault();
      }
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Optimized collision detection function
  const checkBulletCollision = useCallback((bulletPos: THREE.Vector3): boolean => {
    // Quick boundary check first
    if (Math.abs(bulletPos.x) > 31 || Math.abs(bulletPos.z) > 31 || bulletPos.y < 0 || bulletPos.y > 10) {
      return true; // Hit boundary
    }

    // Check obstacles using AABB collision
    for (const obstacle of obstacleData.current) {
      const [cx, cy, cz] = obstacle.center;
      const [sx, sy, sz] = obstacle.size;
      
      const halfX = sx / 2;
      const halfY = sy / 2;
      const halfZ = sz / 2;
      
      if (bulletPos.x >= cx - halfX && bulletPos.x <= cx + halfX &&
          bulletPos.y >= cy - halfY && bulletPos.y <= cy + halfY &&
          bulletPos.z >= cz - halfZ && bulletPos.z <= cz + halfZ) {
        return true; // Hit obstacle
      }
    }
    
    return false;
  }, []);

  const shoot = useCallback((
    spawnPosition: THREE.Vector3,
    direction: THREE.Vector3
  ) => {
    const now = performance.now();
    const timeSinceLastShot = now - lastShotTime.current;
    const fireInterval = 1000 / config.fireRate;

    if (timeSinceLastShot < fireInterval) return;

    lastShotTime.current = now;
    bulletIdCounter.current++;

    const velocity: [number, number, number] = [
      direction.x * config.bulletSpeed,
      direction.y * config.bulletSpeed,
      direction.z * config.bulletSpeed
    ];

    const newBullet: BulletParticle = {
      id: `bullet_${bulletIdCounter.current}`,
      position: [spawnPosition.x, spawnPosition.y, spawnPosition.z],
      velocity,
      life: config.bulletLife,
      maxLife: config.bulletLife
    };

    setBullets(prev => [...prev, newBullet]);
  }, [config]);

  const updateBullets = useCallback((deltaTime: number) => {
    setBullets(prev => {
      const updatedBullets: BulletParticle[] = [];
      
      for (const bullet of prev) {
        const newPosition: [number, number, number] = [
          bullet.position[0] + bullet.velocity[0] * deltaTime,
          bullet.position[1] + bullet.velocity[1] * deltaTime,
          bullet.position[2] + bullet.velocity[2] * deltaTime
        ];
        
        const bulletPos = new THREE.Vector3(...newPosition);
        
        // Check wall collision
        if (checkBulletCollision(bulletPos)) {
          continue; // Bullet destroyed
        }

        // Check enemy collision (optimized)
        let hitEnemy = false;
        if (enemies && onEnemyHit && enemies.length > 0) {
          for (const enemy of enemies) {
            const distanceSq = bulletPos.distanceToSquared(enemy.position);
            if (distanceSq < 1.44) { // 1.2^2 for faster comparison
              onEnemyHit(enemy.id, 25, bulletPos);
              hitEnemy = true;
              break;
            }
          }
        }
        
        if (hitEnemy) {
          continue; // Bullet destroyed
        }

        // Update bullet
        const updatedBullet = {
          ...bullet,
          position: newPosition,
          life: bullet.life - deltaTime
        };
        
        if (updatedBullet.life > 0) {
          updatedBullets.push(updatedBullet);
        }
      }
      
      return updatedBullets;
    });
  }, [enemies, onEnemyHit, checkBulletCollision]);

  // Auto-fire when mouse is held down
  const handleAutoFire = useCallback((
    isMouseDown: boolean,
    spawnPosition: THREE.Vector3,
    direction: THREE.Vector3
  ) => {
    if (isMouseDown && document.pointerLockElement) {
      shoot(spawnPosition, direction);
    }
  }, [shoot]);

  return {
    bullets,
    shoot,
    updateBullets,
    handleAutoFire
  };
}
