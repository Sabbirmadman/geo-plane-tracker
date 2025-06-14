import { useRef, useMemo } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { TextureLoader } from "three";
import * as THREE from "three";
import { CountryBorders } from "../CountryBorders/CountryBorders";

interface EarthProps {
    position?: [number, number, number];
    scale?: number;
    isNightTexture?: boolean;
    showClouds?: boolean;
    showCountryBorders?: boolean;
    brightness?: number;
    isRotating?: boolean;
    borderThickness?: number;
    quality?: number;
}

export function Earth({
    position = [0, 0, 0],
    scale = 1,
    isNightTexture,
    showClouds = true,
    showCountryBorders = false,
    brightness = 1,
    isRotating = false,
    borderThickness = 1.5,
    quality = 64,
}: EarthProps) {
    const earthRef = useRef<THREE.Mesh>(null!);
    const cloudsRef = useRef<THREE.Mesh>(null!);
    const groupRef = useRef<THREE.Group>(null!);

    // Load textures with error handling
    const [dayTexture, nightTexture, cloudsTexture] = useLoader(TextureLoader, [
        "/textures/2k_earth_daymap.jpg",
        "/textures/2k_earth_nightmap.jpg",
        "/textures/2k_earth_clouds.jpg",
    ]);

    // Memoize geometry to prevent recreation on every render
    const earthGeometry = useMemo(() => {
        return new THREE.SphereGeometry(2, quality, quality);
    }, [quality]);

    const cloudsGeometry = useMemo(() => {
        return new THREE.SphereGeometry(
            2,
            Math.max(32, quality / 2),
            Math.max(32, quality / 2)
        );
    }, [quality]);

    // Optimized materials
    const earthMaterial = useMemo(() => {
        const material = new THREE.MeshPhongMaterial({
            map: isNightTexture ? nightTexture : dayTexture,
            shininess: 100,
        });
        return material;
    }, [isNightTexture, dayTexture, nightTexture]);

    const cloudsMaterial = useMemo(() => {
        return new THREE.MeshPhongMaterial({
            map: cloudsTexture,
            transparent: true,
            opacity: 0.4 * brightness,
            depthWrite: false,
        });
    }, [cloudsTexture, brightness]);

    // Controlled rotation with performance optimization
    useFrame((state, delta) => {
        if (isRotating && groupRef.current) {
            groupRef.current.rotation.y += delta * 0.1;
        }
        if (isRotating && cloudsRef.current && showClouds) {
            cloudsRef.current.rotation.y += delta * 0.02;
        }
    });

    return (
        <group ref={groupRef} position={position} scale={scale}>
            {/* Main Earth sphere */}
            <mesh
                ref={earthRef}
                geometry={earthGeometry}
                material={earthMaterial}
            />

            {/* Clouds layer */}
            {showClouds && (
                <mesh
                    ref={cloudsRef}
                    geometry={cloudsGeometry}
                    material={cloudsMaterial}
                    scale={1.01}
                />
            )}

            {/* Country Borders */}
            {showCountryBorders && (
                <CountryBorders
                    visible={showCountryBorders}
                    opacity={0.8 * brightness}
                    color="#00ff88"
                    lineWidth={borderThickness}
                />
            )}
        </group>
    );
}
