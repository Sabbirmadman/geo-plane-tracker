import { useRef, useEffect, useState, useCallback } from 'react';
import { BulletParticle, WeaponConfig } from '../types/weapon';
import * as THREE from 'three';

export function useWeapon(config: WeaponConfig) {
  const [bullets, setBullets] = useState<BulletParticle[]>([]);
  const lastShotTime = useRef(0);
  const bulletIdCounter = useRef(0);

  // Mouse click handler
  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (event.button === 0 && document.pointerLockElement) { // Left click
        event.preventDefault();
      }
    };

    const handleMouseUp = (event: MouseEvent) => {
      if (event.button === 0 && document.pointerLockElement) { // Left click
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
    setBullets(prev => prev
      .map(bullet => ({
        ...bullet,
        position: [
          bullet.position[0] + bullet.velocity[0] * deltaTime,
          bullet.position[1] + bullet.velocity[1] * deltaTime,
          bullet.position[2] + bullet.velocity[2] * deltaTime
        ] as [number, number, number],
        life: bullet.life - deltaTime
      }))
      .filter(bullet => bullet.life > 0)
    );
  }, []);

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
         