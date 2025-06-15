import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Planet } from "../Planet/Planet";
import { TextureManager } from "../../utils/textureManager";
import * as THREE from "three";

interface MercuryProps {
    showOrbit?: boolean;
    onPlanetClick?: (position: [number, number, number]) => void;
    onCameraTarget?: (position: [number, number, number]) => void;
}

export function Mercury({ onPlanetClick, onCameraTarget }: MercuryProps) {
    const orbitRef = useRef<THREE.Group>(null!);
    const orbitRadius = 15;
    const orbitSpeed = 0.002; // Mercury's fast orbit (88 days)

    // Animate Mercury's orbit around the sun
    useFrame(() => {
        if (orbitRef.current) {
            orbitRef.current.rotation.y += orbitSpeed;
        }
    });

    const mercuryConfig = TextureManager.createPlanetConfig("mercury");

    return (
        <group ref={orbitRef}>
            <Planet
                position={[orbitRadius, 0, 0]}
                radius={0.8}
                texture={mercuryConfig.day}
                bumpTexture={mercuryConfig.bump}
                normalTexture={mercuryConfig.normal}
                color="#8c7853"
                brightness={0.4}
                quality={32}
                name="Mercury"
                rotationSpeed={0.0003} // Very slow rotation (59 days)
                onPlanetClick={onPlanetClick}
                onCameraTarget={onCameraTarget}
            />
        </group>
    );
}
