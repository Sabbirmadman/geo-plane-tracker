import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Planet } from "../Planet/Planet";
import { TextureManager } from "../../utils/textureManager";
import * as THREE from "three";

interface MarsProps {
    onPlanetClick?: (position: [number, number, number]) => void;
    onCameraTarget?: (position: [number, number, number]) => void;
}

export function Mars({ onPlanetClick, onCameraTarget }: MarsProps) {
    const orbitRef = useRef<THREE.Group>(null!);
    const orbitRadius = 45;
    const orbitSpeed = 0.0008; // Mars orbit (687 days)

    // Animate Mars's orbit around the sun
    useFrame(() => {
        if (orbitRef.current) {
            orbitRef.current.rotation.y += orbitSpeed;
        }
    });

    const marsConfig = TextureManager.createPlanetConfig("mars");

    return (
        <group ref={orbitRef}>
            <Planet
                position={[orbitRadius, 0, 0]}
                radius={1.6}
                texture={marsConfig.day}
                bumpTexture={marsConfig.bump}
                normalTexture={marsConfig.normal}
                color="#cd5c5c"
                brightness={0.6}
                quality={48}
                name="Mars"
                rotationSpeed={0.0006} // Mars rotation (24.6 hours)
                onPlanetClick={onPlanetClick}
                onCameraTarget={onCameraTarget}
            />
        </group>
    );
}
