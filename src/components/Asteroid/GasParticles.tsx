import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface GasParticlesProps {
    innerRadius: number;
    outerRadius: number;
    particleCount?: number;
    orbitSpeed?: number;
    color?: string;
    opacity?: number;
    size?: number;
    visible?: boolean;
}

export function GasParticles({
    innerRadius,
    outerRadius,
    particleCount = 2000,
    orbitSpeed = 0.0001,
    color = "#ffd700",
    opacity = 0.3,
    size = 0.1,
    visible = true,
}: GasParticlesProps) {
    const pointsRef = useRef<THREE.Points>(null!);
    const groupRef = useRef<THREE.Group>(null!);

    // Generate particle positions
    const { positions, colors, sizes } = useMemo(() => {
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        const baseColor = new THREE.Color(color);

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;

            // Random position in ring
            const angle = Math.random() * Math.PI * 2;
            const radius =
                innerRadius + Math.random() * (outerRadius - innerRadius);
            const radiusVariation = 0.8 + Math.random() * 0.4; // Add some variation

            const x = Math.cos(angle) * radius * radiusVariation;
            const z = Math.sin(angle) * radius * radiusVariation;
            const y = (Math.random() - 0.5) * 0.3; // Small vertical spread

            positions[i3] = x;
            positions[i3 + 1] = y;
            positions[i3 + 2] = z;

            // Vary particle colors slightly
            const colorVariation = 0.8 + Math.random() * 0.4;
            colors[i3] = baseColor.r * colorVariation;
            colors[i3 + 1] = baseColor.g * colorVariation;
            colors[i3 + 2] = baseColor.b * colorVariation;

            // Vary particle sizes
            sizes[i] = size * (0.5 + Math.random() * 1.5);
        }

        return { positions, colors, sizes };
    }, [innerRadius, outerRadius, particleCount, color, size]);

    // Create geometry and material
    const geometry = useMemo(() => {
        const geom = new THREE.BufferGeometry();
        geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));
        geom.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
        return geom;
    }, [positions, colors, sizes]);

    const material = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                opacity: { value: opacity },
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                varying float vOpacity;
                
                void main() {
                    vColor = color;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                    
                    // Fade based on distance from camera
                    float dist = length(mvPosition.xyz);
                    vOpacity = 1.0 / (1.0 + dist * 0.01);
                }
            `,
            fragmentShader: `
                uniform float opacity;
                varying vec3 vColor;
                varying float vOpacity;
                
                void main() {
                    // Create circular particles
                    float dist = length(gl_PointCoord - vec2(0.5));
                    if (dist > 0.5) discard;
                    
                    // Soft edges
                    float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
                    alpha *= opacity * vOpacity;
                    
                    gl_FragColor = vec4(vColor, alpha);
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            vertexColors: true,
        });
    }, [opacity]);

    // Animate particles
    useFrame(() => {
        if (groupRef.current && visible) {
            groupRef.current.rotation.y += orbitSpeed * 0.5; // Slower than asteroids
        }
    });

    if (!visible) return null;

    return (
        <group ref={groupRef}>
            <points ref={pointsRef} geometry={geometry} material={material} />
        </group>
    );
}
