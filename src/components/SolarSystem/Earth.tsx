import { Planet, MoonData } from "../Planet/Planet";
import { TextureManager } from "../../utils/textureManager";

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
    borderColor?: string;
    onPlanetClick?: (position: [number, number, number]) => void;
    onCameraTarget?: (position: [number, number, number]) => void;
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
    borderColor = "#00ff88",
    onPlanetClick,
    onCameraTarget,
}: EarthProps) {
    const earthConfig = TextureManager.createPlanetConfig("earth");

    const earthMoon: MoonData = {
        name: "Moon",
        texture: TextureManager.getPlanetTexture("moon", "day"),
        radius: 0.27,
        distance: 8,
        orbitSpeed: 0.0004,
        color: "#cccccc",
    };

    return (
        <Planet
            position={position}
            scale={scale}
            radius={2}
            texture={isNightTexture ? earthConfig.night : earthConfig.day}
            nightTexture={earthConfig.night}
            cloudTexture={showClouds ? earthConfig.clouds : undefined}
            bumpTexture={earthConfig.bump}
            normalTexture={earthConfig.normal}
            showClouds={showClouds}
            showBorders={showCountryBorders}
            brightness={brightness}
            borderThickness={borderThickness}
            quality={quality}
            borderOnlyMode={borderOnlyMode}
            borderColor={borderColor}
            moons={[earthMoon]}
            name="Earth"
            rotationSpeed={0.0007}
            onPlanetClick={onPlanetClick}
            onCameraTarget={onCameraTarget}
        />
    );
}
