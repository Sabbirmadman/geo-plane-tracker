import { useRef, useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import { TextureLoader } from "three";
import * as THREE from "three";

interface PlanetRingsProps {
    innerRadius: number;
    outerRadius: number;
    texture?: string;
    color?: string;
    opacity?: number;
    segments?: number;
    visible?: boolean;
}

export function PlanetRings({
    innerRadius,
    outerRadius,
    texture,
    color = "#ffffff",
    opacity = 0.7,
    segments = 64,
    visible = true,
}: PlanetRingsProps) {
    const ringRef = useRef<THREE.Mesh>(null!);

    // Always call useLoader with consistent pattern
    const defaultTexture =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
    const textureToLoad = texture || defaultTexture;
    const [ringTexture] = useLoader(TextureLoader, [textureToLoad]);

    // Create ring geometry
    const ringGeometry = useMemo(() => {
        return new THREE.RingGeometry(innerRadius, outerRadius, segments);
    }, [innerRadius, outerRadius, segments]);

    // Create ring material
    const ringMaterial = useMemo(() => {
        const materialProps: THREE.MeshBasicMaterialParameters = {
            color: color,
            transparent: true,
            opacity: visible ? opacity : 0,
            side: THREE.DoubleSide,
            depthWrite: false,
        };

        // Only use the texture if it's not the default placeholder
        if (texture && ringTexture) {
            materialProps.map = ringTexture;
            materialProps.alphaMap = ringTexture;
        }

        return new THREE.MeshBasicMaterial(materialProps);
    }, [color, opacity, ringTexture, texture, visible]);

    if (!visible) {
        return null;
    }

    return (
        <mesh
            ref={ringRef}
            geometry={ringGeometry}
            material={ringMaterial}
            rotation={[Math.PI / 2, 0, 0]} // Rotate to be horizontal
            visible={visible}
        />
    );
}
