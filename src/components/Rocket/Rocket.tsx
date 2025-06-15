import React, {
    useRef,
    useEffect,
    forwardRef,
    useImperativeHandle,
} from "react";
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
    enableCameraFollow?: boolean; // Add camera follow toggle
}

export interface RocketRef {
    getCurrentSpeed: () => number;
    getMaxSpeed: () => number;
    getSpeedLimit: () => number;
    resetMaxSpeed: () => void;
}

export const Rocket = forwardRef<RocketRef, RocketProps>(
    (
        {
            position = [175, 25, 0],
            scale = 0.5,
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
            enableCameraFollow = true, // Default to camera follow for rocket mode
        },
        ref
    ) => {
        const rocketRef = useRef<THREE.Group>(null!);
        const velocityRef = useRef(new THREE.Vector3(0, 0, 0));
        const angularVelocityRef = useRef(new THREE.Vector3(0, 0, 0));
        const speedRef = useRef(0); // Track current speed
        const maxSpeedRef = useRef(0); // Track maximum speed reached
        const mouseRef = useRef({ x: 0, y: 0 }); // Track mouse position
        const { camera, gl } = useThree();

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
                    stats.controlAuthority +=
                        componentStats.controlAuthority || 0;
                }
                return stats;
            },
            { totalMass: 0, totalThrust: 0, totalFuel: 0, controlAuthority: 0 }
        );

        // Physics constants based on rocket configuration - Increased speeds for galaxy scale
        const THRUST_FORCE =
            (rocketStats.totalThrust / rocketStats.totalMass) *
            (isHoverMode ? 0.01 : 0.05); // Increased from 0.001/0.01 to 0.01/0.05 (10x faster)
        const ROTATION_FORCE = rocketStats.controlAuthority * 0.002; // Increased from 0.0005 to 0.002
        const DAMPING = isHoverMode ? 0.095 : 0.098; // Reduced damping for more momentum
        const ANGULAR_DAMPING = 0.095; // Reduced from 0.098 to 0.095
        const MAX_SPEED = isHoverMode ? 15 : 50; // Increased from 2/5 to 15/50 (much faster)
        const MAX_ANGULAR_SPEED = 0.1; // Increased from 0.05 to 0.1

        // Expose speed data through imperative handlewww
        useImperativeHandle(
            ref,
            () => ({
                getCurrentSpeed: () => speedRef.current,
                getMaxSpeed: () => maxSpeedRef.current,
                getSpeedLimit: () => MAX_SPEED,
                resetMaxSpeed: () => {
                    maxSpeedRef.current = 0;
                },
            }),
            [MAX_SPEED]
        );

        // Initialize position
        useEffect(() => {
            if (rocketRef.current) {
                rocketRef.current.position.set(...position);
            }
        }, [position]);

        // Mouse look controls for rocket
        useEffect(() => {
            if (!isActive) return;

            let isPointerLocked = false;

            const handlePointerLockChange = () => {
                isPointerLocked = document.pointerLockElement === gl.domElement;
            };

            const handleMouseMove = (event: MouseEvent) => {
                if (!isPointerLocked || !rocketRef.current) return;

                const sensitivity = 0.002; // Mouse sensitivity
                const deltaX = event.movementX * sensitivity;
                const deltaY = event.movementY * sensitivity;

                // Apply mouse movement to rocket rotation
                const rocket = rocketRef.current;

                // Yaw (left/right) around Y axis
                const yawQuaternion = new THREE.Quaternion();
                yawQuaternion.setFromAxisAngle(
                    new THREE.Vector3(0, 1, 0),
                    -deltaX
                );
                rocket.quaternion.multiplyQuaternions(
                    yawQuaternion,
                    rocket.quaternion
                );

                // Pitch (up/down) around local X axis
                const pitchQuaternion = new THREE.Quaternion();
                const localXAxis = new THREE.Vector3(1, 0, 0).applyQuaternion(
                    rocket.quaternion
                );
                pitchQuaternion.setFromAxisAngle(localXAxis, -deltaY);
                rocket.quaternion.multiplyQuaternions(
                    pitchQuaternion,
                    rocket.quaternion
                );
            };

            const handleClick = () => {
                if (!isPointerLocked) {
                    gl.domElement.requestPointerLock();
                }
            };

            const handleKeyDown = (event: KeyboardEvent) => {
                if (event.code === "Escape" && isPointerLocked) {
                    document.exitPointerLock();
                }
            };

            // Add event listeners
            document.addEventListener(
                "pointerlockchange",
                handlePointerLockChange
            );
            document.addEventListener("mousemove", handleMouseMove);
            gl.domElement.addEventListener("click", handleClick);
            document.addEventListener("keydown", handleKeyDown);

            // Request pointer lock immediately when rocket becomes active
            gl.domElement.requestPointerLock();

            return () => {
                document.removeEventListener(
                    "pointerlockchange",
                    handlePointerLockChange
                );
                document.removeEventListener("mousemove", handleMouseMove);
                gl.domElement.removeEventListener("click", handleClick);
                document.removeEventListener("keydown", handleKeyDown);

                // Exit pointer lock when rocket deactivates
                if (document.pointerLockElement === gl.domElement) {
                    document.exitPointerLock();
                }
            };
        }, [isActive, gl]);

        // Keyboard controls (simplified - remove rotation keys since mouse handles rotation)
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

            // Translation forces - FIXED: W goes forward (negative Z), S goes backward (positive Z)
            if (controls.forward) localForce.z -= THRUST_FORCE; // W - forward
            if (controls.backward) localForce.z += THRUST_FORCE; // S - backward
            if (controls.left) localForce.x -= THRUST_FORCE; // A - strafe left
            if (controls.right) localForce.x += THRUST_FORCE; // D - strafe right
            if (controls.up) localForce.y += THRUST_FORCE; // Space - up
            if (controls.down) localForce.y -= THRUST_FORCE; // Shift - down

            // Roll controls only (pitch and yaw handled by mouse)
            if (controls.rollLeft) torque.z += ROTATION_FORCE;
            if (controls.rollRight) torque.z -= ROTATION_FORCE;

            // Convert local force to world space
            const worldForce = localForce
                .clone()
                .applyQuaternion(rocket.quaternion);

            // Apply forces
            velocity.add(worldForce);
            angularVelocity.add(torque);

            // Apply speed limits
            const currentSpeed = velocity.length();
            if (currentSpeed > MAX_SPEED) {
                velocity.normalize().multiplyScalar(MAX_SPEED);
            }

            // Apply angular speed limits
            const currentAngularSpeed = angularVelocity.length();
            if (currentAngularSpeed > MAX_ANGULAR_SPEED) {
                angularVelocity.normalize().multiplyScalar(MAX_ANGULAR_SPEED);
            }

            // Apply damping
            velocity.multiplyScalar(DAMPING);
            angularVelocity.multiplyScalar(ANGULAR_DAMPING);

            // Update position
            rocket.position.add(velocity);

            // Update roll rotation only (pitch/yaw handled by mouse)
            const rollQuaternion = new THREE.Quaternion();
            rollQuaternion.setFromAxisAngle(
                new THREE.Vector3(0, 0, 1),
                angularVelocity.z
            );
            rocket.quaternion.multiplyQuaternions(
                rollQuaternion,
                rocket.quaternion
            );

            // Track speed for UI display
            speedRef.current = currentSpeed;
            if (currentSpeed > maxSpeedRef.current) {
                maxSpeedRef.current = currentSpeed;
            }

            // Camera following (3rd person view)
            if (enableCameraFollow) {
                // Position camera behind and above the rocket for 3rd person view
                const offset = new THREE.Vector3(0, 2, 8).applyQuaternion(
                    rocket.quaternion
                );
                camera.position.copy(rocket.position).add(offset);

                // Look at the rocket
                camera.lookAt(rocket.position);
            }

            // Report position changes
            onPositionChange?.([
                rocket.position.x,
                rocket.position.y,
                rocket.position.z,
            ]);
        });

        // Reset max speed when rocket becomes active
        useEffect(() => {
            if (isActive) {
                maxSpeedRef.current = 0;
            }
        }, [isActive]);

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
);
Rocket.displayName = "Rocket";
