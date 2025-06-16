export interface BulletParticle {
  id: string;
  position: [number, number, number];
  velocity: [number, number, number];
  life: number;
  maxLife: number;
}

export interface WeaponConfig {
  fireRate: number; // shots per second
  bulletSpeed: number;
  bulletLife: number; // seconds
  particleSize: number;
}
