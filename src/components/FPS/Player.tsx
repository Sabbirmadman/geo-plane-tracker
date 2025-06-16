import { useFrame } from '@react-three/fiber';
import { useSphere } from '@react-three/cannon';
import * as THREE from 'three';
import { usePlayerMovement } from '../../hooks/usePlayerMovement';
import { useCameraController } from '../../hooks/useCameraController';
import { useWeapon } from '../../hooks/useWeapon';
import { usePlayerHealth } from '../../hooks/usePlayerHealth';
import { MovementConfig } from '../../types/player';
import { WeaponConfig } from '../../types/weapon';
import { Gun } from './Gun';
import { BulletParticles } from './BulletParticles';
import { HealthBar } from './HealthBar';
import { useState, useRef, useCallback, useEffect } from 'react';

interface PlayerProps {
  onPlayerUpdate?: (position: THREE.Vector3, takeDamage: (damage: number, hitPosition: THREE.Vector3) => boolean) => void;
  showCollider?: boolean;
}

export function Player({ onPlayerUpdate, showCollider = false }: PlayerProps) {
  const [isMouseDown, setIsMouseDown] = useState(false);
  const lastTime = useRef(performance.now());
  
  // Enhanced configuration with jump settings
  const movementConfig: MovementConfig = {
    moveSpeed: 12,
    maxSpeed: 12,
    jumpForce: 12,
    acceleration: 0.2,
    deceleration: 0.15,
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

  // Physics objects optimized for smooth movement with proper collision
  const [playerRef, playerApi] = useSphere<THREE.Mesh>(() => ({
    mass: 1,
    position: [0, 5, 0],
    material: {
      friction: 0.1,
      restitution: 0.1,
    },
    fixedRotation: true,
    linearDamping: 0.05, // Very low damping for responsive movement
    angularDamping: 1,
  }));

  // Enhanced movement hook with jump
  const { position, updateMovement, isGrounded } = usePlayerMovement(
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

  // Add health system
  const { health, maxHealth, takeDamage } = usePlayerHealth(100);

  // Mouse shooting controls
  useEffect(() => {
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
  }, []);

  // Expose takeDamage function for enemy hits
  const handleTakeDamage = useCallback((damage: number, hitPosition: THREE.Vector3) => {
    const died = takeDamage(damage);
    return died;
  }, [takeDamage]);

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

    // Notify parent component of player updates
    if (onPlayerUpdate) {
      onPlayerUpdate(playerPosition, handleTakeDamage);
    }
  });

  const playerPosition = new THREE.Vector3(...position.current);
  const gunWorldPosition = getGunPosition(playerPosition);
  const rotation = getRotation();

  return (
    <group>
      {/* Player cylinder body with ground indicator */}
      <mesh ref={playerRef} castShadow rotation={[0, rotation.horizontal, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 1.0, 8]} />
        <meshLambertMaterial color={isGrounded() ? "#00ff88" : "#ff8800"} />
      </mesh>
      
      {/* Player collider visualization */}
      {showCollider && (
        <mesh position={[playerPosition.x, playerPosition.y, playerPosition.z]}>
          <cylinderGeometry args={[0.4, 0.4, 1.0, 8]} />
          <meshBasicMaterial 
            color="#ff0000" 
            wireframe={true} 
            transparent={true} 
            opacity={0.7} 
          />
        </mesh>
      )}
      
      {/* Gun positioned and rotated correctly */}
      <group 
        position={[gunWorldPosition.x, gunWorldPosition.y, gunWorldPosition.z]} 
        rotation={[rotation.vertical, rotation.horizontal, 0]}
      >
        <Gun position={[0, 0, 0]} rotation={[0, 0, 0]} />
      </group>
      
      {/* Bullet particles */}
      <BulletParticles bullets={bullets} particleSize={weaponConfig.particleSize} />
      
      {/* Player health bar */}
      <HealthBar 
        position={playerPosition}
        health={health}
        maxHealth={maxHealth}
        isEnemy={false}
      />
    </group>
  );
}


