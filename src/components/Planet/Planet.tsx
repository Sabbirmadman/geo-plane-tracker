import { useRef, useMemo, useCallback } from "react";
import { useLoader, useFrame, ThreeEvent } from "@react-three/fiber";
import { TextureLoader } from "three";
import * as THREE from "three";
import { CountryBorders } from "../CountryBorders/CountryBorders";
import { PlanetRings } from "./PlanetRings";
import { Moon } from "./Moon";
import { TextureManager } from "../../utils/textureManager";
import { GeometryManager } from "../../utils/geometryManager";
import { PerformanceManager } from "../../utils/performanceManager";

export interface MoonData {
    name: string;
    texture?: string;
    radius: number;
    distance: number;
    orbitSpeed: number;
    color?: string;
    emissive?: boolean;
}

export interface RingData {
    innerRadius: number;
    outerRadius: number;
    texture?: string;
    color?: string;
    opacity?: number;
}

interface PlanetProps {
    position?: [number, number, number];
    scale?: number;
    radius?: number;
    texture?: string;
    nightTexture?: string;
    cloudTexture?: string;
    bumpTexture?: string;
    normalTexture?: string;
    emissiveTexture?: string;
    showClouds?: boolean;
    showBorders?: boolean;
    brightness?: number;
    borderThickness?: number;
    quality?: number;
    borderOnlyMode?: boolean;
    borderColor?: string;
    color?: string;
    emissive?: boolean;
    emissiveIntensity?: number;
    rings?: RingData;
    moons?: MoonData[];
    rotationSpeed?: number;
    name?: string;
    onPlanetClick?: (position: [number, number, number]) => void;
    onCameraTarget?: (position: [number, number, number]) => void;
}

export function Planet({
    position = [0, 0, 0],
    scale = 1,
    radius = 2,
    texture,
    nightTexture,
    cloudTexture,
    bumpTexture,
    normalTexture,
    emissiveTexture,
    showClouds = false,
    showBorders = false,
    brightness = 1,
    borderThickness = 1.5,
    quality = 64,
    borderOnlyMode = false,
    borderColor = "#00ff88",
    color = "#ffffff",
    emissive = false,
    emissiveIntensity = 0.5,
    rings,
    moons = [],
    rotationSpeed = 0,
    name = "Planet",
    onPlanetClick,
    onCameraTarget,
}: PlanetProps) {
    const planetRef = useRef<THREE.Mesh>(null!);
    const cloudsRef = useRef<THREE.Mesh>(null!);
    const groupRef = useRef<THREE.Group>(null!);
    const lastDistance = useRef<number>(0);

    // Calculate distance-based quality
    const adaptiveQuality = useMemo(() => {
        const performanceManager = PerformanceManager.getInstance();
        const recommendation = performanceManager.getQualityRecommendation();

        let baseQuality = quality;
        if (recommendation === "low") baseQuality = Math.max(16, quality / 4);
        else if (recommendation === "medium")
            baseQuality = Math.max(32, quality / 2);

        return baseQuality;
    }, [quality]);

    // Create a stable array of texture URLs to load
    const textureUrls = useMemo(() => {
        const urls: string[] = [];
        const urlMap = new Map<number, string>();

        let index = 0;
        if (texture) {
            urlMap.set(index, "main");
            urls.push(texture);
            index++;
        }
        if (nightTexture) {
            urlMap.set(index, "night");
            urls.push(nightTexture);
            index++;
        }
        if (cloudTexture) {
            urlMap.set(index, "clouds");
            urls.push(cloudTexture);
            index++;
        }
        if (bumpTexture) {
            urlMap.set(index, "bump");
            urls.push(bumpTexture);
            index++;
        }
        if (normalTexture) {
            urlMap.set(index, "normal");
            urls.push(normalTexture);
            index++;
        }
        if (emissiveTexture) {
            urlMap.set(index, "emissive");
            urls.push(emissiveTexture);
            index++;
        }

        return { urls, urlMap };
    }, [
        texture,
        nightTexture,
        cloudTexture,
        bumpTexture,
        normalTexture,
        emissiveTexture,
    ]);

    // Always call useLoader with the same pattern - use TextureManager default
    const urlsToLoad =
        textureUrls.urls.length > 0
            ? textureUrls.urls
            : [TextureManager.DEFAULT_TEXTURE];
    const loadedTextures = useLoader(TextureLoader, urlsToLoad);

    // Map loaded textures back to their purposes
    const textureObjects = useMemo(() => {
        const result: { [key: string]: THREE.Texture | null } = {
            main: null,
            night: null,
            clouds: null,
            bump: null,
            normal: null,
            emissive: null,
        };

        if (textureUrls.urls.length === 0) {
            return result;
        }

        textureUrls.urlMap.forEach((type, index) => {
            if (loadedTextures[index]) {
                result[type] = loadedTextures[index];
            }
        });

        return result;
    }, [loadedTextures, textureUrls]);

    // Optimized geometry with LOD
    const planetGeometry = useMemo(() => {
        return GeometryManager.getSphereGeometry(radius, adaptiveQuality);
    }, [radius, adaptiveQuality]);

    // Optimized clouds geometry
    const cloudsGeometry = useMemo(() => {
        return GeometryManager.getSphereGeometry(
            radius * 1.01,
            Math.max(16, adaptiveQuality / 2)
        );
    }, [radius, adaptiveQuality]);

    // Memoized materials to prevent recreation
    const planetMaterial = useMemo(() => {
        if (borderOnlyMode) {
            return new THREE.MeshPhongMaterial({
                color: 0x404040,
                transparent: false,
                opacity: 1.0,
                shininess: 20,
            });
        }

        const materialProps: THREE.MeshPhongMaterialParameters = {
            color: color,
            shininess: 100,
        };

        if (textureObjects.main) {
            materialProps.map = textureObjects.main;
        }

        if (textureObjects.bump) {
            materialProps.bumpMap = textureObjects.bump;
            materialProps.bumpScale = 0.1;
        }

        if (textureObjects.normal) {
            materialProps.normalMap = textureObjects.normal;
            materialProps.normalScale = new THREE.Vector2(1, 1);
        }

        if (emissive) {
            materialProps.emissive = new THREE.Color(color);
            materialProps.emissiveIntensity = emissiveIntensity;

            if (textureObjects.emissive) {
                materialProps.emissiveMap = textureObjects.emissive;
            }
        }

        return new THREE.MeshPhongMaterial(materialProps);
    }, [borderOnlyMode, color, textureObjects, emissive, emissiveIntensity]);

    // Clouds material
    const cloudsMaterial = useMemo(() => {
        if (!textureObjects.clouds) return null;

        return new THREE.MeshPhongMaterial({
            map: textureObjects.clouds,
            transparent: true,
            opacity: 0.4 * brightness,
            depthWrite: false,
        });
    }, [textureObjects.clouds, brightness]);

    // Optimized frame update with distance-based LOD
    useFrame(({ camera }) => {
        if (groupRef.current && rotationSpeed > 0) {
            groupRef.current.rotation.y += rotationSpeed;
        }

        // Update performance manager
        PerformanceManager.getInstance().update();

        // Distance-based optimization
        if (planetRef.current && camera) {
            const distance = camera.position.distanceTo(
                planetRef.current.position
            );

            // Only update LOD if distance changed significantly
            if (Math.abs(distance - lastDistance.current) > 5) {
                lastDistance.current = distance;

                // Frustum culling for very distant objects
                if (distance > 500) {
                    groupRef.current.visible = false;
                } else {
                    groupRef.current.visible = true;
                }
            }
        }
    });

    // Optimized click handler
    const handlePlanetClick = useCallback(
        (event: ThreeEvent<MouseEvent>) => {
            event.stopPropagation();
            const worldPosition = new THREE.Vector3();
            groupRef.current.getWorldPosition(worldPosition);
            const pos: [number, number, number] = [
                worldPosition.x,
                worldPosition.y,
                worldPosition.z,
            ];

            onPlanetClick?.(pos);
            onCameraTarget?.(pos);
        },
        [onPlanetClick, onCameraTarget]
    );

    const handleMoonClick = (moonPosition: [number, number, number]) => {
        const planetWorldPos = new THREE.Vector3();
        groupRef.current.getWorldPosition(planetWorldPos);

        const worldMoonPos: [number, number, number] = [
            planetWorldPos.x + moonPosition[0],
            planetWorldPos.y + moonPosition[1],
            planetWorldPos.z + moonPosition[2],
        ];

        onCameraTarget?.(worldMoonPos);
    };

    return (
        <group ref={groupRef} position={position} scale={scale}>
            <mesh
                ref={planetRef}
                geometry={planetGeometry}
                material={planetMaterial}
                onClick={handlePlanetClick}
                frustumCulled={true}
            />

            {showClouds && cloudsMaterial && (
                <mesh
                    ref={cloudsRef}
                    geometry={cloudsGeometry}
                    material={cloudsMaterial}
                    onClick={handlePlanetClick}
                    frustumCulled={true}
                />
            )}

            {(showBorders || borderOnlyMode) && (
                <CountryBorders
                    visible={true}
                    opacity={borderOnlyMode ? 1.0 : 0.8 * brightness}
                    color={borderColor}
                    lineWidth={
                        borderOnlyMode ? borderThickness * 1.5 : borderThickness
                    }
                />
            )}

            {rings && (
                <PlanetRings
                    innerRadius={rings.innerRadius}
                    outerRadius={rings.outerRadius}
                    texture={rings.texture}
                    color={rings.color}
                    opacity={rings.opacity}
                    visible={true}
                />
            )}

            {moons.map((moon, index) => (
                <Moon
                    key={`${name}-moon-${index}`}
                    {...moon}
                    onMoonClick={handleMoonClick}
                />
            ))}
        </group>
    );
}
