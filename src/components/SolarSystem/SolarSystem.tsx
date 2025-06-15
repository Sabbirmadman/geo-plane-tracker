import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Sun } from "./Sun";
import { Mercury } from "./Mercury";
import { Venus } from "./Venus";
import { Earth } from "./Earth";
import { Mars } from "./Mars";
import { Jupiter } from "./Jupiter";
import { Saturn } from "./Saturn";
import { OrbitLine } from "./OrbitLine";
import { AsteroidField } from "../Asteroid/AsteroidField";
import * as THREE from "three";
import { TextureManager } from "../../utils/textureManager";

interface SolarSystemProps {
    showOrbitLines?: boolean;
    isNightTexture?: boolean;
    showClouds?: boolean;
    brightness?: number;
    borderThickness?: number;
    showBorders?: boolean;
    earthQuality?: number;
    borderOnlyMode?: boolean;
    borderColor?: string;
    sunIntensity?: number;
    onPlanetClick?: (position: [number, number, number]) => void;
    onCameraTarget?: (position: [number, number, number]) => void;
}

export function SolarSystem({
    showOrbitLines = true,
    isNightTexture = false,
    showClouds = true,
    brightness = 1,
    borderThickness = 1.5,
    showBorders = true,
    earthQuality = 64,
    borderOnlyMode = false,
    borderColor = "#00ff88",
    sunIntensity = 2.5, // Increased default sun intensity
    onPlanetClick,
    onCameraTarget,
}: SolarSystemProps) {
    const earthOrbitRef = useRef<THREE.Group>(null!);
    const earthOrbitRadius = 30;
    const earthOrbitSpeed = 0.001; // Earth's orbit (365 days)

    // Animate Earth's orbit around the sun
    useFrame(() => {
        if (earthOrbitRef.current) {
            earthOrbitRef.current.rotation.y += earthOrbitSpeed;
        }
    });

    const sunConfig = TextureManager.createPlanetConfig("sun");

    return (
        <group>
            {/* Sun at center with brighter intensity */}
            <Sun
                position={[0, 0, 0]}
                radius={3}
                texture={sunConfig.emissive}
                intensity={sunIntensity}
                onSunClick={onCameraTarget}
            />

            {/* Asteroid Field - random asteroids passing by */}
            <AsteroidField
                count={75}
                spread={400}
                speed={0.03}
                minSize={0.05}
                maxSize={0.4}
                showGas={true}
            />

            {/* Orbital lines */}
            {showOrbitLines && (
                <group>
                    <OrbitLine radius={15} color="#666666" opacity={0.2} />{" "}
                    {/* Mercury */}
                    <OrbitLine radius={22} color="#888888" opacity={0.2} />{" "}
                    {/* Venus */}
                    <OrbitLine radius={30} color="#aaaaaa" opacity={0.3} />{" "}
                    {/* Earth */}
                    <OrbitLine radius={45} color="#cc8888" opacity={0.2} />{" "}
                    {/* Mars */}
                    <OrbitLine radius={70} color="#ddaa88" opacity={0.2} />{" "}
                    {/* Jupiter */}
                    <OrbitLine
                        radius={100}
                        color="#ffcc99"
                        opacity={0.2}
                    />{" "}
                    {/* Saturn */}
                </group>
            )}

            {/* Mercury */}
            <Mercury
                onPlanetClick={onPlanetClick}
                onCameraTarget={onCameraTarget}
            />

            {/* Venus */}
            <Venus
                onPlanetClick={onPlanetClick}
                onCameraTarget={onCameraTarget}
            />

            {/* Earth with orbit */}
            <group ref={earthOrbitRef}>
                <Earth
                    position={[earthOrbitRadius, 0, 0]}
                    isNightTexture={isNightTexture}
                    showClouds={showClouds}
                    showCountryBorders={showBorders}
                    brightness={brightness}
                    borderThickness={borderThickness}
                    quality={earthQuality}
                    borderOnlyMode={borderOnlyMode}
                    borderColor={borderColor}
                    onPlanetClick={onPlanetClick}
                    onCameraTarget={onCameraTarget}
                />
            </group>

            {/* Mars */}
            <Mars
                onPlanetClick={onPlanetClick}
                onCameraTarget={onCameraTarget}
            />

            {/* Jupiter */}
            <Jupiter
                onPlanetClick={onPlanetClick}
                onCameraTarget={onCameraTarget}
            />

            {/* Saturn with asteroid rings */}
            <Saturn
                onPlanetClick={onPlanetClick}
                onCameraTarget={onCameraTarget}
            />
        </group>
    );
}
