import { Ref } from 'react';
import * as THREE from 'three';

export interface PhysicsAPI {
  position: {
    set: (x: number, y: number, z: number) => void;
    subscribe: (callback: (position: [number, number, number]) => void) => () => void;
  };
  velocity: {
    set: (x: number, y: number, z: number) => void;
    subscribe: (callback: (velocity: [number, number, number]) => void) => () => void;
  };
  applyImpulse: (force: [number, number, number], point: [number, number, number]) => void;
}

export type PhysicsRef = Ref<THREE.Mesh>;
export type PhysicsBoxRef = Ref<THREE.Mesh>;
export type PhysicsPlaneRef = Ref<THREE.Mesh>;
