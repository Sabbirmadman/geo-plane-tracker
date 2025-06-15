import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import { Planet, MoonData, RingData } from "../Planet/Planet";
import { TextureManager } from "../../utils/textureManager";
import { AsteroidRing } from "../Asteroid/AsteroidRing";
import * as THREE from "three";

interface SaturnProps {
    onPlanetClick?: (position: [number, number, number]) => void;
    onCameraTarget?: (position: [number, number, number]) => void;
}

export function Saturn({ onPlanetClick, onCameraTarget }: SaturnProps) {
    const orbitRef = useRef<THREE.Group>(null!);
    const planetGroupRef = useRef<THREE.Group>(null!);
    const [cameraDistance, setCameraDistance] = useState<number>(1000);
    const orbitRadius = 100;
    const orbitSpeed = 0.0002; // Saturn orbit (29 years)

    // Distance threshold for switching between ring types
    const RING_SWITCH_DISTANCE = 50;

    // Animate Saturn's orbit around the sun
    useFrame(({ camera }) => {
        if (orbitRef.current) {
            orbitRef.current.rotation.y += orbitSpeed;
        }

        // Calculate distance from camera to Saturn
        if (planetGroupRef.current && camera) {
            const saturnWorldPos = new THREE.Vector3();
            planetGroupRef.current.getWorldPosition(saturnWorldPos);
            const distance = camera.position.distanceTo(saturnWorldPos);
            setCameraDistance(distance);
        }
    });

    const saturnConfig = TextureManager.createPlanetConfig("saturn");

    // Saturn's traditional rings for far viewing
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

    // Determine which ring system to use based on distance
    const useAsteroidRings = cameraDistance < RING_SWITCH_DISTANCE;

    return (
        <group ref={orbitRef}>
            <group ref={planetGroupRef} position={[orbitRadius, 0, 0]}>
                <Planet
                    position={[0, 0, 0]}
                    radius={5.5}
                    texture={saturnConfig.day}
                    bumpTexture={saturnConfig.bump}
                    normalTexture={saturnConfig.normal}
                    color="#fab981"
                    brightness={0.6}
                    quality={64}
                    name="Saturn"
                    rotationSpeed={0.0009} // Fast rotation (10.7 hours)
                    rings={useAsteroidRings ? undefined : saturnRings} // Use traditional rings when far
                    moons={saturnMoons}
                    onPlanetClick={onPlanetClick}
                    onCameraTarget={onCameraTarget}
                />

                {/* Detailed asteroid rings for close viewing */}
                {useAsteroidRings && (
                    <group>
                        <AsteroidRing
                            innerRadius={7}
                            outerRadius={9}
                            asteroidCount={200}
                            orbitSpeed={0.0001}
                            color="#d4af37"
                            showGas={true}
                            gasParticleCount={2000}
                        />
                        <AsteroidRing
                            innerRadius={9.5}
                            outerRadius={11}
                            asteroidCount={150}
                            orbitSpeed={0.00008}
                            color="#c9a96e"
                            showGas={true}
                            gasParticleCount={1500}
                        />
                        <AsteroidRing
                            innerRadius={11.5}
                            outerRadius={12.5}
                            asteroidCount={100}
                            orbitSpeed={0.00006}
                            color="#b8956b"
                            showGas={true}
                            gasParticleCount={1000}
                        />
                    </group>
                )}
            </group>
        </group>
    );
}
