import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { Suspense, memo, useRef, useEffect } from "react";
import { SolarSystem } from "../SolarSystem/SolarSystem";
import { TextureManager } from "../../utils/textureManager";
import { PerformanceManager } from "../../utils/performanceManager";
import { Rocket } from "../Rocket/Rocket";

interface SceneProps {
    isNightTexture?: boolean;
    showClouds?: boolean;
    showStars?: boolean;
    brightness?: number;
    ambientLightIntensity?: number;
    borderThickness?: number;
    showBorders?: boolean;
    earthQuality?: number;
    borderOnlyMode?: boolean;
    borderColor?: string;
    showOrbitLines?: boolean;
    sunIntensity?: number;
    onPlanetClick?: (position: [number, number, number]) => void;
    showRocket?: boolean;
    rocketMode?: "rocket" | "hover";
    onRocketPositionChange?: (position: [number, number, number]) => void;
}

export const Scene = memo(function Scene({
    isNightTexture = false,
    showClouds = true,
    showStars = true,
    brightness = 1,
    ambientLightIntensity = 0.1,
    borderThickness = 1.5,
    showBorders = true,
    earthQuality = 64,
    borderOnlyMode = false,
    borderColor = "#00ff88",
    showOrbitLines = true,
    sunIntensity = 1.5,
    onPlanetClick,
    showRocket = false,
    rocketMode = "rocket",
    onRocketPositionChange,
}: SceneProps) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const controlsRef = useRef<any>(null);

    // Preload essential textures on mount
    useEffect(() => {
        TextureManager.preloadEssentialTextures().catch(console.warn);
    }, []);

    // Preload textures based on camera distance
    useEffect(() => {
        if (controlsRef.current?.object) {
            const camera = controlsRef.current.object;
            const distance = camera.position.length();
            TextureManager.preloadByDistance(distance).catch(console.warn);
        }
    }, [controlsRef.current?.object?.position]);

    const handleCameraTarget = (position: [number, number, number]) => {
        if (controlsRef.current) {
            // Calculate distance based on object type (larger distance for sun)
            const distance =
                position[0] === 0 && position[1] === 0 && position[2] === 0
                    ? 15
                    : 8;
            controlsRef.current.object.position.set(
                position[0] + distance,
                position[1] + distance * 0.6,
                position[2] + distance
            );
            controlsRef.current.target.set(...position);
            controlsRef.current.update();
        }
    };

    return (
        <div className="w-full h-screen">
            <Canvas
                camera={{ position: [0, 10, 40], fov: 45 }}
                gl={{
                    antialias: true,
                    powerPreference: "high-performance",
                    alpha: false,
                    stencil: false,
                    depth: true,
                }}
                dpr={[1, 2]}
                onCreated={({ gl }) => {
                    // Initialize performance manager with renderer
                    PerformanceManager.getInstance().setRenderer(gl);
                }}
            >
                {/* Minimal ambient lighting - Sun provides main lighting */}
                <ambientLight intensity={ambientLightIntensity * brightness} />

                {/* Background stars */}
                {showStars && (
                    <Stars
                        radius={500}
                        depth={100}
                        count={20000}
                        factor={8}
                        saturation={0}
                        fade={true}
                    />
                )}

                {/* Camera controls - disabled when rocket is active */}
                {!showRocket && (
                    <OrbitControls
                        ref={controlsRef}
                        enablePan={true}
                        enableZoom={true}
                        enableRotate={true}
                        minDistance={5}
                        maxDistance={200}
                        enableDamping={true}
                        dampingFactor={0.05}
                    />
                )}

                {/* Rocket for exploration */}
                {showRocket && (
                    <Rocket
                        isActive={true}
                        isHoverMode={rocketMode === "hover"}
                        onPositionChange={onRocketPositionChange}
                    />
                )}

                {/* Solar System */}
                <Suspense fallback={null}>
                    <SolarSystem
                        showOrbitLines={showOrbitLines}
                        isNightTexture={isNightTexture}
                        showClouds={showClouds}
                        brightness={brightness}
                        borderThickness={borderThickness}
                        showBorders={showBorders}
                        earthQuality={earthQuality}
                        borderOnlyMode={borderOnlyMode}
                        borderColor={borderColor}
                        sunIntensity={sunIntensity}
                        onPlanetClick={onPlanetClick}
                        onCameraTarget={handleCameraTarget}
                    />
                </Suspense>
            </Canvas>
        </div>
    );
});
