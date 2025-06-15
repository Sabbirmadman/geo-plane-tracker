import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ParticleSystemProps {
    position?: [number, number, number];
    rotation?: [number, number, number];
    isActive?: boolean;
    intensity?: number;
    color?: string;
    particleCount?: number;
    size?: number;
}

export function EngineParticles({
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    isActive = false,
    intensity = 1.0,
    particleCount = 1000,
    size = 0.5,
}: ParticleSystemProps) {
    const particlesRef = useRef<THREE.Points>(null);
    const velocitiesRef = useRef<Float32Array>();
    const lifetimesRef = useRef<Float32Array>();

    const { geometry, material } = useMemo(() => {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        const velocities = new Float32Array(particleCount * 3);
        const lifetimes = new Float32Array(particleCount);

        // Initialize particles
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;

            // Start at emission point
            positions[i3] = 0;
            positions[i3 + 1] = 0;
            positions[i3 + 2] = 0;

            // Random velocity
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 0.2;
            velocities[i3] = Math.cos(angle) * radius;
            velocities[i3 + 1] = Math.sin(angle) * radius;
            velocities[i3 + 2] = -Math.random() * 3 - 1; // Exhaust direction

            // Color (hot to cool gradient)
            const heat = Math.random();
            colors[i3] = 1.0; // Red
            colors[i3 + 1] = heat * 0.5; // Green
            colors[i3 + 2] = heat * 0.2; // Blue

            sizes[i] = Math.random() * 0.1 + 0.05;
            lifetimes[i] = Math.random() * 2 + 0.5;
        }

        geometry.setAttribute(
            "position",
            new THREE.BufferAttribute(positions, 3)
        );
        geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

        velocitiesRef.current = velocities;
        lifetimesRef.current = lifetimes;

        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                size: { value: size },
                opacity: { value: intensity },
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                varying float vOpacity;
                uniform float time;
                
                void main() {
                    vColor = color;
                    vOpacity = 1.0 - (time - float(gl_VertexID) * 0.01);
                    
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                varying float vOpacity;
                uniform float opacity;
                
                void main() {
                    float distance = length(gl_PointCoord - vec2(0.5));
                    if (distance > 0.5) discard;
                    
                    float alpha = (1.0 - distance * 2.0) * vOpacity * opacity;
                    gl_FragColor = vec4(vColor, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            vertexColors: true,
        }) as THREE.ShaderMaterial & {
            uniforms: {
                time: { value: number };
                size: { value: number };
                opacity: { value: number };
            };
        };

        return { geometry, material };
    }, [particleCount, size, intensity]);

    useFrame(({ clock }) => {
        if (!particlesRef.current || !isActive) return;

        const positions = geometry.attributes.position.array as Float32Array;
        const velocities = velocitiesRef.current!;
        const lifetimes = lifetimesRef.current!;
        const delta = clock.getDelta();

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;

            // Update position
            positions[i3] += velocities[i3] * delta;
            positions[i3 + 1] += velocities[i3 + 1] * delta;
            positions[i3 + 2] += velocities[i3 + 2] * delta;

            // Update lifetime
            lifetimes[i] -= delta;

            // Reset particle if dead
            if (lifetimes[i] <= 0 || positions[i3 + 2] < -5) {
                positions[i3] = (Math.random() - 0.5) * 0.1;
                positions[i3 + 1] = (Math.random() - 0.5) * 0.1;
                positions[i3 + 2] = 0;

                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * 0.2;
                velocities[i3] = Math.cos(angle) * radius;
                velocities[i3 + 1] = Math.sin(angle) * radius;
                velocities[i3 + 2] = -Math.random() * 3 - 1;

                lifetimes[i] = Math.random() * 2 + 0.5;
            }

            // Add gravity and expansion
            velocities[i3 + 2] -= delta * 0.5; // Gravity
            velocities[i3] *= 1.01; // Expansion
            velocities[i3 + 1] *= 1.01;
        }

        geometry.attributes.position.needsUpdate = true;
        material.uniforms.time.value = clock.elapsedTime;
    });

    return (
        <points
            ref={particlesRef}
            position={position}
            rotation={rotation}
            geometry={geometry}
            material={material}
            visible={isActive}
        />
    );
}

export function SmokeTrail({
    position = [0, 0, 0],
    isActive = false,
    intensity = 0.5,
    particleCount = 500,
}: ParticleSystemProps) {
    const particlesRef = useRef<THREE.Points>(null);
    const velocitiesRef = useRef<Float32Array>();
    const lifetimesRef = useRef<Float32Array>();

    const { geometry, material } = useMemo(() => {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        const velocities = new Float32Array(particleCount * 3);
        const lifetimes = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;

            positions[i3] = 0;
            positions[i3 + 1] = 0;
            positions[i3 + 2] = 0;

            velocities[i3] = (Math.random() - 0.5) * 0.5;
            velocities[i3 + 1] = (Math.random() - 0.5) * 0.5;
            velocities[i3 + 2] = -Math.random() * 1 - 0.5;

            // Gray smoke color
            const gray = Math.random() * 0.3 + 0.2;
            colors[i3] = gray;
            colors[i3 + 1] = gray;
            colors[i3 + 2] = gray;

            sizes[i] = Math.random() * 0.2 + 0.1;
            lifetimes[i] = Math.random() * 3 + 1;
        }

        geometry.setAttribute(
            "position",
            new THREE.BufferAttribute(positions, 3)
        );
        geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

        velocitiesRef.current = velocities;
        lifetimesRef.current = lifetimes;

        const material = new THREE.PointsMaterial({
            size: 0.2,
            transparent: true,
            opacity: intensity,
            vertexColors: true,
            blending: THREE.NormalBlending,
        });

        return { geometry, material };
    }, [particleCount, intensity]);

    useFrame(({ clock }) => {
        if (!particlesRef.current || !isActive) return;

        const positions = geometry.attributes.position.array as Float32Array;
        const velocities = velocitiesRef.current!;
        const lifetimes = lifetimesRef.current!;
        const delta = clock.getDelta();

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;

            positions[i3] += velocities[i3] * delta;
            positions[i3 + 1] += velocities[i3 + 1] * delta;
            positions[i3 + 2] += velocities[i3 + 2] * delta;

            lifetimes[i] -= delta;

            if (lifetimes[i] <= 0) {
                positions[i3] = (Math.random() - 0.5) * 0.2;
                positions[i3 + 1] = (Math.random() - 0.5) * 0.2;
                positions[i3 + 2] = 0;

                velocities[i3] = (Math.random() - 0.5) * 0.5;
                velocities[i3 + 1] = (Math.random() - 0.5) * 0.5;
                velocities[i3 + 2] = -Math.random() * 1 - 0.5;

                lifetimes[i] = Math.random() * 3 + 1;
            }

            // Wind effect
            velocities[i3] += (Math.random() - 0.5) * 0.01;
            velocities[i3 + 1] += (Math.random() - 0.5) * 0.01;
        }

        geometry.attributes.position.needsUpdate = true;
    });

    return (
        <points
            ref={particlesRef}
            position={position}
            geometry={geometry}
            material={material}
            visible={isActive}
        />
    );
}
