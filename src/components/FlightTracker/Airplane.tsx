import { useRef, useMemo, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { FlightData } from "../../utils/flightData";
import { ScaleUtils } from "../../utils/scaleUtils";

interface AirplaneProps {
    flight: FlightData;
    isSelected: boolean;
    onClick: () => void;
    scaleMultiplier?: number;
}

export function Airplane({
    flight,
    isSelected,
    onClick,
    scaleMultiplier = 1,
}: AirplaneProps) {
    const meshRef = useRef<THREE.Group>(null);
    const airplaneRef = useRef<THREE.Group>(null);
    const { camera } = useThree();

    // Get camera distance for dynamic scaling
    const cameraDistance = useMemo(() => {
        const earthCenter = new THREE.Vector3(0, 0, 0);
        return camera.position.distanceTo(earthCenter);
    }, [camera.position]);

    // Debug logging with better scale info
    useEffect(() => {
        const scale = ScaleUtils.getAirplaneScale(
            scaleMultiplier,
            cameraDistance
        );
        console.log(
            `Airplane ${flight.callsign}: scale=${scale}, distance=${cameraDistance}`
        );
    }, [flight, scaleMultiplier, cameraDistance]);

    // Try to load the GLTF airplane model with fallback
    let scene: THREE.Group | null = null;
    try {
        const gltf = useGLTF("/model_plane/scene.gltf");
        scene = gltf.scene;
        console.log("GLTF model loaded successfully");
    } catch (error) {
        console.warn(
            "Failed to load GLTF model, using fallback geometry:",
            error
        );
        scene = null;
    }

    const position = useMemo(() => {
        const pos = ScaleUtils.getAirplanePosition(
            flight.longitude,
            flight.latitude,
            flight.altitude
        );
        console.log(`Airplane ${flight.callsign} position:`, pos);
        return pos;
    }, [flight.longitude, flight.latitude, flight.altitude]);

    // Calculate proper rotation based on heading and position on sphere
    const rotation = useMemo(() => {
        const phi = (90 - flight.latitude) * (Math.PI / 180);
        const theta = (flight.longitude + 180) * (Math.PI / 180);
        const headingRad = (flight.heading * Math.PI) / 180;

        return new THREE.Euler(
            phi - Math.PI / 2, // Pitch to align with surface
            theta + headingRad, // Yaw for heading direction
            0 // Roll
        );
    }, [flight.heading, flight.latitude, flight.longitude]);

    // Clone and modify the airplane model or create fallback
    const airplaneModel = useMemo(() => {
        if (scene) {
            const clonedScene = scene.clone();

            // Use much smaller scale - the GLTF model is very large
            const scale = ScaleUtils.getAirplaneScale(
                scaleMultiplier,
                cameraDistance
            );
            clonedScene.scale.setScalar(scale);

            console.log(
                `GLTF airplane final scale: ${scale} (should be very small)`
            );

            // Apply material modifications for selection state
            clonedScene.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    if (child.material) {
                        child.material = child.material.clone();
                        child.material.color.setHex(
                            isSelected ? 0xff4444 : 0xffffff
                        );
                        child.material.transparent = true;
                        child.material.opacity = 0.9;
                    }
                }
            });

            return clonedScene;
        }
        return null;
    }, [scene, isSelected, scaleMultiplier, cameraDistance]);

    // Fallback geometry - much smaller vertices
    const fallbackGeometry = useMemo(() => {
        const geometry = new THREE.BufferGeometry();

        // Small airplane vertices - realistic size relative to Earth
        const vertices = new Float32Array([
            // Fuselage (body) - small scale
            0,
            0,
            0.8, // nose
            -0.08,
            0,
            0.6, // left nose
            0.08,
            0,
            0.6, // right nose
            -0.12,
            0,
            0, // left mid
            0.12,
            0,
            0, // right mid
            -0.08,
            0,
            -0.6, // left tail
            0.08,
            0,
            -0.6, // right tail
            0,
            0,
            -0.8, // tail end

            // Wings - small scale
            -1,
            0,
            0.2, // left wing tip
            -0.32,
            0,
            0.1, // left wing root
            0.32,
            0,
            0.1, // right wing root
            1,
            0,
            0.2, // right wing tip

            // Tail wings - small scale
            -0.32,
            0,
            -0.5, // left tail wing
            0.32,
            0,
            -0.5, // right tail wing
            0,
            0.24,
            -0.4, // vertical tail top
            0,
            0,
            -0.4, // vertical tail base
        ]);

        const indices = [
            // Fuselage
            0,
            1,
            2, // nose
            1,
            3,
            4,
            1,
            4,
            2, // front section
            3,
            5,
            6,
            3,
            6,
            4, // mid section
            5,
            7,
            6, // tail

            // Main wings
            3,
            8,
            9, // left wing
            4,
            10,
            11, // right wing
            9,
            10,
            4,
            9,
            4,
            3, // wing center

            // Tail wings
            5,
            12,
            13,
            5,
            13,
            6, // horizontal tail
            15,
            14,
            7, // vertical tail
        ];

        geometry.setIndex(indices);
        geometry.setAttribute(
            "position",
            new THREE.BufferAttribute(vertices, 3)
        );
        geometry.computeVertexNormals();

        return geometry;
    }, []);

    // Create material for fallback airplane
    const fallbackMaterial = useMemo(() => {
        return new THREE.MeshPhongMaterial({
            color: isSelected ? 0xff4444 : 0x00aaff,
            transparent: true,
            opacity: 0.9,
            shininess: 100,
            side: THREE.DoubleSide,
        });
    }, [isSelected]);

    return (
        <group
            ref={meshRef}
            position={position}
            rotation={rotation}
            onClick={onClick}
            scale={isSelected ? 1.5 : 1.0} // Modest selection scaling
        >
            {/* 3D Airplane model or fallback */}
            {airplaneModel ? (
                <group ref={airplaneRef}>
                    <primitive object={airplaneModel} />
                </group>
            ) : (
                <mesh
                    geometry={fallbackGeometry}
                    material={fallbackMaterial}
                    scale={
                        ScaleUtils.getAirplaneScale(
                            scaleMultiplier,
                            cameraDistance
                        ) * 1000
                    } // Reasonable fallback scaling
                />
            )}
        </group>
    );
}

// Preload the GLTF model with error handling
try {
    useGLTF.preload("/model_plane/scene.gltf");
} catch (error) {
    console.warn("Could not preload GLTF model:", error);
}
