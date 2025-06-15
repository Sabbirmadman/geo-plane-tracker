import { forwardRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface RocketThrusterProps {
    position?: [number, number, number];
    rotation?: [number, number, number];
    size?: number;
    intensity?: number;
    color?: string;
}

export const RocketThruster = forwardRef<THREE.Group, RocketThrusterProps>(
    (
        {
            position = [0, 0, 0],
            rotation = [0, 0, 0],
            size = 0.3,
            intensity = 1.0,
            color = "#00aaff",
        },
        ref
    ) => {
        // Create flame geometry
        const flameGeometry = useMemo(() => {
            const geometry = new THREE.ConeGeometry(size, size * 2, 8);
            return geometry;
        }, [size]);

        // Create flame material with transparency and glow
        const flameMaterial = useMemo(() => {
            return new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0 },
                    color: { value: new THREE.Color(color) },
                    intensity: { value: intensity },
                },
                vertexShader: `
                    varying vec2 vUv;
                    varying float vDistanceToCenter;
                    uniform float time;
                    
                    void main() {
                        vUv = uv;
                        
                        // Add some flame flicker
                        vec3 pos = position;
                        pos.x += sin(time * 10.0 + position.y * 5.0) * 0.1;
                        pos.z += cos(time * 8.0 + position.y * 3.0) * 0.1;
                        
                        vDistanceToCenter = length(pos.xz);
                        
                        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                        gl_Position = projectionMatrix * mvPosition;
                    }
                `,
                fragmentShader: `
                    uniform vec3 color;
                    uniform float intensity;
                    uniform float time;
                    varying vec2 vUv;
                    varying float vDistanceToCenter;
                    
                    void main() {
                        // Create flame effect
                        float flame = 1.0 - vUv.y;
                        flame *= 1.0 - vDistanceToCenter * 2.0;
                        flame = max(0.0, flame);
                        
                        // Add flicker
                        flame *= (0.8 + 0.4 * sin(time * 15.0));
                        
                        // Color gradient from hot to cool
                        vec3 flameColor = mix(
                            vec3(1.0, 0.3, 0.0), // Hot orange/red
                            color,               // Cool blue
                            vUv.y * 0.7
                        );
                        
                        float alpha = flame * intensity;
                        gl_FragColor = vec4(flameColor, alpha);
                    }
                `,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            });
        }, [color, intensity]);

        // Animate the flame
        useFrame(({ clock }) => {
            if (flameMaterial.uniforms) {
                flameMaterial.uniforms.time.value = clock.elapsedTime;
            }
        });

        return (
            <group
                ref={ref}
                position={position}
                rotation={rotation}
                visible={false}
            >
                {/* Main flame */}
                <mesh geometry={flameGeometry} material={flameMaterial} />

                {/* Inner core (brighter) */}
                <mesh scale={[0.5, 0.7, 0.5]}>
                    <coneGeometry args={[size, size * 2, 6]} />
                    <meshBasicMaterial
                        color="#ffffff"
                        transparent
                        opacity={0.8}
                        blending={THREE.AdditiveBlending}
                    />
                </mesh>

                {/* Point light for illumination */}
                <pointLight
                    color={color}
                    intensity={intensity * 2}
                    distance={5}
                    decay={2}
                />
            </group>
        );
    }
);

RocketThruster.displayName = "RocketThruster";
