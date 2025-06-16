import { useRef, useEffect, useState, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

export interface CameraState {
  position: THREE.Vector3;
  rotation: {
    horizontal: number;
    vertical: number;
  };
  direction: THREE.Vector3;
  rightVector: THREE.Vector3;
  forwardVector: THREE.Vector3;
}

export interface CameraControllerConfig {
  mouseSensitivity: number;
  cameraDistance: number;
  cameraHeight: number;
  verticalClamp: number;
}

export function useCameraController(config: CameraControllerConfig) {
  const { camera } = useThree();
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  
  const cameraState = useRef<CameraState>({
    position: new THREE.Vector3(),
    rotation: { horizontal: 0, vertical: 0 },
    direction: new THREE.Vector3(0, 0, -1),
    rightVector: new THREE.Vector3(1, 0, 0),
    forwardVector: new THREE.Vector3(0, 0, -1)
  });

  // Define updateDirectionVectors BEFORE using it
  const updateDirectionVectors = useCallback(() => {
    const { horizontal, vertical } = cameraState.current.rotation;
    
    // Calculate forward direction (where camera/gun points)
    cameraState.current.direction.set(
      Math.sin(horizontal) * Math.cos(vertical),
      -Math.sin(vertical),
      Math.cos(horizontal) * Math.cos(vertical)
    );

    // Calculate right vector for movement - FIXED
    cameraState.current.rightVector.set(
      -Math.cos(horizontal), // Negative to fix left/right direction
      0,
      Math.sin(horizontal)
    );

    // Calculate forward vector for movement (no vertical component)
    cameraState.current.forwardVector.set(
      Math.sin(horizontal),
      0,
      Math.cos(horizontal)
    );
  }, []);

  // Mouse input handling - NOW updateDirectionVectors is defined
  useEffect(() => {
    const canvas = document.querySelector('canvas');
    
    if (!canvas) return;

    const handlePointerLockChange = () => {
      setIsPointerLocked(document.pointerLockElement === canvas);
    };

    const handleClick = () => {
      if (!isPointerLocked) {
        canvas.requestPointerLock();
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isPointerLocked) return;

      // Update horizontal rotation (yaw)
      cameraState.current.rotation.horizontal -= event.movementX * config.mouseSensitivity;
      
      // Update vertical rotation (pitch) with clamping
      cameraState.current.rotation.vertical += event.movementY * config.mouseSensitivity;
      cameraState.current.rotation.vertical = Math.max(
        -config.verticalClamp, 
        Math.min(config.verticalClamp, cameraState.current.rotation.vertical)
      );

      // Update direction vectors
      updateDirectionVectors();
    };

    canvas.addEventListener('click', handleClick);
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      canvas.removeEventListener('click', handleClick);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isPointerLocked, config.mouseSensitivity, config.verticalClamp, updateDirectionVectors]);

  const updateCamera = useCallback((playerPosition: THREE.Vector3) => {
    // Update direction vectors
    updateDirectionVectors();

    // Calculate camera position behind player
    const cameraOffset = new THREE.Vector3(
      -cameraState.current.direction.x * config.cameraDistance,
      config.cameraHeight - cameraState.current.direction.y * config.cameraDistance,
      -cameraState.current.direction.z * config.cameraDistance
    );

    const targetPosition = playerPosition.clone().add(cameraOffset);
    camera.position.lerp(targetPosition, 0.15);

    // Look at point in front of player
    const lookAtTarget = playerPosition.clone().add(cameraState.current.direction.clone().multiplyScalar(10));
    camera.lookAt(lookAtTarget);

    // Store camera position
    cameraState.current.position.copy(camera.position);
  }, [camera, config.cameraDistance, config.cameraHeight, updateDirectionVectors]);

  const getGunPosition = useCallback((playerPosition: THREE.Vector3): THREE.Vector3 => {
    const gunOffset = new THREE.Vector3(0.3, 0.1, 0.4);
    
    // Apply horizontal rotation to gun offset
    const rotationMatrix = new THREE.Matrix4().makeRotationY(cameraState.current.rotation.horizontal);
    gunOffset.applyMatrix4(rotationMatrix);
    
    return playerPosition.clone().add(gunOffset);
  }, []);

  const getBulletSpawnPoint = useCallback((playerPosition: THREE.Vector3): THREE.Vector3 => {
    const gunPos = getGunPosition(playerPosition);
    
    // Extend forward from gun position along gun barrel
    const barrelLength = 0.8;
    const barrelEnd = cameraState.current.direction.clone().multiplyScalar(barrelLength);
    
    return gunPos.add(barrelEnd);
  }, [getGunPosition]);

  const getBulletDirection = useCallback((): THREE.Vector3 => {
    // Return normalized direction vector (exactly where camera/cursor points)
    return cameraState.current.direction.clone().normalize();
  }, []);

  const getMovementVectors = useCallback(() => {
    return {
      forward: cameraState.current.forwardVector.clone(),
      right: cameraState.current.rightVector.clone()
    };
  }, []);

  return {
    isPointerLocked,
    cameraState: cameraState.current,
    updateCamera,
    getGunPosition,
    getBulletSpawnPoint,
    getBulletDirection,
    getMovementVectors,
    getRotation: () => cameraState.current.rotation,
    getDirection: () => cameraState.current.direction.clone()
  };
}
