import { useFrame } from '@react-three/fiber';
import { useSphere } from '@react-three/cannon';
import * as THREE from 'three';
import { usePlayerMovement } from '../../hooks/usePlayerMovement';
import { useCameraController } from '../../hooks/useCameraController';
import { useWeapon } from '../../hooks/useWeapon';
import { MovementConfig } from '../../types/player';
import { WeaponConfig } from '../../types/weapon';
import { Gun } from './Gun';
import { BulletParticles } from './BulletParticles';
import { useState, useRef } from 'react';

export function Player() {
  const [isMouseDown, setIsMouseDown] = useState(false);
  const lastTime = useRef(performance.now());
  
  // Physics objects with proper typing
  const [playerRef, playerApi] = useSphere<THREE.Mesh>(() => ({
    mass: 1,
    position: [0, 5, 0],
    material: {
      friction: 0.1,
      restitution: 0.1,
    },
    fixedRotation: true,
    linearDamping: 0.4,
    angularDamping: 1,
  }));

  // Configuration
  const movementConfig: MovementConfig = {
    moveSpeed: 15,
    maxSpeed: 12,
  };

  const cameraConfig = {
    mouseSensitivity: 0.003,
    cameraDistance: 4,
    cameraHeight: 2,
    verticalClamp: Math.PI / 2.5
  };

  const weaponConfig: WeaponConfig = {
    fireRate: 10,
    bulletSpeed: 50,
    bulletLife: 3,
    particleSize: 0.05,
  };

  // Custom hooks
  const { position, updateMovement } = usePlayerMovement(
    playerApi,
    movementConfig
  );

  const { 
    updateCamera,
    getGunPosition,
    getBulletSpawnPoint,
    getBulletDirection,
    getMovementVectors,
    getRotation
  } = useCameraController(cameraConfig);
  
  const { bullets, updateBullets, handleAutoFire } = useWeapon(weaponConfig);

  // Mouse shooting controls
  useState(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (event.button === 0 && document.pointerLockElement) {
        setIsMouseDown(true);
      }
    };

    const handleMouseUp = (event: MouseEvent) => {
      if (event.button === 0) {
        setIsMouseDown(false);
      }
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  });

  // Main update loop
  useFrame(() => {
    if (!playerRef.current) return;

    const currentTime = performance.now();
    const deltaTime = (currentTime - lastTime.current) / 1000;
    lastTime.current = currentTime;

    const playerPosition = new THREE.Vector3(...position.current);
    
    // Update camera
    updateCamera(playerPosition);

    // Update movement using camera vectors
    const { forward, right } = getMovementVectors();
    updateMovement(forward, right);

    // Update bullets
    updateBullets(deltaTime);

    // Handle auto-fire with proper spawn point and direction
    const bulletSpawn = getBulletSpawnPoint(playerPosition);
    const bulletDirection = getBulletDirection();
    handleAutoFire(isMouseDown, bulletSpawn, bulletDirection);
  });

  const playerPosition = new THREE.Vector3(...position.current);
  const gunWorldPosition = getGunPosition(playerPosition);
  const rotation = getRotation();

  return (
    <group>
      {/* Player cylinder body - now faces camera direction */}
      <mesh ref={playerRef} castShadow rotation={[0, rotation.horizontal, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 1.0, 8]} />
        <meshLambertMaterial color="#00ff88" />
      </mesh>
      
      {/* Gun positioned and rotated correctly */}
      <group 
        position={[gunWorldPosition.x, gunWorldPosition.y, gunWorldPosition.z]} 
        rotation={[rotation.vertical, rotation.horizontal, 0]}
      >
        <Gun position={[0, 0, 0]} rotation={[0, 0, 0]} />
      </group>
      
      {/* Bullet particles */}
      <BulletParticles bullets={bullets} particleSize={weaponConfig.particleSize} />
    </group>
  );
}
      
      
