import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { Suspense, memo } from "react";
import { Earth } from "../Earth/Earth";

interface SceneProps {
    isNightTexture?: boolean;
    showClouds?: boolean;
    showStars?: boolean;
    brightness?: number;
    ambientLightIntensity?: number;
    directionalLightIntensity?: number;
    isRotating?: boolean;
    borderThickness?: number;
    showBorders?: boolean;
    earthQuality?: number;
}

export const Scene = memo(function Scene({
    isNightTexture = false,
    showClouds = true,
    showStars = true,
    brightness = 1,
    ambientLightIntensity = 0.2,
    directionalLightIntensity = 1,
    isRotating = false,
    borderThickness = 1.5,
    showBorders = true,
    earthQuality = 64,
}: SceneProps) {
    return (
        <div className="w-full h-screen">
            <Canvas
                camera={{ position: [0, 0, 8], fov: 45 }}
                gl={{
                    antialias: true,
                    powerPreference: "high-performance",
                    alpha: false,
                    stencil: false,
                    depth: true,
                }}
                dpr={[1, 2]} // Limit pixel ratio for performance
            >
                {/* Lighting */}
                <ambientLight intensity={ambientLightIntensity * brightness} />
                <directionalLight
                    position={[5, 3, 5]}
                    intensity={directionalLightIntensity * brightness}
                    castShadow
                    shadow-mapSize-width={1024}
                    shadow-mapSize-height={1024}
                />

                {/* Background stars */}
                {showStars && (
                    <Stars
                        radius={300}
                        depth={60}
                        count={15000} // Reduced for performance
                        factor={6}
                        saturation={0}
                        fade={true}
                    />
                )}

                {/* Camera controls */}
                <OrbitControls
                    enablePan={true}
                    enableZoom={true}
                    enableRotate={true}
                    minDistance={3}
                    maxDistance={20}
                    enableDamping={true}
                    dampingFactor={0.05}
                />

                {/* Earth */}
                <Suspense fallback={null}>
                    <Earth
                        isNightTexture={isNightTexture}
                        showClouds={showClouds}
                        showCountryBorders={showBorders}
                        brightness={brightness}
                        isRotating={isRotating}
                        borderThickness={borderThickness}
                        quality={earthQuality}
                    />
                </Suspense>
            </Canvas>
        </div>
    );
});
