import { useRef, useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { MouseControlsConfig, CameraRotation } from '../types/player';

export function useMouseControls(config: MouseControlsConfig) {
  const { gl } = useThree();
  const [isPointerLocked, setIsPointerLocked] = useState<boolean>(false);
  const cameraRotation = useRef<CameraRotation>({ horizontal: 0, vertical: 0 });
  const mouseMovement = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = gl.domElement;
    
    const handlePointerLockChange = (): void => {
      setIsPointerLocked(document.pointerLockElement === canvas);
    };

    const handleClick = (): void => {
      if (!isPointerLocked) {
        canvas.requestPointerLock();
      }
    };

    const handleMouseMove = (event: MouseEvent): void => {
      if (isPointerLocked) {
        mouseMovement.current.x -= event.movementX * config.mouseSensitivity;
        mouseMovement.current.y += event.movementY * config.mouseSensitivity;
        
        // Clamp vertical rotation to prevent over-rotation
        mouseMovement.current.y = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, mouseMovement.current.y));
      }
    };

    canvas.addEventListener('click', handleClick);
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      canvas.removeEventListener('click', handleClick);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [gl, isPointerLocked, config.mouseSensitivity]);

  const getCameraRotation = (): CameraRotation => {
    cameraRotation.current.horizontal = mouseMovement.current.x;
    cameraRotation.current.vertical = mouseMovement.current.y;
    return cameraRotation.current;
  };

  return {
    isPointerLocked,
    getCameraRotation
  };
}
