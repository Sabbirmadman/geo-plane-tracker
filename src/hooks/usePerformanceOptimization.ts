import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useEffect } from 'react';
import * as THREE from 'three';

export function usePerformanceOptimization() {
  const { gl, scene, camera } = useThree();
  const frameCount = useRef(0);

  useEffect(() => {
    // Optimize renderer settings
    gl.shadowMap.enabled = false; // Disable shadows completely
    gl.shadowMap.type = THREE.BasicShadowMap; // Use fastest shadow type if needed
    gl.setPixelRatio(Math.min(window.devicePixelRatio, 1)); // Limit pixel ratio
    
    // Optimize materials
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        if (object.material instanceof THREE.Material) {
          object.material.precision = 'lowp'; // Use low precision
          object.castShadow = false;
          object.receiveShadow = false;
        }
      }
    });

    // Enable frustum culling
    camera.updateMatrixWorld();
    
  }, [gl, scene, camera]);

  // Reduce update frequency for non-critical systems
  useFrame(() => {
    frameCount.current++;
    
    // Only update certain systems every few frames
    if (frameCount.current % 5 === 0) {
      // Update non-critical systems here
      scene.traverse((object) => {
        if (object.userData.isOptimizable) {
          // Apply level-of-detail logic
          const distance = camera.position.distanceTo(object.position);
          if (distance > 30) {
            object.visible = false;
          } else {
            object.visible = true;
          }
        }
      });
    }
  });

  return {
    setOptimizable: (object: THREE.Object3D) => {
      object.userData.isOptimizable = true;
    }
  };
}
