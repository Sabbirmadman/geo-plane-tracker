import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { MovementKeys, MovementConfig } from '../types/player';
import { PhysicsAPI } from '../types/physics';

export function usePlayerMovement(
  playerApi: PhysicsAPI,
  config: MovementConfig
) {
  const velocity = useRef<[number, number, number]>([0, 0, 0]);
  const position = useRef<[number, number, number]>([0, 5, 0]);
  const isGrounded = useRef(false);
  const keys = useRef<MovementKeys>({
    w: false,
    a: false,
    s: false,
    d: false,
  });

  // Subscribe to physics updates
  useEffect(() => {
    const unsubscribeVelocity = playerApi.velocity.subscribe((v: [number, number, number]) => {
      velocity.current = v;
      // Check if grounded based on vertical velocity
      isGrounded.current = Math.abs(v[1]) < 0.1 && position.current[1] < 2;
    });
    
    const unsubscribePosition = playerApi.position.subscribe((p: [number, number, number]) => {
      position.current = p;
    });

    return () => {
      unsubscribeVelocity();
      unsubscribePosition();
    };
  }, [playerApi]);

  // Enhanced keyboard controls with jump
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'KeyW':
          keys.current.w = true;
          break;
        case 'KeyA':
          keys.current.a = true;
          break;
        case 'KeyS':
          keys.current.s = true;
          break;
        case 'KeyD':
          keys.current.d = true;
          break;
        case 'Space':
          event.preventDefault();
          if (isGrounded.current) {
            playerApi.velocity.set(velocity.current[0], 12, velocity.current[2]); // Jump
          }
          break;
        case 'Escape':
          document.exitPointerLock();
          break;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'KeyW':
          keys.current.w = false;
          break;
        case 'KeyA':
          keys.current.a = false;
          break;
        case 'KeyS':
          keys.current.s = false;
          break;
        case 'KeyD':
          keys.current.d = false;
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [playerApi]);

  // Smooth movement system
  const updateMovement = (forwardVector: THREE.Vector3, rightVector: THREE.Vector3): void => {
    // Calculate input direction
    let inputX = 0;
    let inputZ = 0;
    
    if (keys.current.w) {
      inputX += forwardVector.x;
      inputZ += forwardVector.z;
    }
    if (keys.current.s) {
      inputX -= forwardVector.x;
      inputZ -= forwardVector.z;
    }
    if (keys.current.a) {
      inputX -= rightVector.x;
      inputZ -= rightVector.z;
    }
    if (keys.current.d) {
      inputX += rightVector.x;
      inputZ += rightVector.z;
    }

    // Normalize input for diagonal movement
    const inputMagnitude = Math.sqrt(inputX * inputX + inputZ * inputZ);
    if (inputMagnitude > 0) {
      inputX /= inputMagnitude;
      inputZ /= inputMagnitude;
    }

    // Calculate target velocity
    const targetVelX = inputX * config.moveSpeed;
    const targetVelZ = inputZ * config.moveSpeed;

    // Current horizontal velocity
    const currentVelX = velocity.current[0];
    const currentVelZ = velocity.current[2];

    // Smooth acceleration/deceleration
    const acceleration = inputMagnitude > 0 ? 0.2 : 0.15; // Faster acceleration, slower deceleration
    
    const newVelX = THREE.MathUtils.lerp(currentVelX, targetVelX, acceleration);
    const newVelZ = THREE.MathUtils.lerp(currentVelZ, targetVelZ, acceleration);

    // Apply velocity while preserving Y component (for gravity and jumping)
    playerApi.velocity.set(newVelX, velocity.current[1], newVelZ);

    // Speed limiting
    const horizontalSpeed = Math.sqrt(newVelX * newVelX + newVelZ * newVelZ);
    if (horizontalSpeed > config.maxSpeed) {
      const scale = config.maxSpeed / horizontalSpeed;
      playerApi.velocity.set(
        newVelX * scale,
        velocity.current[1],
        newVelZ * scale
      );
    }
  };

  return {
    velocity,
    position,
    isGrounded: () => isGrounded.current,
    updateMovement,
  };
}
