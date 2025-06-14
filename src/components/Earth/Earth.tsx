import { useRef, useMemo } from "react";
import { useLoader } from "@react-three/fiber";
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
    borderThickness?: number;
    quality?: number;
    borderOnlyMode?: boolean;
    borderColor?: string; // New prop for border color
}

export function Earth({
    position = [0, 0, 0],
    scale = 1,
    isNightTexture,
    showClouds = true,
    showCountryBorders = false,
    brightness = 1,
    borderThickness = 1.5,
    quality = 64,
    borderOnlyMode = false,
    borderColor = "#00ff88", // Default border color
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
        if (borderOnlyMode) {
            // Gray sphere material for border-only mode
            return new THREE.MeshPhongMaterial({
                color: 0x404040, // Dark gray
                transparent: false,
                opacity: 1.0,
                shininess: 20,
            });
        }

        const material = new THREE.MeshPhongMaterial({
            map: isNightTexture ? nightTexture : dayTexture,
            shininess: 100,
        });
        return material;
    }, [isNightTexture, dayTexture, nightTexture, borderOnlyMode]);

    const cloudsMaterial = useMemo(() => {
        return new THREE.MeshPhongMaterial({
            map: cloudsTexture,
            transparent: true,
            opacity: 0.4 * brightness,
            depthWrite: false,
        });
    }, [cloudsTexture, brightness]);

    return (
        <group ref={groupRef} position={position} scale={scale}>
            {/* Main Earth sphere */}
            <mesh
                ref={earthRef}
                geometry={earthGeometry}
                material={earthMaterial}
            />

            {/* Clouds layer - hide in border-only mode */}
            {showClouds && !borderOnlyMode && (
                <mesh
                    ref={cloudsRef}
                    geometry={cloudsGeometry}
                    material={cloudsMaterial}
                    scale={1.01}
                />
            )}

            {/* Country Borders - always show in border-only mode */}
            {(showCountryBorders || borderOnlyMode) && (
                <CountryBorders
                    visible={true}
                    opacity={borderOnlyMode ? 1.0 : 0.8 * brightness}
                    color={borderColor}
                    lineWidth={
                        borderOnlyMode ? borderThickness * 1.5 : borderThickness
                    }
                />
            )}
        </group>
    );
}
