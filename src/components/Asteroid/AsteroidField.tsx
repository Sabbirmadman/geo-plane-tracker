import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Asteroid } from "./Asteroid";
import { GasParticles } from "./GasParticles";

interface AsteroidFieldProps {
    count?: number;
    spread?: number;
    speed?: number;
    minSize?: number;
    maxSize?: number;
    showGas?: boolean;
}

export function AsteroidField({
    count = 50,
    spread = 300,
    speed = 0.02,
    minSize = 0.1,
    maxSize = 0.8,
    showGas = true,
}: AsteroidFieldProps) {
    const groupRef = useRef<THREE.Group>(null!);

    // Generate random asteroids
    const asteroidsRef = useRef<
        Array<{
            id: number;
            position: THREE.Vector3;
            initialPosition: THREE.Vector3;
            velocity: THREE.Vector3;
            scale: number;
            rotationSpeed: [number, number, number];
            seed: number;
            color: string;
            resetDistance: number;
        }>
    >([]);

    // Initialize asteroids only once
    useMemo(() => {
        if (asteroidsRef.current.length === 0) {
            for (let i = 0; i < count; i++) {
                // Random position in a large sphere around the solar system
                const phi = Math.random() * Math.PI * 2;
                const theta = Math.random() * Math.PI;
                const distance = spread * (0.5 + Math.random() * 0.5);

                const x = Math.sin(theta) * Math.cos(phi) * distance;
                const y = (Math.random() - 0.5) * spread * 0.3;
                const z = Math.sin(theta) * Math.sin(phi) * distance;

                // Random velocity
                const velocity = new THREE.Vector3(
                    (Math.random() - 0.5) * speed,
                    (Math.random() - 0.5) * speed * 0.3,
                    (Math.random() - 0.5) * speed
                );

                asteroidsRef.current.push({
                    id: i,
                    position: new THREE.Vector3(x, y, z),
                    initialPosition: new THREE.Vector3(x, y, z),
                    velocity,
                    scale: minSize + Math.random() * (maxSize - minSize),
                    rotationSpeed: [
                        (Math.random() - 0.5) * 0.03,
                        (Math.random() - 0.5) * 0.03,
                        (Math.random() - 0.5) * 0.03,
                    ] as [number, number, number],
                    seed: Math.random(),
                    color: [
                        "#8c7853",
                        "#a0866b",
                        "#6b5b45",
                        "#9c8a6d",
                        "#7a6b52",
                    ][Math.floor(Math.random() * 5)],
                    resetDistance: spread * 1.5,
                });
            }
        }
    }, [count, spread, speed, minSize, maxSize]);

    // Animate asteroids
    useFrame(() => {
        asteroidsRef.current.forEach((asteroid) => {
            // Move asteroid
            asteroid.position.add(asteroid.velocity);

            // Reset if too far from origin
            if (asteroid.position.length() > asteroid.resetDistance) {
                // Reset to a new random position on the opposite side
                const phi = Math.random() * Math.PI * 2;
                const theta = Math.random() * Math.PI;
                const distance = spread * (0.5 + Math.random() * 0.5);

                asteroid.position.set(
                    Math.sin(theta) * Math.cos(phi) * distance,
                    (Math.random() - 0.5) * spread * 0.3,
                    Math.sin(theta) * Math.sin(phi) * distance
                );

                // Point roughly towards center with some randomness
                const toCenter = new THREE.Vector3()
                    .subVectors(new THREE.Vector3(0, 0, 0), asteroid.position)
                    .normalize();

                asteroid.velocity
                    .copy(toCenter)
                    .multiplyScalar(speed * (0.5 + Math.random()));
                asteroid.velocity.add(
                    new THREE.Vector3(
                        (Math.random() - 0.5) * speed * 0.5,
                        (Math.random() - 0.5) * speed * 0.3,
                        (Math.random() - 0.5) * speed * 0.5
                    )
                );
            }
        });
    });

    return (
        <group ref={groupRef}>
            {/* Space dust and debris particles */}
            {showGas && (
                <GasParticles
                    innerRadius={spread * 0.3}
                    outerRadius={spread * 0.8}
                    particleCount={3000}
                    orbitSpeed={0.00005}
                    color="#6b5b45"
                    opacity={0.1}
                    size={0.03}
                    visible={true}
                />
            )}

            {/* Larger debris clouds */}
            {showGas && (
                <GasParticles
                    innerRadius={spread * 0.2}
                    outerRadius={spread * 1.2}
                    particleCount={1000}
                    orbitSpeed={0.00003}
                    color="#8c7853"
                    opacity={0.05}
                    size={0.08}
                    visible={true}
                />
            )}

            {/* Asteroids */}
            {asteroidsRef.current.map((asteroid) => (
                <Asteroid
                    key={asteroid.id}
                    position={[
                        asteroid.position.x,
                        asteroid.position.y,
                        asteroid.position.z,
                    ]}
                    scale={asteroid.scale}
                    rotationSpeed={asteroid.rotationSpeed}
                    color={asteroid.color}
                    seed={asteroid.seed}
                />
            ))}
        </group>
    );
}
