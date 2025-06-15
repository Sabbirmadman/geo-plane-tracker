import { useRef, useMemo } from "react";
import { useLoader, useFrame, ThreeEvent } from "@react-three/fiber";
import { TextureLoader } from "three";
import * as THREE from "three";
import { TextureManager } from "../../utils/textureManager";

interface SunProps {
    position?: [number, number, number];
    scale?: number;
    radius?: number;
    texture?: string;
    intensity?: number;
    quality?: number;
    onSunClick?: (position: [number, number, number]) => void;
}

export function Sun({
    position = [0, 0, 0],
    scale = 1,
    radius = 5,
    texture,
    intensity = 2,
    quality = 64,
    onSunClick,
}: SunProps) {
    const sunRef = useRef<THREE.Mesh>(null!);
    const groupRef = useRef<THREE.Group>(null!);
    const lightRef = useRef<THREE.DirectionalLight>(null!);

    // Use TextureManager for sun texture
    const sunConfig = TextureManager.createPlanetConfig("sun");
    const textureToLoad =
        texture || sunConfig.emissive || TextureManager.DEFAULT_TEXTURE;
    const [sunTexture] = useLoader(TextureLoader, [textureToLoad]);

    // Sun geometry
    const sunGeometry = useMemo(() => {
        return new THREE.SphereGeometry(radius, quality, quality);
    }, [radius, quality]);

    // Sun material with emissive properties
    const sunMaterial = useMemo(() => {
        const materialProps: THREE.MeshStandardMaterialParameters = {
            emissive: new THREE.Color(0xffaa00),
            emissiveIntensity: 0.8,
            color: new THREE.Color(0xffdd44),
        };

        if (sunTexture) {
            materialProps.map = sunTexture;
            materialProps.emissiveMap = sunTexture;
        }

        return new THREE.MeshStandardMaterial(materialProps);
    }, [sunTexture]);

    // Rotate sun slowly
    useFrame(() => {
        if (sunRef.current) {
            sunRef.current.rotation.y += 0.001; // Very slow rotation (25 days)
        }
    });

    const handleSunClick = (event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        const worldPosition = new THREE.Vector3();
        groupRef.current.getWorldPosition(worldPosition);
        const pos: [number, number, number] = [
            worldPosition.x,
            worldPosition.y,
            worldPosition.z,
        ];
        onSunClick?.(pos);
    };

    return (
        <group ref={groupRef} position={position} scale={scale}>
            {/* Directional light from sun position */}
            <directionalLight
                ref={lightRef}
                position={[0, 0, 0]}
                intensity={intensity}
                color={0xffddaa}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
                shadow-camera-near={0.1}
                shadow-camera-far={100}
                shadow-camera-left={-20}
                shadow-camera-right={20}
                shadow-camera-top={20}
                shadow-camera-bottom={-20}
            />

            {/* Point light for additional illumination */}
            <pointLight
                position={[0, 0, 0]}
                intensity={intensity * 0.5}
                color={0xffddaa}
                distance={100}
                decay={2}
            />

            {/* Sun mesh */}
            <mesh
                ref={sunRef}
                geometry={sunGeometry}
                material={sunMaterial}
                onClick={handleSunClick}
            />

            {/* Sun corona effect */}
            <mesh
                geometry={new THREE.SphereGeometry(radius * 1.05, 32, 32)}
                material={
                    new THREE.MeshBasicMaterial({
                        color: 0xffaa00,
                        transparent: true,
                        opacity: 0.1,
                        side: THREE.BackSide,
                    })
                }
            />
        </group>
    );
}
