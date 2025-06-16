import { useMemo } from 'react';
import * as THREE from 'three';
import { BulletParticle } from '../../types/weapon';

interface BulletParticlesProps {
  bullets: BulletParticle[];
  particleSize: number;
}

export function BulletParticles({ bullets, particleSize }: BulletParticlesProps) {
  const particleGeometry = useMemo(() => {
    return new THREE.SphereGeometry(particleSize, 8, 8);
  }, [particleSize]);

  const particleMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: '#ffff00',
      transparent: true,
    });
  }, []);

  return (
    <group>
      {bullets.map((bullet) => {
        const opacity = bullet.life / bullet.maxLife;
        const material = particleMaterial.clone();
        material.opacity = opacity;

        return (
          <mesh
            key={bullet.id}
            position={bullet.position}
            geometry={particleGeometry}
            material={material}
          />
        );
      })}
    </group>
  );
}
