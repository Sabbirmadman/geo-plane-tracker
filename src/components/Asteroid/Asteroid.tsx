import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface AsteroidProps {
    position?: [number, number, number];
    scale?: number;
    rotationSpeed?: [number, number, number];
    color?: string;
    seed?: number;
}

export function Asteroid({
    position = [0, 0, 0],
    scale = 1,
    rotationSpeed = [0.01, 0.01, 0.01],
    color = "#8c7853",
    seed = Math.random(),
}: AsteroidProps) {
    const meshRef = useRef<THREE.Mesh>(null!);

    // Generate random low poly asteroid geometry
    const geometry = useMemo(() => {
        const geom = new THREE.OctahedronGeometry(1, 1);
        const vertices = geom.attributes.position.array as Float32Array;

        // Add randomness to vertices for irregular shape
        const seededRandom = () => {
            const x = Math.sin(seed * 9999) * 10000;
            return x - Math.floor(x);
        };

        for (let i = 0; i < vertices.length; i += 3) {
            const factor = 0.3 + seededRandom() * 0.4; // Random scale factor
            vertices[i] *= factor;
            vertices[i + 1] *= factor;
            vertices[i + 2] *= factor;
        }

        geom.attributes.position.needsUpdate = true;
        geom.computeVertexNormals();

        return geom;
    }, [seed]);

    // Create material with some variation
    const material = useMemo(() => {
        const baseColor = new THREE.Color(color);
        const seededRandom = () => {
            const x = Math.sin(seed * 12345) * 10000;
            return x - Math.floor(x);
        };

        // Add slight color variation
        baseColor.offsetHSL(0, 0, (seededRandom() - 0.5) * 0.3);

        return new THREE.MeshLambertMaterial({
            color: baseColor,
            flatShading: true,
        });
    }, [color, seed]);

    // Rotate asteroid
    useFrame(() => {
        if (meshRef.current) {
            meshRef.current.rotation.x += rotationSpeed[0];
            meshRef.current.rotation.y += rotationSpeed[1];
            meshRef.current.rotation.z += rotationSpeed[2];
        }
    });

    return (
        <mesh
            ref={meshRef}
            position={position}
            scale={scale}
            geometry={geometry}
            material={material}
            castShadow
            receiveShadow
        />
    );
}
