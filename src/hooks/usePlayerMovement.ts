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
    });
    
    const unsubscribePosition = playerApi.position.subscribe((p: [number, number, number]) => {
      position.current = p;
    });

    return () => {
      unsubscribeVelocity();
      unsubscribePosition();
    };
  }, [playerApi]);

  // Keyboard controls
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
  }, []);

  // Movement logic updated to use camera controller vectors
  const updateMovement = (forwardVector: THREE.Vector3, rightVector: THREE.Vector3): void => {
    // Calculate movement vector
    const moveVector = new THREE.Vector3();
    
    if (keys.current.w) moveVector.add(forwardVector);
    if (keys.current.s) moveVector.sub(forwardVector);
    if (keys.current.a) moveVector.sub(rightVector); // A = move left (subtract right vector)
    if (keys.current.d) moveVector.add(rightVector); // D = move right (add right vector)
    
    // Apply movement with speed limiting
    if (moveVector.length() > 0) {
      moveVector.normalize();
      
      const desiredVelocity = moveVector.multiplyScalar(config.moveSpeed);
      const currentHorizontalVel = new THREE.Vector2(velocity.current[0], velocity.current[2]);
      const currentSpeed = currentHorizontalVel.length();
      
      const velocityDot = currentHorizontalVel.dot(new THREE.Vector2(desiredVelocity.x, desiredVelocity.z));
      
      if (currentSpeed < config.maxSpeed || velocityDot < 0) {
        const force: [number, number, number] = [
          (desiredVelocity.x - velocity.current[0]) * 1.5,
          0,
          (desiredVelocity.z - velocity.current[2]) * 1.5
        ];
        
        playerApi.applyImpulse(force, [0, 0, 0]);
      }
    } else {
      // Apply friction
      const friction = 0.85;
      playerApi.velocity.set(
        velocity.current[0] * friction,
        velocity.current[1],
        velocity.current[2] * friction
      );
    }

    // Speed limiter
    const horizontalSpeed = Math.sqrt(velocity.current[0] ** 2 + velocity.current[2] ** 2);
    if (horizontalSpeed > config.maxSpeed) {
      const scale = config.maxSpeed / horizontalSpeed;
      playerApi.velocity.set(
        velocity.current[0] * scale,
        velocity.current[1],
        velocity.current[2] * scale
      );
    }
  };

  return {
    velocity,
    position,
    updateMovement,
  };
}
