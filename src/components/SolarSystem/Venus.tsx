import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Planet } from "../Planet/Planet";
import { TextureManager } from "../../utils/textureManager";
import * as THREE from "three";

interface VenusProps {
    onPlanetClick?: (position: [number, number, number]) => void;
    onCameraTarget?: (position: [number, number, number]) => void;
}

export function Venus({ onPlanetClick, onCameraTarget }: VenusProps) {
    const orbitRef = useRef<THREE.Group>(null!);
    const orbitRadius = 110; // Increased from 22 to 110 (5x larger)
    const orbitSpeed = 0.0015; // Venus orbit (225 days)

    // Animate Venus's orbit around the sun
    useFrame(() => {
        if (orbitRef.current) {
            orbitRef.current.rotation.y += orbitSpeed;
        }
    });

    const venusConfig = TextureManager.createPlanetConfig("venus");

    return (
        <group ref={orbitRef}>
            <Planet
                position={[orbitRadius, 0, 0]}
                radius={1.8}
                texture={venusConfig.day}
                cloudTexture={venusConfig.clouds}
                bumpTexture={venusConfig.bump}
                normalTexture={venusConfig.normal}
                color="#ffc649"
                brightness={0.8}
                quality={48}
                name="Venus"
                rotationSpeed={-0.0001} // Retrograde rotation (243 days)
                showClouds={true}
                onPlanetClick={onPlanetClick}
                onCameraTarget={onCameraTarget}
            />
        </group>
    );
}
