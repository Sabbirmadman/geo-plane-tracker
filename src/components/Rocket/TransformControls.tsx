/* eslint-disable no-case-declarations */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef, useEffect, useState } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

interface TransformControlsProps {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: number;
    onPositionChange: (position: [number, number, number]) => void;
    onRotationChange: (rotation: [number, number, number]) => void;
    onScaleChange: (scale: number) => void;
    enabled?: boolean;
    mode?: "translate" | "rotate" | "scale";
    gridSize?: number;
    snapToGrid?: boolean;
    isShiftPressed?: boolean;
}

export function TransformControls({
    position,
    rotation,
    scale,
    onPositionChange,
    onRotationChange,
    onScaleChange,
    enabled = true,
    mode = "translate",
    gridSize = 0.5,
    snapToGrid = true,
    isShiftPressed = false,
}: TransformControlsProps) {
    const { camera, gl, raycaster, pointer } = useThree();
    const transformRef = useRef<THREE.Group>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragAxis, setDragAxis] = useState<string | null>(null);
    const [initialValue, setInitialValue] = useState<any>(null);
    const [dragPlane] = useState(new THREE.Plane());
    const [intersection] = useState(new THREE.Vector3());
    const [dragStartPoint] = useState(new THREE.Vector3());
    const [lastMousePosition] = useState({ x: 0, y: 0 });

    const snapToGridValue = (value: number, grid: number): number => {
        if (!snapToGrid) return value;
        return Math.round(value / grid) * grid;
    };

    const snapPositionToGrid = (
        pos: [number, number, number]
    ): [number, number, number] => {
        if (!snapToGrid) return pos;
        return [
            snapToGridValue(pos[0], gridSize),
            snapToGridValue(pos[1], gridSize),
            snapToGridValue(pos[2], gridSize),
        ];
    };

    const snapRotationToGrid = (
        rot: [number, number, number]
    ): [number, number, number] => {
        if (!snapToGrid) return rot;
        const snapAngle = Math.PI / 8; // 22.5 degree snapping
        return [
            snapToGridValue(rot[0], snapAngle),
            snapToGridValue(rot[1], snapAngle),
            snapToGridValue(rot[2], snapAngle),
        ];
    };

    // Helper function to get world transform matrix for the component
    const getWorldTransformMatrix = () => {
        const matrix = new THREE.Matrix4();
        matrix.makeRotationFromEuler(
            new THREE.Euler(rotation[0], rotation[1], rotation[2], "XYZ")
        );
        matrix.setPosition(position[0], position[1], position[2]);
        return matrix;
    };

    // Helper function to transform direction vector to local space
    const transformDirectionToLocal = (worldDirection: THREE.Vector3) => {
        const rotationMatrix = new THREE.Matrix4();
        rotationMatrix.makeRotationFromEuler(
            new THREE.Euler(rotation[0], rotation[1], rotation[2], "XYZ")
        );
        const inverseMatrix = rotationMatrix.clone().invert();
        return worldDirection.clone().transformDirection(inverseMatrix);
    };

    // Handle mouse events without blocking camera controls
    useEffect(() => {
        if (!enabled || !isDragging) return;

        const handleMouseMove = (event: MouseEvent) => {
            if (!dragAxis) return;

            // Prevent event from bubbling to camera controls
            event.stopPropagation();

            // Update pointer for raycaster
            const rect = gl.domElement.getBoundingClientRect();
            pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            if (mode === "translate") {
                raycaster.setFromCamera(pointer, camera);

                if (raycaster.ray.intersectPlane(dragPlane, intersection)) {
                    const worldDelta = intersection.clone().sub(dragStartPoint);

                    // Transform world delta to local space of the component
                    const localDelta = transformDirectionToLocal(worldDelta);

                    let newPosition = [...initialValue] as [
                        number,
                        number,
                        number
                    ];

                    switch (dragAxis) {
                        case "x": {
                            // Move only in local X direction
                            const localX = new THREE.Vector3(
                                localDelta.x,
                                0,
                                0
                            );
                            const worldX = localX
                                .clone()
                                .applyMatrix4(
                                    getWorldTransformMatrix()
                                        .clone()
                                        .setPosition(0, 0, 0)
                                );
                            newPosition[0] = initialValue[0] + worldX.x;
                            newPosition[1] = initialValue[1] + worldX.y;
                            newPosition[2] = initialValue[2] + worldX.z;
                            break;
                        }
                        case "y": {
                            // Move only in local Y direction
                            const localY = new THREE.Vector3(
                                0,
                                localDelta.y,
                                0
                            );
                            const worldY = localY
                                .clone()
                                .applyMatrix4(
                                    getWorldTransformMatrix()
                                        .clone()
                                        .setPosition(0, 0, 0)
                                );
                            newPosition[0] = initialValue[0] + worldY.x;
                            newPosition[1] = initialValue[1] + worldY.y;
                            newPosition[2] = initialValue[2] + worldY.z;
                            break;
                        }
                        case "z": {
                            // Move only in local Z direction
                            const localZ = new THREE.Vector3(
                                0,
                                0,
                                localDelta.z
                            );
                            const worldZ = localZ
                                .clone()
                                .applyMatrix4(
                                    getWorldTransformMatrix()
                                        .clone()
                                        .setPosition(0, 0, 0)
                                );
                            newPosition[0] = initialValue[0] + worldZ.x;
                            newPosition[1] = initialValue[1] + worldZ.y;
                            newPosition[2] = initialValue[2] + worldZ.z;
                            break;
                        }
                        case "xy": {
                            // Move in local XY plane
                            const localXY = new THREE.Vector3(
                                localDelta.x,
                                localDelta.y,
                                0
                            );
                            const worldXY = localXY
                                .clone()
                                .applyMatrix4(
                                    getWorldTransformMatrix()
                                        .clone()
                                        .setPosition(0, 0, 0)
                                );
                            newPosition[0] = initialValue[0] + worldXY.x;
                            newPosition[1] = initialValue[1] + worldXY.y;
                            newPosition[2] = initialValue[2] + worldXY.z;
                            break;
                        }
                    }

                    // Apply grid snapping
                    newPosition = snapPositionToGrid(newPosition);
                    onPositionChange(newPosition);
                }
            } else if (mode === "rotate") {
                const deltaX = event.clientX - lastMousePosition.x;
                const deltaY = event.clientY - lastMousePosition.y;

                let newRotation = [...initialValue] as [number, number, number];
                const rotationSpeed = 0.01;

                switch (dragAxis) {
                    case "x":
                        newRotation[0] =
                            initialValue[0] + deltaY * rotationSpeed;
                        break;
                    case "y":
                        newRotation[1] =
                            initialValue[1] + deltaX * rotationSpeed;
                        break;
                    case "z":
                        newRotation[2] =
                            initialValue[2] + deltaX * rotationSpeed;
                        break;
                }

                // Apply rotation snapping
                newRotation = snapRotationToGrid(newRotation);
                onRotationChange(newRotation);

                // Update last mouse position
                lastMousePosition.x = event.clientX;
                lastMousePosition.y = event.clientY;
            } else if (mode === "scale") {
                const delta = event.movementX * 0.01;
                const newScale = Math.max(0.1, initialValue + delta);
                onScaleChange(newScale);
            }
        };

        const handleMouseUp = (event: MouseEvent) => {
            event.stopPropagation();
            setIsDragging(false);
            setDragAxis(null);
            gl.domElement.style.cursor = "auto";
        };

        // Add event listeners with capture to prevent camera interference
        document.addEventListener("mousemove", handleMouseMove, true);
        document.addEventListener("mouseup", handleMouseUp, true);

        return () => {
            document.removeEventListener("mousemove", handleMouseMove, true);
            document.removeEventListener("mouseup", handleMouseUp, true);
        };
    }, [
        isDragging,
        dragAxis,
        mode,
        position,
        rotation,
        scale,
        initialValue,
        snapToGrid,
        gridSize,
        enabled,
        gl,
        camera,
        pointer,
        raycaster,
        dragPlane,
        intersection,
        dragStartPoint,
        onPositionChange,
        onRotationChange,
        onScaleChange,
        lastMousePosition,
    ]);

    const handleAxisMouseDown = (axis: string, event: any) => {
        // Don't start transform if Shift is pressed (camera mode)
        if (isShiftPressed) {
            return;
        }

        event.stopPropagation();

        setIsDragging(true);
        setDragAxis(axis);

        if (mode === "translate") {
            // Set up drag plane based on axis in component's local space
            const worldPosition = new THREE.Vector3(...position);
            const componentMatrix = getWorldTransformMatrix();

            // Get plane normal in world space based on axis
            let planeNormal: THREE.Vector3;

            switch (axis) {
                case "x": {
                    planeNormal = new THREE.Vector3(0, 0, 1).transformDirection(
                        componentMatrix
                    );
                    break;
                }
                case "y": {
                    planeNormal = new THREE.Vector3(1, 0, 0).transformDirection(
                        componentMatrix
                    );
                    break;
                }
                case "z": {
                    planeNormal = new THREE.Vector3(0, 1, 0).transformDirection(
                        componentMatrix
                    );
                    break;
                }
                case "xy":
                default: {
                    planeNormal = new THREE.Vector3(0, 0, 1).transformDirection(
                        componentMatrix
                    );
                    break;
                }
            }

            dragPlane.setFromNormalAndCoplanarPoint(planeNormal, worldPosition);

            raycaster.setFromCamera(pointer, camera);
            raycaster.ray.intersectPlane(dragPlane, dragStartPoint);
            setInitialValue([...position]);
        } else if (mode === "rotate") {
            setInitialValue([...rotation]);
            // Store initial mouse position for rotation
            lastMousePosition.x = event.nativeEvent.clientX;
            lastMousePosition.y = event.nativeEvent.clientY;
        } else if (mode === "scale") {
            setInitialValue(scale);
        }

        gl.domElement.style.cursor = "move";
    };

    // Hide gizmo when Shift is pressed for camera mode
    if (!enabled || isShiftPressed) return null;

    return (
        <group ref={transformRef} position={position} rotation={rotation}>
            {/* Grid visualization when snapping is enabled */}
            {snapToGrid && mode === "translate" && (
                <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[gridSize * 20, gridSize * 20]} />
                    <meshBasicMaterial
                        color="#ffffff"
                        transparent
                        opacity={0.1}
                        wireframe
                        side={THREE.DoubleSide}
                    />
                </mesh>
            )}

            {mode === "translate" && (
                <>
                    {/* X-axis (Red) - Now follows component's local X axis */}
                    <group>
                        <mesh
                            position={[0.8, 0, 0]}
                            rotation={[0, 0, -Math.PI / 2]}
                            onPointerDown={(e) => handleAxisMouseDown("x", e)}
                        >
                            <cylinderGeometry args={[0.03, 0.03, 1.6, 8]} />
                            <meshBasicMaterial color="#ff4444" />
                        </mesh>
                        <mesh
                            position={[1.6, 0, 0]}
                            rotation={[0, 0, -Math.PI / 2]}
                            onPointerDown={(e) => handleAxisMouseDown("x", e)}
                        >
                            <coneGeometry args={[0.08, 0.2, 8]} />
                            <meshBasicMaterial color="#ff4444" />
                        </mesh>
                    </group>

                    {/* Y-axis (Green) - Now follows component's local Y axis */}
                    <group>
                        <mesh
                            position={[0, 0.8, 0]}
                            onPointerDown={(e) => handleAxisMouseDown("y", e)}
                        >
                            <cylinderGeometry args={[0.03, 0.03, 1.6, 8]} />
                            <meshBasicMaterial color="#44ff44" />
                        </mesh>
                        <mesh
                            position={[0, 1.6, 0]}
                            onPointerDown={(e) => handleAxisMouseDown("y", e)}
                        >
                            <coneGeometry args={[0.08, 0.2, 8]} />
                            <meshBasicMaterial color="#44ff44" />
                        </mesh>
                    </group>

                    {/* Z-axis (Blue) - Now follows component's local Z axis */}
                    <group>
                        <mesh
                            position={[0, 0, 0.8]}
                            rotation={[Math.PI / 2, 0, 0]}
                            onPointerDown={(e) => handleAxisMouseDown("z", e)}
                        >
                            <cylinderGeometry args={[0.03, 0.03, 1.6, 8]} />
                            <meshBasicMaterial color="#4444ff" />
                        </mesh>
                        <mesh
                            position={[0, 0, 1.6]}
                            rotation={[Math.PI / 2, 0, 0]}
                            onPointerDown={(e) => handleAxisMouseDown("z", e)}
                        >
                            <coneGeometry args={[0.08, 0.2, 8]} />
                            <meshBasicMaterial color="#4444ff" />
                        </mesh>
                    </group>

                    {/* XY plane handle - Now follows component's local XY plane */}
                    <mesh
                        position={[0.3, 0.3, 0]}
                        onPointerDown={(e) => handleAxisMouseDown("xy", e)}
                    >
                        <planeGeometry args={[0.3, 0.3]} />
                        <meshBasicMaterial
                            color="#ffff44"
                            transparent
                            opacity={0.3}
                        />
                    </mesh>
                </>
            )}

            {/* Enhanced Rotation controls with bars */}
            {mode === "rotate" && (
                <>
                    {/* X-axis rotation (Red) - Vertical bars */}
                    <group>
                        {/* Rotation ring */}
                        <mesh
                            rotation={[0, Math.PI / 2, 0]}
                            onPointerDown={(e) => handleAxisMouseDown("x", e)}
                        >
                            <torusGeometry args={[1.2, 0.04, 6, 32]} />
                            <meshBasicMaterial color="#ff4444" />
                        </mesh>
                        {/* Rotation bars for better visibility */}
                        {[0, 1, 2, 3].map((i) => (
                            <mesh
                                key={`x-bar-${i}`}
                                position={[
                                    0,
                                    Math.cos((i * Math.PI) / 2) * 1.2,
                                    Math.sin((i * Math.PI) / 2) * 1.2,
                                ]}
                                rotation={[0, Math.PI / 2, (i * Math.PI) / 2]}
                                onPointerDown={(e) =>
                                    handleAxisMouseDown("x", e)
                                }
                            >
                                <boxGeometry args={[0.05, 0.3, 0.05]} />
                                <meshBasicMaterial color="#ff6666" />
                            </mesh>
                        ))}
                    </group>

                    {/* Y-axis rotation (Green) - Horizontal bars */}
                    <group>
                        {/* Rotation ring */}
                        <mesh
                            rotation={[Math.PI / 2, 0, 0]}
                            onPointerDown={(e) => handleAxisMouseDown("y", e)}
                        >
                            <torusGeometry args={[1.2, 0.04, 6, 32]} />
                            <meshBasicMaterial color="#44ff44" />
                        </mesh>
                        {/* Rotation bars for better visibility */}
                        {[0, 1, 2, 3].map((i) => (
                            <mesh
                                key={`y-bar-${i}`}
                                position={[
                                    Math.cos((i * Math.PI) / 2) * 1.2,
                                    0,
                                    Math.sin((i * Math.PI) / 2) * 1.2,
                                ]}
                                rotation={[Math.PI / 2, (i * Math.PI) / 2, 0]}
                                onPointerDown={(e) =>
                                    handleAxisMouseDown("y", e)
                                }
                            >
                                <boxGeometry args={[0.05, 0.3, 0.05]} />
                                <meshBasicMaterial color="#66ff66" />
                            </mesh>
                        ))}
                    </group>

                    {/* Z-axis rotation (Blue) - Side bars */}
                    <group>
                        {/* Rotation ring */}
                        <mesh
                            onPointerDown={(e) => handleAxisMouseDown("z", e)}
                        >
                            <torusGeometry args={[1.2, 0.04, 6, 32]} />
                            <meshBasicMaterial color="#4444ff" />
                        </mesh>
                        {/* Rotation bars for better visibility */}
                        {[0, 1, 2, 3].map((i) => (
                            <mesh
                                key={`z-bar-${i}`}
                                position={[
                                    Math.cos((i * Math.PI) / 2) * 1.2,
                                    Math.sin((i * Math.PI) / 2) * 1.2,
                                    0,
                                ]}
                                rotation={[0, 0, (i * Math.PI) / 2]}
                                onPointerDown={(e) =>
                                    handleAxisMouseDown("z", e)
                                }
                            >
                                <boxGeometry args={[0.05, 0.3, 0.05]} />
                                <meshBasicMaterial color="#6666ff" />
                            </mesh>
                        ))}
                    </group>

                    {/* Rotation indicators */}
                    <mesh position={[1.5, 0, 0]}>
                        <boxGeometry args={[0.1, 0.05, 0.05]} />
                        <meshBasicMaterial color="#ff4444" />
                    </mesh>
                    <mesh position={[0, 1.5, 0]}>
                        <boxGeometry args={[0.05, 0.1, 0.05]} />
                        <meshBasicMaterial color="#44ff44" />
                    </mesh>
                    <mesh position={[0, 0, 1.5]}>
                        <boxGeometry args={[0.05, 0.05, 0.1]} />
                        <meshBasicMaterial color="#4444ff" />
                    </mesh>
                </>
            )}

            {/* Scale controls */}
            {mode === "scale" && (
                <>
                    {/* Uniform scale handles */}
                    <mesh
                        position={[1, 0, 0]}
                        onPointerDown={(e) => handleAxisMouseDown("uniform", e)}
                    >
                        <boxGeometry args={[0.15, 0.15, 0.15]} />
                        <meshBasicMaterial color="#ffff44" />
                    </mesh>
                    <mesh
                        position={[0, 1, 0]}
                        onPointerDown={(e) => handleAxisMouseDown("uniform", e)}
                    >
                        <boxGeometry args={[0.15, 0.15, 0.15]} />
                        <meshBasicMaterial color="#ffff44" />
                    </mesh>
                    <mesh
                        position={[0, 0, 1]}
                        onPointerDown={(e) => handleAxisMouseDown("uniform", e)}
                    >
                        <boxGeometry args={[0.15, 0.15, 0.15]} />
                        <meshBasicMaterial color="#ffff44" />
                    </mesh>

                    {/* Center scale handle */}
                    <mesh
                        onPointerDown={(e) => handleAxisMouseDown("uniform", e)}
                    >
                        <boxGeometry args={[0.2, 0.2, 0.2]} />
                        <meshBasicMaterial
                            color="#ffffff"
                            transparent
                            opacity={0.5}
                        />
                    </mesh>
                </>
            )}
        </group>
    );
}
