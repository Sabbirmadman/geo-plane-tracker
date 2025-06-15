import { forwardRef } from "react";
import * as THREE from "three";

export interface ComponentStats {
    mass: number;
    thrust?: number;
    fuelCapacity?: number;
    controlAuthority?: number;
    cost: number;
}

export interface RocketComponentProps {
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: number;
    color?: string;
    selected?: boolean;
    onClick?: () => void;
    isActive?: boolean; // For engine nozzles
}

// Engine Components (without nozzles)
export const SmallEngine = forwardRef<THREE.Group, RocketComponentProps>(
    (
        {
            position = [0, 0, 0],
            rotation = [0, 0, 0],
            scale = 1,
            color = "#333333",
            selected = false,
            onClick,
        },
        ref
    ) => (
        <group
            ref={ref}
            position={position}
            rotation={rotation}
            scale={scale}
            onClick={onClick}
        >
            {/* Main engine block */}
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[0.8, 0.8, 1.2]} />
                <meshPhongMaterial color={color} />
            </mesh>
            {/* Engine chamber */}
            <mesh position={[0, 0, 0.4]}>
                <cylinderGeometry args={[0.3, 0.25, 0.4, 8]} />
                <meshPhongMaterial color="#222222" />
            </mesh>
            {/* Connection points */}
            <mesh position={[0, 0, -0.6]}>
                <cylinderGeometry args={[0.1, 0.1, 0.1, 8]} />
                <meshPhongMaterial color="#666666" />
            </mesh>
            {/* Engine mounting point for nozzle */}
            <mesh position={[0, 0, 0.6]}>
                <cylinderGeometry args={[0.15, 0.15, 0.1, 8]} />
                <meshPhongMaterial color="#444444" />
            </mesh>
            {selected && (
                <mesh>
                    <boxGeometry args={[1.0, 1.0, 1.4]} />
                    <meshBasicMaterial
                        color="#00ff00"
                        wireframe
                        transparent
                        opacity={0.3}
                    />
                </mesh>
            )}
        </group>
    )
);

export const MediumEngine = forwardRef<THREE.Group, RocketComponentProps>(
    (
        {
            position = [0, 0, 0],
            rotation = [0, 0, 0],
            scale = 1,
            color = "#444444",
            selected = false,
            onClick,
        },
        ref
    ) => (
        <group
            ref={ref}
            position={position}
            rotation={rotation}
            scale={scale}
            onClick={onClick}
        >
            {/* Main engine block */}
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[1.0, 1.0, 1.5]} />
                <meshPhongMaterial color={color} />
            </mesh>
            {/* Engine chamber */}
            <mesh position={[0, 0, 0.5]}>
                <cylinderGeometry args={[0.4, 0.35, 0.5, 8]} />
                <meshPhongMaterial color="#222222" />
            </mesh>
            {/* Side details */}
            <mesh position={[0.4, 0, 0]}>
                <boxGeometry args={[0.2, 0.6, 1.0]} />
                <meshPhongMaterial color="#666666" />
            </mesh>
            <mesh position={[-0.4, 0, 0]}>
                <boxGeometry args={[0.2, 0.6, 1.0]} />
                <meshPhongMaterial color="#666666" />
            </mesh>
            {/* Connection points */}
            <mesh position={[0, 0, -0.75]}>
                <cylinderGeometry args={[0.1, 0.1, 0.1, 8]} />
                <meshPhongMaterial color="#666666" />
            </mesh>
            {/* Engine mounting point for nozzle */}
            <mesh position={[0, 0, 0.75]}>
                <cylinderGeometry args={[0.2, 0.2, 0.1, 8]} />
                <meshPhongMaterial color="#444444" />
            </mesh>
            {selected && (
                <mesh>
                    <boxGeometry args={[1.2, 1.2, 1.7]} />
                    <meshBasicMaterial
                        color="#00ff00"
                        wireframe
                        transparent
                        opacity={0.3}
                    />
                </mesh>
            )}
        </group>
    )
);

// Engine Nozzle Components (separate clickable components)
export const SmallEngineNozzle = forwardRef<THREE.Group, RocketComponentProps>(
    (
        {
            position = [0, 0, 0],
            rotation = [0, 0, 0],
            scale = 1,
            color = "#ff6600",
            selected = false,
            onClick,
            isActive = false,
        },
        ref
    ) => (
        <group
            ref={ref}
            position={position}
            rotation={rotation}
            scale={scale}
            onClick={onClick}
        >
            {/* Nozzle bell */}
            <mesh position={[0, 0, 0.3]}>
                <coneGeometry args={[0.4, 0.6, 8]} />
                <meshPhongMaterial
                    color={isActive ? "#ff3300" : color}
                    emissive={isActive ? "#330000" : "#000000"}
                />
            </mesh>
            {/* Inner nozzle */}
            <mesh position={[0, 0, 0.5]}>
                <cylinderGeometry args={[0.15, 0.2, 0.2, 8]} />
                <meshPhongMaterial
                    color={isActive ? "#ffaa00" : "#444444"}
                    emissive={isActive ? "#ff6600" : "#000000"}
                />
            </mesh>
            {/* Connection flange */}
            <mesh position={[0, 0, -0.1]}>
                <cylinderGeometry args={[0.25, 0.25, 0.2, 8]} />
                <meshPhongMaterial color="#333333" />
            </mesh>
            {selected && (
                <mesh>
                    <coneGeometry args={[0.5, 0.8, 8]} />
                    <meshBasicMaterial
                        color="#00ff00"
                        wireframe
                        transparent
                        opacity={0.3}
                    />
                </mesh>
            )}
            {/* Active glow effect */}
            {isActive && (
                <pointLight
                    position={[0, 0, 0.6]}
                    color="#ff6600"
                    intensity={2}
                    distance={3}
                    decay={2}
                />
            )}
        </group>
    )
);

export const MediumEngineNozzle = forwardRef<THREE.Group, RocketComponentProps>(
    (
        {
            position = [0, 0, 0],
            rotation = [0, 0, 0],
            scale = 1,
            color = "#ff6600",
            selected = false,
            onClick,
            isActive = false,
        },
        ref
    ) => (
        <group
            ref={ref}
            position={position}
            rotation={rotation}
            scale={scale}
            onClick={onClick}
        >
            {/* Nozzle bell */}
            <mesh position={[0, 0, 0.4]}>
                <coneGeometry args={[0.6, 0.8, 8]} />
                <meshPhongMaterial
                    color={isActive ? "#ff3300" : color}
                    emissive={isActive ? "#330000" : "#000000"}
                />
            </mesh>
            {/* Inner nozzle */}
            <mesh position={[0, 0, 0.7]}>
                <cylinderGeometry args={[0.2, 0.3, 0.3, 8]} />
                <meshPhongMaterial
                    color={isActive ? "#ffaa00" : "#444444"}
                    emissive={isActive ? "#ff6600" : "#000000"}
                />
            </mesh>
            {/* Connection flange */}
            <mesh position={[0, 0, -0.1]}>
                <cylinderGeometry args={[0.35, 0.35, 0.2, 8]} />
                <meshPhongMaterial color="#333333" />
            </mesh>
            {/* Exhaust vanes */}
            {[0, 1, 2, 3].map((i) => (
                <mesh
                    key={i}
                    position={[
                        Math.cos((i * Math.PI) / 2) * 0.4,
                        Math.sin((i * Math.PI) / 2) * 0.4,
                        0.6,
                    ]}
                    rotation={[0, 0, (i * Math.PI) / 2]}
                >
                    <boxGeometry args={[0.05, 0.2, 0.01]} />
                    <meshPhongMaterial
                        color={isActive ? "#ff9900" : "#666666"}
                    />
                </mesh>
            ))}
            {selected && (
                <mesh>
                    <coneGeometry args={[0.7, 1.0, 8]} />
                    <meshBasicMaterial
                        color="#00ff00"
                        wireframe
                        transparent
                        opacity={0.3}
                    />
                </mesh>
            )}
            {/* Active glow effect */}
            {isActive && (
                <pointLight
                    position={[0, 0, 0.8]}
                    color="#ff6600"
                    intensity={3}
                    distance={4}
                    decay={2}
                />
            )}
        </group>
    )
);

// Fuel Tank Components
export const SmallFuelTank = forwardRef<THREE.Group, RocketComponentProps>(
    (
        {
            position = [0, 0, 0],
            rotation = [0, 0, 0],
            scale = 1,
            color = "#ff6600",
            selected = false,
            onClick,
        },
        ref
    ) => (
        <group
            ref={ref}
            position={position}
            rotation={rotation}
            scale={scale}
            onClick={onClick}
        >
            {/* Main tank body */}
            <mesh>
                <boxGeometry args={[0.8, 0.8, 2.0]} />
                <meshPhongMaterial color={color} />
            </mesh>
            {/* End caps */}
            <mesh position={[0, 0, 1.0]}>
                <boxGeometry args={[0.6, 0.6, 0.2]} />
                <meshPhongMaterial color={color} />
            </mesh>
            <mesh position={[0, 0, -1.0]}>
                <boxGeometry args={[0.6, 0.6, 0.2]} />
                <meshPhongMaterial color={color} />
            </mesh>
            {/* Connection points */}
            <mesh position={[0, 0, 1.1]}>
                <cylinderGeometry args={[0.1, 0.1, 0.1, 8]} />
                <meshPhongMaterial color="#666666" />
            </mesh>
            <mesh position={[0, 0, -1.1]}>
                <cylinderGeometry args={[0.1, 0.1, 0.1, 8]} />
                <meshPhongMaterial color="#666666" />
            </mesh>
            {selected && (
                <mesh>
                    <boxGeometry args={[1.0, 1.0, 2.4]} />
                    <meshBasicMaterial
                        color="#00ff00"
                        wireframe
                        transparent
                        opacity={0.3}
                    />
                </mesh>
            )}
        </group>
    )
);

export const LargeFuelTank = forwardRef<THREE.Group, RocketComponentProps>(
    (
        {
            position = [0, 0, 0],
            rotation = [0, 0, 0],
            scale = 1,
            color = "#ff6600",
            selected = false,
            onClick,
        },
        ref
    ) => (
        <group
            ref={ref}
            position={position}
            rotation={rotation}
            scale={scale}
            onClick={onClick}
        >
            {/* Main tank body */}
            <mesh>
                <boxGeometry args={[1.0, 1.0, 3.0]} />
                <meshPhongMaterial color={color} />
            </mesh>
            {/* Reinforcement rings */}
            <mesh position={[0, 0, 1.0]}>
                <boxGeometry args={[1.1, 1.1, 0.1]} />
                <meshPhongMaterial color="#444444" />
            </mesh>
            <mesh position={[0, 0, -1.0]}>
                <boxGeometry args={[1.1, 1.1, 0.1]} />
                <meshPhongMaterial color="#444444" />
            </mesh>
            {/* End caps */}
            <mesh position={[0, 0, 1.5]}>
                <boxGeometry args={[0.8, 0.8, 0.2]} />
                <meshPhongMaterial color={color} />
            </mesh>
            <mesh position={[0, 0, -1.5]}>
                <boxGeometry args={[0.8, 0.8, 0.2]} />
                <meshPhongMaterial color={color} />
            </mesh>
            {/* Connection points */}
            <mesh position={[0, 0, 1.6]}>
                <cylinderGeometry args={[0.1, 0.1, 0.1, 8]} />
                <meshPhongMaterial color="#666666" />
            </mesh>
            <mesh position={[0, 0, -1.6]}>
                <cylinderGeometry args={[0.1, 0.1, 0.1, 8]} />
                <meshPhongMaterial color="#666666" />
            </mesh>
            {selected && (
                <mesh>
                    <boxGeometry args={[1.2, 1.2, 3.4]} />
                    <meshBasicMaterial
                        color="#00ff00"
                        wireframe
                        transparent
                        opacity={0.3}
                    />
                </mesh>
            )}
        </group>
    )
);

// Control Modules
export const ControlModule = forwardRef<THREE.Group, RocketComponentProps>(
    (
        {
            position = [0, 0, 0],
            rotation = [0, 0, 0],
            scale = 1,
            color = "#0066cc",
            selected = false,
            onClick,
        },
        ref
    ) => (
        <group
            ref={ref}
            position={position}
            rotation={rotation}
            scale={scale}
            onClick={onClick}
        >
            {/* Main control unit */}
            <mesh>
                <boxGeometry args={[1.0, 1.0, 1.0]} />
                <meshPhongMaterial color={color} />
            </mesh>
            {/* Side panels */}
            <mesh position={[0.5, 0, 0]}>
                <boxGeometry args={[0.2, 0.8, 0.8]} />
                <meshPhongMaterial color="#004499" />
            </mesh>
            <mesh position={[-0.5, 0, 0]}>
                <boxGeometry args={[0.2, 0.8, 0.8]} />
                <meshPhongMaterial color="#004499" />
            </mesh>
            <mesh position={[0, 0.5, 0]}>
                <boxGeometry args={[0.8, 0.2, 0.8]} />
                <meshPhongMaterial color="#004499" />
            </mesh>
            <mesh position={[0, -0.5, 0]}>
                <boxGeometry args={[0.8, 0.2, 0.8]} />
                <meshPhongMaterial color="#004499" />
            </mesh>
            {/* Connection points */}
            <mesh position={[0, 0, 0.5]}>
                <cylinderGeometry args={[0.1, 0.1, 0.1, 8]} />
                <meshPhongMaterial color="#666666" />
            </mesh>
            <mesh position={[0, 0, -0.5]}>
                <cylinderGeometry args={[0.1, 0.1, 0.1, 8]} />
                <meshPhongMaterial color="#666666" />
            </mesh>
            {selected && (
                <mesh>
                    <boxGeometry args={[1.2, 1.2, 1.2]} />
                    <meshBasicMaterial
                        color="#00ff00"
                        wireframe
                        transparent
                        opacity={0.3}
                    />
                </mesh>
            )}
        </group>
    )
);

// Connector Components
export const Connector = forwardRef<THREE.Group, RocketComponentProps>(
    (
        {
            position = [0, 0, 0],
            rotation = [0, 0, 0],
            scale = 1,
            color = "#888888",
            selected = false,
            onClick,
        },
        ref
    ) => (
        <group
            ref={ref}
            position={position}
            rotation={rotation}
            scale={scale}
            onClick={onClick}
        >
            {/* Main connector body */}
            <mesh>
                <boxGeometry args={[0.6, 0.6, 0.4]} />
                <meshPhongMaterial color={color} />
            </mesh>
            {/* Connection flanges */}
            <mesh position={[0, 0, 0.2]}>
                <boxGeometry args={[0.8, 0.8, 0.1]} />
                <meshPhongMaterial color="#666666" />
            </mesh>
            <mesh position={[0, 0, -0.2]}>
                <boxGeometry args={[0.8, 0.8, 0.1]} />
                <meshPhongMaterial color="#666666" />
            </mesh>
            {/* Connection points */}
            <mesh position={[0, 0, 0.25]}>
                <cylinderGeometry args={[0.1, 0.1, 0.1, 8]} />
                <meshPhongMaterial color="#444444" />
            </mesh>
            <mesh position={[0, 0, -0.25]}>
                <cylinderGeometry args={[0.1, 0.1, 0.1, 8]} />
                <meshPhongMaterial color="#444444" />
            </mesh>
            {selected && (
                <mesh>
                    <boxGeometry args={[1.0, 1.0, 0.6]} />
                    <meshBasicMaterial
                        color="#00ff00"
                        wireframe
                        transparent
                        opacity={0.3}
                    />
                </mesh>
            )}
        </group>
    )
);

// Nose Cone
export const NoseCone = forwardRef<THREE.Group, RocketComponentProps>(
    (
        {
            position = [0, 0, 0],
            rotation = [0, 0, 0],
            scale = 1,
            color = "#cccccc",
            selected = false,
            onClick,
        },
        ref
    ) => (
        <group
            ref={ref}
            position={position}
            rotation={rotation}
            scale={scale}
            onClick={onClick}
        >
            {/* Base section */}
            <mesh position={[0, 0, 0.25]}>
                <boxGeometry args={[1.0, 1.0, 0.5]} />
                <meshPhongMaterial color={color} />
            </mesh>
            {/* Tapered sections */}
            <mesh position={[0, 0, -0.25]}>
                <boxGeometry args={[0.8, 0.8, 0.5]} />
                <meshPhongMaterial color={color} />
            </mesh>
            <mesh position={[0, 0, -0.75]}>
                <boxGeometry args={[0.6, 0.6, 0.5]} />
                <meshPhongMaterial color={color} />
            </mesh>
            <mesh position={[0, 0, -1.15]}>
                <boxGeometry args={[0.4, 0.4, 0.3]} />
                <meshPhongMaterial color={color} />
            </mesh>
            {/* Connection point */}
            <mesh position={[0, 0, 0.5]}>
                <cylinderGeometry args={[0.1, 0.1, 0.1, 8]} />
                <meshPhongMaterial color="#666666" />
            </mesh>
            {selected && (
                <mesh>
                    <boxGeometry args={[1.2, 1.2, 2.0]} />
                    <meshBasicMaterial
                        color="#00ff00"
                        wireframe
                        transparent
                        opacity={0.3}
                    />
                </mesh>
            )}
        </group>
    )
);

// Component Stats Database
export const COMPONENT_STATS: Record<string, ComponentStats> = {
    SmallEngine: { mass: 0.4, cost: 80 },
    MediumEngine: { mass: 0.8, cost: 150 },
    SmallEngineNozzle: { mass: 0.1, thrust: 50, cost: 50 },
    MediumEngineNozzle: { mass: 0.2, thrust: 120, cost: 100 },
    SmallFuelTank: { mass: 0.3, fuelCapacity: 100, cost: 50 },
    LargeFuelTank: { mass: 0.8, fuelCapacity: 300, cost: 150 },
    ControlModule: { mass: 0.4, controlAuthority: 1.0, cost: 200 },
    Connector: { mass: 0.1, cost: 25 },
    NoseCone: { mass: 0.2, cost: 75 },
};

SmallEngine.displayName = "SmallEngine";
MediumEngine.displayName = "MediumEngine";
SmallEngineNozzle.displayName = "SmallEngineNozzle";
MediumEngineNozzle.displayName = "MediumEngineNozzle";
SmallFuelTank.displayName = "SmallFuelTank";
LargeFuelTank.displayName = "LargeFuelTank";
ControlModule.displayName = "ControlModule";
Connector.displayName = "Connector";
NoseCone.displayName = "NoseCone";
