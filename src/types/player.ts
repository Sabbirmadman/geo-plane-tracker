export interface MovementKeys {
  w: boolean;
  a: boolean;
  s: boolean;
  d: boolean;
}

export interface MovementConfig {
  moveSpeed: number;
  maxSpeed: number;
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
