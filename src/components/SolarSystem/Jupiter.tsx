import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Planet, MoonData } from "../Planet/Planet";
import { TextureManager } from "../../utils/textureManager";
import * as THREE from "three";

interface JupiterProps {
    onPlanetClick?: (position: [number, number, number]) => void;
    onCameraTarget?: (position: [number, number, number]) => void;
}

export function Jupiter({ onPlanetClick, onCameraTarget }: JupiterProps) {
    const orbitRef = useRef<THREE.Group>(null!);
    const orbitRadius = 350; // Increased from 70 to 350 (5x larger)
    const orbitSpeed = 0.0003; // Jupiter orbit (12 years)

    // Animate Jupiter's orbit around the sun
    useFrame(() => {
        if (orbitRef.current) {
            orbitRef.current.rotation.y += orbitSpeed;
        }
    });

    const jupiterConfig = TextureManager.createPlanetConfig("jupiter");

    // Jupiter's major moons
    const jupiterMoons: MoonData[] = [
        {
            name: "Io",
            texture: TextureManager.getTextureWithFallback(
                "moon",
                "day",
                "rocky"
            ),
            radius: 0.3,
            distance: 8,
            orbitSpeed: 0.002,
            color: "#ffff88",
        },
        {
            name: "Europa",
            texture: TextureManager.getTextureWithFallback(
                "moon",
                "day",
                "ice"
            ),
            radius: 0.25,
            distance: 12,
            orbitSpeed: 0.0015,
            color: "#aaaaff",
        },
        {
            name: "Ganymede",
            texture: TextureManager.getTextureWithFallback(
                "moon",
                "day",
                "rocky"
            ),
            radius: 0.4,
            distance: 16,
            orbitSpeed: 0.001,
            color: "#888888",
        },
        {
            name: "Callisto",
            texture: TextureManager.getTextureWithFallback(
                "moon",
                "day",
                "rocky"
            ),
            radius: 0.35,
            distance: 22,
            orbitSpeed: 0.0008,
            color: "#666666",
        },
    ];

    return (
        <group ref={orbitRef}>
            <Planet
                position={[orbitRadius, 0, 0]}
                radius={6}
                texture={jupiterConfig.day}
                bumpTexture={jupiterConfig.bump}
                normalTexture={jupiterConfig.normal}
                color="#d8ca9d"
                brightness={0.7}
                quality={64}
                name="Jupiter"
                rotationSpeed={0.001} // Fast rotation (9.9 hours)
                moons={jupiterMoons}
                onPlanetClick={onPlanetClick}
                onCameraTarget={onCameraTarget}
            />
        </group>
    );
}
