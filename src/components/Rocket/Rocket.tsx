import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
    SmallEngine,
    MediumEngine,
    SmallEngineNozzle,
    MediumEngineNozzle,
    SmallFuelTank,
    LargeFuelTank,
    ControlModule,
    Connector,
    NoseCone,
    COMPONENT_STATS,
} from "./RocketComponents";
import { EngineParticles, SmokeTrail } from "./ParticleEffects";

export interface RocketComponent {
    id: string;
    type: string;
    position: [number, number, number];
    rotation: [number, number, number];
    color: string;
    scale: number;
    isActive?: boolean; // For engine nozzles
}

interface RocketProps {
    position?: [number, number, number];
    scale?: number;
    isActive?: boolean;
    isHoverMode?: boolean;
    onPositionChange?: (position: [number, number, number]) => void;
    components?: RocketComponent[];
    selectedComponentId?: string | null;
    onComponentSelect?: (id: string) => void;
    onComponentUpdate?: (id: string, updates: Partial<RocketComponent>) => void;
}

export function Rocket({
    position = [35, 5, 0],
    scale = 0.1,
    isActive = false,
    isHoverMode = false,
    onPositionChange,
    components = [
        {
            id: "nosecone",
            type: "NoseCone",
            position: [0, 0, -2],
            rotation: [0, 0, 0],
            color: "#cccccc",
            scale: 1,
        },
        {
            id: "fueltank1",
            type: "LargeFuelTank",
            position: [0, 0, -0.5],
            rotation: [0, 0, 0],
            color: "#ff6600",
            scale: 1,
        },
        {
            id: "control",
            type: "ControlModule",
            position: [0, 0, 1],
            rotation: [0, 0, 0],
            color: "#0066cc",
            scale: 1,
        },
        {
            id: "connector",
            type: "Connector",
            position: [0, 0, 1.8],
            rotation: [0, 0, 0],
            color: "#888888",
            scale: 1,
        },
        {
            id: "engine",
            type: "MediumEngine",
            position: [0, 0, 2.2],
            rotation: [0, 0, 0],
            color: "#444444",
            scale: 1,
        },
        {
            id: "nozzle",
            type: "MediumEngineNozzle",
            position: [0, 0, 2.8],
            rotation: [0, 0, 0],
            color: "#ff6600",
            scale: 1,
        },
    ],
    selectedComponentId = null,
    onComponentSelect,
}: RocketProps) {
    const rocketRef = useRef<THREE.Group>(null!);
    const velocityRef = useRef(new THREE.Vector3(0, 0, 0));
    const angularVelocityRef = useRef(new THREE.Vector3(0, 0, 0));
    const { camera } = useThree();

    // Rocket controls state
    const controlsRef = useRef({
        forward: false,
        backward: false,
        left: false,
        right: false,
        up: false,
        down: false,
        pitchUp: false,
        pitchDown: false,
        yawLeft: false,
        yawRight: false,
        rollLeft: false,
        rollRight: false,
    });

    // Calculate rocket stats from components
    const rocketStats = components.reduce(
        (stats, component) => {
            const componentStats = COMPONENT_STATS[component.type];
            if (componentStats) {
                stats.totalMass += componentStats.mass;
                stats.totalThrust += componentStats.thrust || 0;
                stats.totalFuel += componentStats.fuelCapacity || 0;
                stats.controlAuthority += componentStats.controlAuthority || 0;
            }
            return stats;
        },
        { totalMass: 0, totalThrust: 0, totalFuel: 0, controlAuthority: 0 }
    );

    // Physics constants based on rocket configuration
    const THRUST_FORCE =
        (rocketStats.totalThrust / rocketStats.totalMass) *
        (isHoverMode ? 0.01 : 0.02);
    const ROTATION_FORCE = rocketStats.controlAuthority * 0.005;
    const DAMPING = isHoverMode ? 0.95 : 0.98;
    const ANGULAR_DAMPING = 0.9;

    // Initialize position
    useEffect(() => {
        if (rocketRef.current) {
            rocketRef.current.position.set(...position);
        }
    }, [position]);

    // Keyboard controls
    useEffect(() => {
        if (!isActive) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            const controls = controlsRef.current;
            switch (event.code) {
                case "KeyW":
                    controls.forward = true;
                    break;
                case "KeyS":
                    controls.backward = true;
                    break;
                case "KeyA":
                    controls.left = true;
                    break;
                case "KeyD":
                    controls.right = true;
                    break;
                case "Space":
                    controls.up = true;
                    event.preventDefault();
                    break;
                case "ShiftLeft":
                    controls.down = true;
                    break;
                case "ArrowUp":
                    controls.pitchUp = true;
                    break;
                case "ArrowDown":
                    controls.pitchDown = true;
                    break;
                case "ArrowLeft":
                    controls.yawLeft = true;
                    break;
                case "ArrowRight":
                    controls.yawRight = true;
                    break;
                case "KeyQ":
                    controls.rollLeft = true;
                    break;
                case "KeyE":
                    controls.rollRight = true;
                    break;
            }
        };

        const handleKeyUp = (event: KeyboardEvent) => {
            const controls = controlsRef.current;
            switch (event.code) {
                case "KeyW":
                    controls.forward = false;
                    break;
                case "KeyS":
                    controls.backward = false;
                    break;
                case "KeyA":
                    controls.left = false;
                    break;
                case "KeyD":
                    controls.right = false;
                    break;
                case "Space":
                    controls.up = false;
                    break;
                case "ShiftLeft":
                    controls.down = false;
                    break;
                case "ArrowUp":
                    controls.pitchUp = false;
                    break;
                case "ArrowDown":
                    controls.pitchDown = false;
                    break;
                case "ArrowLeft":
                    controls.yawLeft = false;
                    break;
                case "ArrowRight":
                    controls.yawRight = false;
                    break;
                case "KeyQ":
                    controls.rollLeft = false;
                    break;
                case "KeyE":
                    controls.rollRight = false;
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, [isActive]);

    // Physics and movement
    useFrame(() => {
        if (!rocketRef.current || !isActive) return;

        const rocket = rocketRef.current;
        const controls = controlsRef.current;
        const velocity = velocityRef.current;
        const angularVelocity = angularVelocityRef.current;

        // Local force vector (relative to rocket orientation)
        const localForce = new THREE.Vector3(0, 0, 0);
        const torque = new THREE.Vector3(0, 0, 0);

        // Translation forces
        if (controls.forward) localForce.z -= THRUST_FORCE;
        if (controls.backward) localForce.z += THRUST_FORCE;
        if (controls.left) localForce.x -= THRUST_FORCE;
        if (controls.right) localForce.x += THRUST_FORCE;
        if (controls.up) localForce.y += THRUST_FORCE;
        if (controls.down) localForce.y -= THRUST_FORCE;

        // Rotation forces
        if (controls.pitchUp) torque.x += ROTATION_FORCE;
        if (controls.pitchDown) torque.x -= ROTATION_FORCE;
        if (controls.yawLeft) torque.y += ROTATION_FORCE;
        if (controls.yawRight) torque.y -= ROTATION_FORCE;
        if (controls.rollLeft) torque.z += ROTATION_FORCE;
        if (controls.rollRight) torque.z -= ROTATION_FORCE;

        // Convert local force to world space
        const worldForce = localForce
            .clone()
            .applyQuaternion(rocket.quaternion);

        // Apply forces
        velocity.add(worldForce);
        angularVelocity.add(torque);

        // Apply damping
        velocity.multiplyScalar(DAMPING);
        angularVelocity.multiplyScalar(ANGULAR_DAMPING);

        // Update position
        rocket.position.add(velocity);

        // Update rotation
        const quaternion = new THREE.Quaternion();
        quaternion.setFromAxisAngle(
            new THREE.Vector3(1, 0, 0),
            angularVelocity.x
        );
        rocket.quaternion.multiplyQuaternions(quaternion, rocket.quaternion);

        quaternion.setFromAxisAngle(
            new THREE.Vector3(0, 1, 0),
            angularVelocity.y
        );
        rocket.quaternion.multiplyQuaternions(quaternion, rocket.quaternion);

        quaternion.setFromAxisAngle(
            new THREE.Vector3(0, 0, 1),
            angularVelocity.z
        );
        rocket.quaternion.multiplyQuaternions(quaternion, rocket.quaternion);

        // Update camera to follow rocket
        const offset = new THREE.Vector3(0, 2, 5).applyQuaternion(
            rocket.quaternion
        );
        camera.position.copy(rocket.position).add(offset);
        camera.lookAt(rocket.position);

        // Report position changes
        onPositionChange?.([
            rocket.position.x,
            rocket.position.y,
            rocket.position.z,
        ]);
    });

    const renderComponent = (component: RocketComponent) => {
        const ComponentType = {
            SmallEngine,
            MediumEngine,
            SmallEngineNozzle,
            MediumEngineNozzle,
            SmallFuelTank,
            LargeFuelTank,
            ControlModule,
            Connector,
            NoseCone,
        }[component.type] as React.ComponentType<{
            position: [number, number, number];
            rotation: [number, number, number];
            color: string;
            scale: number;
            selected?: boolean;
            isActive?: boolean;
            onClick?: () => void;
        }>;

        if (!ComponentType) return null;

        const isSelected = selectedComponentId === component.id;

        return (
            <group key={component.id}>
                <ComponentType
                    position={component.position}
                    rotation={component.rotation}
                    color={component.color}
                    scale={component.scale}
                    selected={isSelected}
                    isActive={component.isActive || false}
                    onClick={() => {
                        if (!isActive) {
                            // Only select component in editor mode, don't activate nozzles
                            onComponentSelect?.(component.id);
                        }
                    }}
                />

                {/* Selection outline */}
                {isSelected && !isActive && (
                    <mesh position={component.position}>
                        <sphereGeometry args={[0.6, 8, 6]} />
                        <meshBasicMaterial
                            color="#00ff00"
                            wireframe
                            transparent
                            opacity={0.3}
                        />
                    </mesh>
                )}

                {/* Particle effects for active engine nozzles */}
                {component.type.includes("EngineNozzle") &&
                    component.isActive && (
                        <>
                            <EngineParticles
                                position={[
                                    component.position[0],
                                    component.position[1],
                                    component.position[2] + 0.5,
                                ]}
                                rotation={component.rotation}
                                isActive={true}
                                intensity={1.2}
                                color="#ff6600"
                                particleCount={600}
                                size={0.3}
                            />
                            <SmokeTrail
                                position={[
                                    component.position[0],
                                    component.position[1],
                                    component.position[2] + 0.3,
                                ]}
                                isActive={true}
                                intensity={0.8}
                                particleCount={300}
                            />
                        </>
                    )}
            </group>
        );
    };

    const getActiveEnginePositions = (): [number, number, number][] => {
        return components
            .filter((c) => c.type.includes("EngineNozzle") && c.isActive)
            .map((c) => c.position);
    };

    return (
        <group ref={rocketRef} scale={scale} position={position}>
            {/* Render all rocket components */}
            {components.map(renderComponent)}

            {/* Additional particle effects during flight */}
            {isActive &&
                controlsRef.current.forward &&
                getActiveEnginePositions().map((pos, index) => (
                    <group key={`flight-particles-${index}`}>
                        <EngineParticles
                            position={[pos[0], pos[1], pos[2] + 0.6]}
                            isActive={true}
                            intensity={1.5}
                            color="#0099ff"
                            particleCount={800}
                            size={0.4}
                        />
                        <SmokeTrail
                            position={[pos[0], pos[1], pos[2] + 0.4]}
                            isActive={true}
                            intensity={1.0}
                            particleCount={500}
                        />
                    </group>
                ))}

            {/* RCS thruster effects */}
            {controlsRef.current.left && (
                <EngineParticles
                    position={[-0.4, 0, 1]}
                    rotation={[0, 0, Math.PI / 2]}
                    isActive={true}
                    intensity={0.5}
                    color="#00aaff"
                    particleCount={200}
                    size={0.2}
                />
            )}

            {controlsRef.current.right && (
                <EngineParticles
                    position={[0.4, 0, 1]}
                    rotation={[0, 0, -Math.PI / 2]}
                    isActive={true}
                    intensity={0.5}
                    color="#00aaff"
                    particleCount={200}
                    size={0.2}
                />
            )}

            {/* Lighting effects */}
            <pointLight
                position={[0, 0, -1]}
                intensity={0.5}
                color="#ffffff"
                distance={10}
            />
            {getActiveEnginePositions().length > 0 && (
                <pointLight
                    position={getActiveEnginePositions()[0]}
                    intensity={controlsRef.current.forward ? 2 : 0.3}
                    color="#ff6600"
                    distance={8}
                />
            )}
        </group>
    );
}
