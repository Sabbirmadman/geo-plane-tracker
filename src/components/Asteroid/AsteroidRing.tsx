import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Asteroid } from "./Asteroid";
import { GasParticles } from "./GasParticles";

interface AsteroidRingProps {
    innerRadius: number;
    outerRadius: number;
    asteroidCount?: number;
    orbitSpeed?: number;
    color?: string;
    opacity?: number;
    visible?: boolean;
    showGas?: boolean;
    gasParticleCount?: number;
}

export function AsteroidRing({
    innerRadius,
    outerRadius,
    asteroidCount = 300,
    orbitSpeed = 0.0001,
    color = "#d4af37",
    visible = true,
    showGas = true,
    gasParticleCount = 1500,
}: AsteroidRingProps) {
    const groupRef = useRef<THREE.Group>(null!);

    // Generate asteroid positions and properties
    const asteroids = useMemo(() => {
        const asteroidData = [];

        for (let i = 0; i < asteroidCount; i++) {
            const angle = (i / asteroidCount) * Math.PI * 2;
            const radiusVariation = Math.random() * 0.5 + 0.75; // 0.75 to 1.25
            const radius =
                innerRadius + (outerRadius - innerRadius) * Math.random();

            const x = Math.cos(angle) * radius * radiusVariation;
            const z = Math.sin(angle) * radius * radiusVariation;
            const y = (Math.random() - 0.5) * 0.2; // Small vertical variation

            asteroidData.push({
                id: i,
                position: [x, y, z] as [number, number, number],
                scale: 0.02 + Math.random() * 0.03, // Small asteroids
                rotationSpeed: [
                    (Math.random() - 0.5) * 0.02,
                    (Math.random() - 0.5) * 0.02,
                    (Math.random() - 0.5) * 0.02,
                ] as [number, number, number],
                seed: Math.random(),
                orbitRadius: radius,
                orbitAngle: angle,
                orbitSpeed: orbitSpeed * (0.8 + Math.random() * 0.4), // Vary speeds
            });
        }

        return asteroidData;
    }, [innerRadius, outerRadius, asteroidCount, orbitSpeed]);

    // Animate ring rotation
    useFrame(() => {
        if (groupRef.current && visible) {
            groupRef.current.rotation.y += orbitSpeed;
        }
    });

    // Set visibility
    useEffect(() => {
        if (groupRef.current) {
            groupRef.current.visible = visible;
        }
    }, [visible]);

    return (
        <group ref={groupRef} visible={visible}>
            {/* Gas particles for realism */}
            {showGas && (
                <GasParticles
                    innerRadius={innerRadius}
                    outerRadius={outerRadius}
                    particleCount={gasParticleCount}
                    orbitSpeed={orbitSpeed}
                    color={color}
                    opacity={0.2}
                    size={0.05}
                    visible={visible}
                />
            )}

            {/* Dust particles (smaller, more numerous) */}
            {showGas && (
                <GasParticles
                    innerRadius={innerRadius}
                    outerRadius={outerRadius}
                    particleCount={gasParticleCount * 2}
                    orbitSpeed={orbitSpeed * 1.2}
                    color={color}
                    opacity={0.1}
                    size={0.02}
                    visible={visible}
                />
            )}

            {/* Ice crystals (brighter, sparser) */}
            {showGas && (
                <GasParticles
                    innerRadius={innerRadius}
                    outerRadius={outerRadius}
                    particleCount={gasParticleCount / 3}
                    orbitSpeed={orbitSpeed * 0.8}
                    color="#ffffff"
                    opacity={0.4}
                    size={0.08}
                    visible={visible}
                />
            )}

            {/* Asteroids */}
            {asteroids.map((asteroid) => (
                <Asteroid
                    key={asteroid.id}
                    position={asteroid.position}
                    scale={asteroid.scale}
                    rotationSpeed={asteroid.rotationSpeed}
                    color={color}
                    seed={asteroid.seed}
                />
            ))}
        </group>
    );
}
