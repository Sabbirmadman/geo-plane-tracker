export interface MovementKeys {
  w: boolean;
  a: boolean;
  s: boolean;
  d: boolean;
}

export interface MovementConfig {
  moveSpeed: number;
  maxSpeed: number;
  jumpForce?: number;
  acceleration?: number;
  deceleration?: number;
}

export interface MouseControlsConfig {
  mouseSensitivity: number;
}

export interface CameraConfig {
  distance: number;
  height: number;
}

export interface CameraRotation {
  horizontal: number;
  vertical: number;
}

export interface PlayerPosition {
  x: number;
  y: number;
  z: number;
}

export interface PlayerState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  isGrounded: boolean;
  health: number;
  maxHealth: number;
}
