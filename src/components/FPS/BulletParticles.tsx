import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BulletParticle } from '../../types/weapon';

interface BulletParticlesProps {
  bullets: BulletParticle[];
  particleSize: number;
}

export function BulletParticles({ bullets, particleSize }: BulletParticlesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // Create instanced geometry with minimal segments
  const geometry = useMemo(() => new THREE.SphereGeometry(particleSize, 3, 2), [particleSize]);
  const material = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#ffff00',
    transparent: true
  }), []);

  // Update instances each frame
  useFrame(() => {
    if (!meshRef.current || bullets.length === 0) return;

    const tempMatrix = new THREE.Matrix4();
    const tempColor = new THREE.Color();

    bullets.forEach((bullet, index) => {
      const opacity = bullet.life / bullet.maxLife;

      // Set position
      tempMatrix.setPosition(...bullet.position);
      meshRef.current!.setMatrixAt(index, tempMatrix);

      // Set color with opacity
      tempColor.setHex(0xffff00);
      tempColor.multiplyScalar(opacity);
      meshRef.current!.setColorAt(index, tempColor);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  if (bullets.length === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, Math.max(bullets.length, 1)]}
      count={bullets.length}
    />
  );
}
