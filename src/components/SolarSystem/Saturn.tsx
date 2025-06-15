import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Planet, MoonData, RingData } from "../Planet/Planet";
import { TextureManager } from "../../utils/textureManager";
import * as THREE from "three";

interface SaturnProps {
    onPlanetClick?: (position: [number, number, number]) => void;
    onCameraTarget?: (position: [number, number, number]) => void;
}

export function Saturn({ onPlanetClick, onCameraTarget }: SaturnProps) {
    const orbitRef = useRef<THREE.Group>(null!);
    const orbitRadius = 100;
    const orbitSpeed = 0.0002; // Saturn orbit (29 years)

    // Animate Saturn's orbit around the sun
    useFrame(() => {
        if (orbitRef.current) {
            orbitRef.current.rotation.y += orbitSpeed;
        }
    });

    const saturnConfig = TextureManager.createPlanetConfig("saturn");

    // Saturn's rings
    const saturnRings: RingData = {
        innerRadius: 7,
        outerRadius: 12,
        texture: TextureManager.getRingTexture("saturn"),
        color: "#ffd700",
        opacity: 0.8,
    };

    // Saturn's major moons
    const saturnMoons: MoonData[] = [
        {
            name: "Titan",
            texture: TextureManager.getTextureWithFallback(
                "moon",
                "day",
                "ice"
            ),
            radius: 0.4,
            distance: 18,
            orbitSpeed: 0.0005,
            color: "#ffaa77",
        },
        {
            name: "Enceladus",
            texture: TextureManager.getTextureWithFallback(
                "moon",
                "day",
                "ice"
            ),
            radius: 0.15,
            distance: 14,
            orbitSpeed: 0.0008,
            color: "#ffffff",
        },
    ];

    return (
        <group ref={orbitRef}>
            <Planet
                position={[orbitRadius, 0, 0]}
                radius={5.5}
                texture={saturnConfig.day}
                bumpTexture={saturnConfig.bump}
                normalTexture={saturnConfig.normal}
                color="#fab981"
                brightness={0.6}
                quality={64}
                name="Saturn"
                rotationSpeed={0.0009} // Fast rotation (10.7 hours)
                rings={saturnRings}
                moons={saturnMoons}
                onPlanetClick={onPlanetClick}
                onCameraTarget={onCameraTarget}
            />
        </group>
    );
}
