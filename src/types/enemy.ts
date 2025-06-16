import * as THREE from 'three';

export interface EnemyConfig {
  health: number;
  maxHealth: number;
  detectionRange: number;
  radarAngle: number; // V-shape radar angle in radians
  fireRate: number;
  bulletSpeed: number;
  bulletDamage: number;
  moveSpeed: number;
  rotationSpeed: number;
}

export interface EnemyState {
  id: string;
  position: THREE.Vector3;
  rotation: number;
  health: number;
  maxHealth: number;
  isDetectingPlayer: boolean;
  lastShotTime: number;
  target: THREE.Vector3 | null;
}

export interface DamageNumber {
  id: string;
  position: THREE.Vector3;
  damage: number;
  life: number;
  maxLife: number;
}

export interface HitResult {
  hit: boolean;
  damage: number;
  position: THREE.Vector3;
}
