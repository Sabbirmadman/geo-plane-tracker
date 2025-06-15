import { useRef, useMemo } from "react";
import { ThreeEvent, useFrame } from "@react-three/fiber";
import { useLoader } from "@react-three/fiber";
import { TextureLoader } from "three";
import * as THREE from "three";

interface MoonProps {
    name: string;
    texture?: string;
    radius: number;
    distance: number;
    orbitSpeed: number;
    color?: string;
    emissive?: boolean;
    emissiveIntensity?: number;
    quality?: number;
    onMoonClick?: (position: [number, number, number]) => void;
}

export function Moon({
    texture,
    radius,
    distance,
    orbitSpeed,
    color = "#ffffff",
    emissive = false,
    emissiveIntensity = 0.5,
    quality = 32,
    onMoonClick,
}: MoonProps) {
    const moonRef = useRef<THREE.Mesh>(null!);
    const orbitRef = useRef<THREE.Group>(null!);

    // Always call useLoader with consistent pattern
    const defaultTexture =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
    const textureToLoad = texture || defaultTexture;
    const [moonTexture] = useLoader(TextureLoader, [textureToLoad]);

    // Moon geometry
    const moonGeometry = useMemo(() => {
        return new THREE.SphereGeometry(radius, quality, quality);
    }, [radius, quality]);

    // Moon material
    const moonMaterial = useMemo(() => {
        const materialProps: THREE.MeshPhongMaterialParameters = {
            color: color,
            shininess: 100,
        };

        // Only use the texture if it's not the default placeholder
        if (texture && moonTexture) {
            materialProps.map = moonTexture;
        }

        if (emissive) {
            materialProps.emissive = new THREE.Color(color);
            materialProps.emissiveIntensity = emissiveIntensity;
        }

        return new THREE.MeshPhongMaterial(materialProps);
    }, [color, moonTexture, emissive, emissiveIntensity, texture]);

    // Animate moon orbit
    useFrame(() => {
        if (orbitRef.current) {
            orbitRef.current.rotation.y += orbitSpeed;
        }
    });

    const handleMoonClick = (event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        const worldPosition = new THREE.Vector3();
        moonRef.current.getWorldPosition(worldPosition);
        const pos: [number, number, number] = [
            worldPosition.x,
            worldPosition.y,
            worldPosition.z,
        ];
        onMoonClick?.(pos);
    };

    return (
        <group ref={orbitRef}>
            <mesh
                ref={moonRef}
                geometry={moonGeometry}
                material={moonMaterial}
                position={[distance, 0, 0]}
                onClick={handleMoonClick}
            />
        </group>
    );
}
