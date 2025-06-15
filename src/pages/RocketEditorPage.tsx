import { useState, useCallback, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars, Grid } from "@react-three/drei";
import { Suspense } from "react";
import { Rocket, RocketComponent } from "../components/Rocket/Rocket";
import { COMPONENT_STATS } from "../components/Rocket/RocketComponents";
import {
    PerformanceManager,
    PerformanceMetrics,
} from "../utils/performanceManager";
import { TransformControls } from "../components/Rocket/TransformControls";
import { RocketStorage, RocketDesign } from "../utils/rocketStorage";

export default function RocketEditorPage() {
    const [rocketScale, setRocketScale] = useState(1);
    const [rocketPosition, setRocketPosition] = useState<
        [number, number, number]
    >([0, 0, 0]);
    const [rocketMode, setRocketMode] = useState<"rocket" | "hover">("rocket");
    const [isRocketActive, setIsRocketActive] = useState(false);
    const [showGrid, setShowGrid] = useState(true);
    const [showStars, setShowStars] = useState(false);
    const [ambientLightIntensity, setAmbientLightIntensity] = useState(0.5);
    const [performanceStats, setPerformanceStats] =
        useState<PerformanceMetrics | null>(null);
    const [showPerformance, setShowPerformance] = useState(false);
    const [selectedComponent, setSelectedComponent] = useState<string | null>(
        null
    );
    const [rocketComponents, setRocketComponents] = useState<RocketComponent[]>(
        [
            {
                id: "nosecone",
                type: "NoseCone",
                position: [0, 0, -3.1],
                rotation: [0, 0, 0],
                color: "#cccccc",
                scale: 1,
            },
            {
                id: "fueltank1",
                type: "LargeFuelTank",
                position: [0, 0, -1.1],
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
                position: [0, -0.5, 3],
                rotation: [-1.5707963267948966, 0, 0],
                color: "#ff6600",
                scale: 1,
                isActive: false,
            },
        ]
    );
    const [transformMode, setTransformMode] = useState<
        "translate" | "rotate" | "scale"
    >("translate");
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showLoadDialog, setShowLoadDialog] = useState(false);
    const [rocketName, setRocketName] = useState("My Rocket");
    const [savedDesigns, setSavedDesigns] = useState<RocketDesign[]>([]);
    const [currentDesignId, setCurrentDesignId] = useState<string | null>(null);
    const [snapToGrid, setSnapToGrid] = useState(true);
    const [gridSize, setGridSize] = useState(0.5);
    const [isShiftPressed, setIsShiftPressed] = useState(false);

    // Update performance stats
    useEffect(() => {
        const interval = setInterval(() => {
            const stats = PerformanceManager.getInstance().getStats();
            setPerformanceStats(stats);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // Load saved designs on mount
    useEffect(() => {
        setSavedDesigns(RocketStorage.getAllDesigns());
    }, []);

    // Track Shift key state for camera override
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Shift") {
                setIsShiftPressed(true);
            }
        };

        const handleKeyUp = (event: KeyboardEvent) => {
            if (event.key === "Shift") {
                setIsShiftPressed(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, []);

    const handleRocketPositionChange = useCallback(
        (position: [number, number, number]) => {
            setRocketPosition(position);
        },
        []
    );

    const handleRocketModeChange = useCallback((mode: "rocket" | "hover") => {
        setRocketMode(mode);
    }, []);

    const handleRocketActiveToggle = useCallback((active: boolean) => {
        setIsRocketActive(active);
    }, []);

    const resetRocketPosition = useCallback(() => {
        setRocketPosition([0, 0, 0]);
    }, []);

    const addComponent = useCallback((type: string) => {
        const getDefaultColor = (type: string) => {
            switch (type) {
                case "SmallEngine":
                case "MediumEngine":
                    return "#444444";
                case "SmallEngineNozzle":
                case "MediumEngineNozzle":
                    return "#ff6600";
                case "SmallFuelTank":
                case "LargeFuelTank":
                    return "#ff6600";
                case "ControlModule":
                    return "#0066cc";
                case "Connector":
                    return "#888888";
                case "NoseCone":
                    return "#cccccc";
                default:
                    return "#ffffff";
            }
        };

        const newComponent: RocketComponent = {
            id: `${type.toLowerCase()}-${Date.now()}`,
            type,
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            color: getDefaultColor(type),
            scale: 1,
        };
        setRocketComponents((prev) => [...prev, newComponent]);
    }, []);

    const removeComponent = useCallback(
        (id: string) => {
            setRocketComponents((prev) => prev.filter((c) => c.id !== id));
            if (selectedComponent === id) {
                setSelectedComponent(null);
            }
        },
        [selectedComponent]
    );

    const updateComponent = useCallback(
        (id: string, updates: Partial<RocketComponent>) => {
            setRocketComponents((prev) =>
                prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
            );
        },
        []
    );

    // Add keyboard shortcuts for grid snapping and arrow key controls
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Don't interfere with component transform shortcuts when selected
            if (selectedComponent && !isRocketActive && !isShiftPressed) {
                switch (event.key.toLowerCase()) {
                    case "w":
                        if (!event.ctrlKey) {
                            setTransformMode("translate");
                            event.preventDefault();
                        }
                        break;
                    case "e":
                        setTransformMode("rotate");
                        event.preventDefault();
                        break;
                    case "r":
                        setTransformMode("scale");
                        event.preventDefault();
                        break;
                    case "g":
                        setSnapToGrid(!snapToGrid);
                        event.preventDefault();
                        break;
                }

                // Arrow key controls for selected component
                const component = rocketComponents.find(
                    (c) => c.id === selectedComponent
                );
                if (component) {
                    const moveStep = event.shiftKey
                        ? 1.0
                        : snapToGrid
                        ? gridSize
                        : 0.1;
                    const rotateStep = event.shiftKey
                        ? Math.PI / 4
                        : Math.PI / 16; // 45° or 11.25°
                    const scaleStep = event.shiftKey ? 0.2 : 0.05;

                    switch (event.key) {
                        case "ArrowUp": {
                            event.preventDefault();
                            if (transformMode === "translate") {
                                // Move up (Y+)
                                updateComponent(component.id, {
                                    position: [
                                        component.position[0],
                                        component.position[1] + moveStep,
                                        component.position[2],
                                    ],
                                });
                            } else if (transformMode === "rotate") {
                                // Rotate around X axis
                                updateComponent(component.id, {
                                    rotation: [
                                        component.rotation[0] + rotateStep,
                                        component.rotation[1],
                                        component.rotation[2],
                                    ],
                                });
                            } else if (transformMode === "scale") {
                                // Scale up
                                updateComponent(component.id, {
                                    scale: Math.min(
                                        5.0,
                                        component.scale + scaleStep
                                    ),
                                });
                            }
                            break;
                        }

                        case "ArrowDown": {
                            event.preventDefault();
                            if (transformMode === "translate") {
                                // Move down (Y-)
                                updateComponent(component.id, {
                                    position: [
                                        component.position[0],
                                        component.position[1] - moveStep,
                                        component.position[2],
                                    ],
                                });
                            } else if (transformMode === "rotate") {
                                // Rotate around X axis (opposite)
                                updateComponent(component.id, {
                                    rotation: [
                                        component.rotation[0] - rotateStep,
                                        component.rotation[1],
                                        component.rotation[2],
                                    ],
                                });
                            } else if (transformMode === "scale") {
                                // Scale down
                                updateComponent(component.id, {
                                    scale: Math.max(
                                        0.1,
                                        component.scale - scaleStep
                                    ),
                                });
                            }
                            break;
                        }

                        case "ArrowLeft": {
                            event.preventDefault();
                            if (transformMode === "translate") {
                                // Move left (X-)
                                updateComponent(component.id, {
                                    position: [
                                        component.position[0] - moveStep,
                                        component.position[1],
                                        component.position[2],
                                    ],
                                });
                            } else if (transformMode === "rotate") {
                                // Rotate around Y axis
                                updateComponent(component.id, {
                                    rotation: [
                                        component.rotation[0],
                                        component.rotation[1] - rotateStep,
                                        component.rotation[2],
                                    ],
                                });
                            }
                            break;
                        }

                        case "ArrowRight": {
                            event.preventDefault();
                            if (transformMode === "translate") {
                                // Move right (X+)
                                updateComponent(component.id, {
                                    position: [
                                        component.position[0] + moveStep,
                                        component.position[1],
                                        component.position[2],
                                    ],
                                });
                            } else if (transformMode === "rotate") {
                                // Rotate around Y axis (opposite)
                                updateComponent(component.id, {
                                    rotation: [
                                        component.rotation[0],
                                        component.rotation[1] + rotateStep,
                                        component.rotation[2],
                                    ],
                                });
                            }
                            break;
                        }

                        case "PageUp": {
                            event.preventDefault();
                            if (transformMode === "translate") {
                                // Move forward (Z-)
                                updateComponent(component.id, {
                                    position: [
                                        component.position[0],
                                        component.position[1],
                                        component.position[2] - moveStep,
                                    ],
                                });
                            } else if (transformMode === "rotate") {
                                // Rotate around Z axis
                                updateComponent(component.id, {
                                    rotation: [
                                        component.rotation[0],
                                        component.rotation[1],
                                        component.rotation[2] + rotateStep,
                                    ],
                                });
                            }
                            break;
                        }

                        case "PageDown": {
                            event.preventDefault();
                            if (transformMode === "translate") {
                                // Move backward (Z+)
                                updateComponent(component.id, {
                                    position: [
                                        component.position[0],
                                        component.position[1],
                                        component.position[2] + moveStep,
                                    ],
                                });
                            } else if (transformMode === "rotate") {
                                // Rotate around Z axis (opposite)
                                updateComponent(component.id, {
                                    rotation: [
                                        component.rotation[0],
                                        component.rotation[1],
                                        component.rotation[2] - rotateStep,
                                    ],
                                });
                            }
                            break;
                        }
                    }
                }
            }

            // Global shortcuts
            if (event.ctrlKey) {
                switch (event.key.toLowerCase()) {
                    case "s":
                        setShowSaveDialog(true);
                        event.preventDefault();
                        break;
                    case "o":
                        setShowLoadDialog(true);
                        event.preventDefault();
                        break;
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [
        selectedComponent,
        isRocketActive,
        snapToGrid,
        isShiftPressed,
        transformMode,
        gridSize,
        rocketComponents,
        updateComponent,
    ]);

    const calculateRocketStats = () => {
        return rocketComponents.reduce(
            (stats, component) => {
                const componentStats = COMPONENT_STATS[component.type];
                if (componentStats) {
                    stats.totalMass += componentStats.mass;
                    stats.totalThrust += componentStats.thrust || 0;
                    stats.totalFuel += componentStats.fuelCapacity || 0;
                    stats.totalCost += componentStats.cost;
                }
                return stats;
            },
            { totalMass: 0, totalThrust: 0, totalFuel: 0, totalCost: 0 }
        );
    };

    const rocketStats = calculateRocketStats();

    const handleComponentSelect = useCallback(
        (id: string) => {
            if (!isRocketActive) {
                setSelectedComponent(id);
            }
        },
        [isRocketActive]
    );

    const handleComponentUpdate = useCallback(
        (id: string, updates: Partial<RocketComponent>) => {
            updateComponent(id, updates);
        },
        [updateComponent]
    );

    const saveRocketDesign = useCallback(() => {
        if (currentDesignId) {
            RocketStorage.updateDesign(
                currentDesignId,
                rocketName,
                rocketComponents
            );
        } else {
            const newId = RocketStorage.saveDesign(
                rocketName,
                rocketComponents
            );
            setCurrentDesignId(newId);
        }
        setSavedDesigns(RocketStorage.getAllDesigns());
        setShowSaveDialog(false);
    }, [currentDesignId, rocketName, rocketComponents]);

    const loadRocketDesign = useCallback((id: string) => {
        const design = RocketStorage.loadDesign(id);
        if (design) {
            setRocketComponents(design.components);
            setRocketName(design.name);
            setCurrentDesignId(id);
            setSelectedComponent(null);
            setShowLoadDialog(false);
        }
    }, []);

    const createNewRocket = useCallback(() => {
        setRocketComponents([
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
                isActive: false,
            },
        ]);
        setRocketName("New Rocket");
        setCurrentDesignId(null);
        setSelectedComponent(null);
    }, []);

    const duplicateRocket = useCallback(() => {
        const newId = RocketStorage.saveDesign(
            `${rocketName} (Copy)`,
            rocketComponents
        );
        setCurrentDesignId(newId);
        setRocketName(`${rocketName} (Copy)`);
        setSavedDesigns(RocketStorage.getAllDesigns());
    }, [rocketName, rocketComponents]);

    return (
        <div className="relative w-full h-screen bg-gray-600 overflow-hidden">
            {/* 3D Scene */}
            <Canvas
                camera={{ position: [5, 5, 10], fov: 45 }}
                gl={{
                    antialias: true,
                    powerPreference: "high-performance",
                    alpha: false,
                    stencil: false,
                    depth: true,
                }}
                dpr={[1, 2]}
                onCreated={({ gl }) => {
                    PerformanceManager.getInstance().setRenderer(gl);
                }}
            >
                {/* Background color */}
                <color attach="background" args={["#666666"]} />

                {/* Lighting */}
                <ambientLight intensity={ambientLightIntensity} />
                <directionalLight
                    position={[10, 10, 5]}
                    intensity={1}
                    color="#ffffff"
                    castShadow
                    shadow-mapSize-width={2048}
                    shadow-mapSize-height={2048}
                />
                <pointLight
                    position={[0, 10, 0]}
                    intensity={0.5}
                    color="#ffffff"
                />

                {/* Background */}
                {showStars && (
                    <Stars
                        radius={100}
                        depth={50}
                        count={5000}
                        factor={4}
                        saturation={0}
                        fade={true}
                    />
                )}

                {/* Grid for reference */}
                {showGrid && (
                    <Grid
                        position={[0, -2, 0]}
                        args={[20, 20]}
                        cellSize={1}
                        cellThickness={0.5}
                        cellColor="#444444"
                        sectionSize={5}
                        sectionThickness={1}
                        sectionColor="#666666"
                        fadeDistance={30}
                        fadeStrength={1}
                        infiniteGrid={false}
                    />
                )}

                {/* Camera controls - enabled when Shift is pressed or no object selected */}
                <OrbitControls
                    enablePan={true}
                    enableZoom={true}
                    enableRotate={
                        !isRocketActive &&
                        (isShiftPressed || !selectedComponent)
                    }
                    minDistance={2}
                    maxDistance={50}
                    enableDamping={true}
                    dampingFactor={0.05}
                    target={rocketPosition}
                />

                {/* Rocket */}
                <Suspense fallback={null}>
                    <Rocket
                        position={rocketPosition}
                        scale={rocketScale}
                        isActive={isRocketActive}
                        isHoverMode={rocketMode === "hover"}
                        onPositionChange={handleRocketPositionChange}
                        components={rocketComponents}
                        selectedComponentId={selectedComponent}
                        onComponentSelect={handleComponentSelect}
                        onComponentUpdate={handleComponentUpdate}
                    />
                </Suspense>

                {/* Transform Controls for selected component */}
                {selectedComponent &&
                    !isRocketActive &&
                    (() => {
                        const component = rocketComponents.find(
                            (c) => c.id === selectedComponent
                        );
                        if (!component) return null;

                        return (
                            <TransformControls
                                position={component.position}
                                rotation={component.rotation}
                                scale={component.scale}
                                onPositionChange={(newPosition) => {
                                    updateComponent(component.id, {
                                        position: newPosition,
                                    });
                                }}
                                onRotationChange={(newRotation) => {
                                    updateComponent(component.id, {
                                        rotation: newRotation,
                                    });
                                }}
                                onScaleChange={(newScale) => {
                                    updateComponent(component.id, {
                                        scale: newScale,
                                    });
                                }}
                                enabled={true}
                                mode={transformMode}
                                gridSize={gridSize}
                                snapToGrid={snapToGrid}
                                isShiftPressed={isShiftPressed}
                            />
                        );
                    })()}

                {/* Snap Grid Visualization */}
                {snapToGrid && (
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
                        <planeGeometry
                            args={[40, 40, 40 / gridSize, 40 / gridSize]}
                        />
                        <meshBasicMaterial
                            color="#444444"
                            wireframe
                            transparent
                            opacity={0.2}
                        />
                    </mesh>
                )}
            </Canvas>

            {/* Performance Monitor */}
            {showPerformance && performanceStats && (
                <div className="absolute top-4 right-4 z-30 bg-black bg-opacity-90 text-white p-3 rounded-lg text-xs font-mono">
                    <div className="mb-2 font-bold">Performance Stats</div>
                    <div>FPS: {performanceStats.fps}</div>
                    <div>
                        Frame Time: {performanceStats.frameTime.toFixed(1)}ms
                    </div>
                    <div>Draw Calls: {performanceStats.drawCalls}</div>
                    <div>
                        Triangles: {performanceStats.triangles.toLocaleString()}
                    </div>
                    <div>Textures: {performanceStats.textures}</div>
                    <div>
                        Memory: {performanceStats.memoryUsage.toFixed(1)}MB
                    </div>
                </div>
            )}

            {/* Rocket Info Panel - Remove duplicate */}
            {!isRocketActive && (
                <div className="absolute top-4 left-4 z-20 bg-black bg-opacity-90 text-white p-4 rounded-lg text-sm max-w-sm">
                    <div className="mb-3">
                        <h2 className="text-lg font-bold text-blue-400 mb-1">
                            Rocket Inspector
                        </h2>
                        <p className="text-xs text-gray-300">
                            View and test the rocket in a controlled environment
                        </p>
                    </div>

                    <div className="space-y-3">
                        {/* Position Info */}
                        <div>
                            <div className="text-xs font-semibold text-blue-300 mb-1">
                                Position:
                            </div>
                            <div className="text-xs text-gray-300">
                                X: {rocketPosition[0].toFixed(2)}
                                <br />
                                Y: {rocketPosition[1].toFixed(2)}
                                <br />
                                Z: {rocketPosition[2].toFixed(2)}
                            </div>
                        </div>

                        {/* Flight Mode */}
                        <div>
                            <div className="text-xs font-semibold text-blue-300 mb-1">
                                Flight Mode:
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() =>
                                        handleRocketModeChange("rocket")
                                    }
                                    className={`px-2 py-1 text-xs rounded ${
                                        rocketMode === "rocket"
                                            ? "bg-blue-600 text-white"
                                            : "bg-gray-700 text-gray-300"
                                    }`}
                                >
                                    Rocket Physics
                                </button>
                                <button
                                    onClick={() =>
                                        handleRocketModeChange("hover")
                                    }
                                    className={`px-2 py-1 text-xs rounded ${
                                        rocketMode === "hover"
                                            ? "bg-blue-600 text-white"
                                            : "bg-gray-700 text-gray-300"
                                    }`}
                                >
                                    Free Hover
                                </button>
                            </div>
                        </div>

                        {/* Controls */}
                        <div>
                            <div className="text-xs font-semibold text-blue-300 mb-1">
                                Controls:
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() =>
                                        handleRocketActiveToggle(
                                            !isRocketActive
                                        )
                                    }
                                    className={`px-3 py-1 text-xs rounded font-semibold ${
                                        isRocketActive
                                            ? "bg-red-600 text-white"
                                            : "bg-green-600 text-white"
                                    }`}
                                >
                                    {isRocketActive
                                        ? "Stop Flight"
                                        : "Start Flight"}
                                </button>
                                <button
                                    onClick={resetRocketPosition}
                                    className="px-3 py-1 text-xs rounded bg-gray-700 text-white hover:bg-gray-600"
                                >
                                    Reset Position
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Enhanced Component Builder Panel */}
            <div className="absolute top-4 left-4 z-20 bg-black bg-opacity-90 text-white p-4 rounded-lg text-sm max-w-sm max-h-[80vh] overflow-y-auto">
                <div className="mb-3">
                    <h2 className="text-lg font-bold text-blue-400 mb-1">
                        Rocket Builder
                    </h2>
                    <p className="text-xs text-gray-300">
                        Click engine nozzles to activate them. Unity-style
                        controls for precision editing.
                    </p>
                </div>

                {/* File Operations */}
                <div className="mb-4 p-3 bg-gray-800 rounded">
                    <h3 className="text-sm font-semibold text-green-400 mb-2">
                        File Operations
                    </h3>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <button
                            onClick={createNewRocket}
                            className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 rounded"
                        >
                            New
                        </button>
                        <button
                            onClick={() => setShowSaveDialog(true)}
                            className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded"
                        >
                            Save
                        </button>
                        <button
                            onClick={() => setShowLoadDialog(true)}
                            className="px-2 py-1 text-xs bg-purple-600 hover:bg-purple-700 rounded"
                        >
                            Load
                        </button>
                        <button
                            onClick={duplicateRocket}
                            className="px-2 py-1 text-xs bg-orange-600 hover:bg-orange-700 rounded"
                        >
                            Duplicate
                        </button>
                    </div>
                    <div className="text-xs text-gray-400">
                        Current: {rocketName}
                        {currentDesignId && (
                            <span className="text-green-400"> (Saved)</span>
                        )}
                    </div>
                </div>

                {/* Grid and Snap Controls */}
                {selectedComponent && !isRocketActive && (
                    <div className="mb-4 p-3 bg-purple-900 bg-opacity-50 rounded border border-purple-500">
                        <h3 className="text-sm font-semibold text-purple-300 mb-2">
                            Grid & Snapping
                        </h3>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs">
                                    Snap to Grid (G)
                                </span>
                                <ToggleControl
                                    label=""
                                    checked={snapToGrid}
                                    onChange={setSnapToGrid}
                                />
                            </div>
                            <div>
                                <label className="text-xs block mb-1">
                                    Grid Size: {gridSize.toFixed(1)}
                                </label>
                                <input
                                    type="range"
                                    min={0.1}
                                    max={2.0}
                                    step={0.1}
                                    value={gridSize}
                                    onChange={(e) =>
                                        setGridSize(parseFloat(e.target.value))
                                    }
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Transform Mode Selection */}
                {selectedComponent && !isRocketActive && (
                    <div className="mb-4 p-3 bg-blue-900 bg-opacity-50 rounded border border-blue-500">
                        <h3 className="text-sm font-semibold text-blue-300 mb-2">
                            Transform Mode
                        </h3>
                        <div className="grid grid-cols-3 gap-1 mb-2">
                            <button
                                onClick={() => setTransformMode("translate")}
                                className={`px-2 py-1 text-xs rounded ${
                                    transformMode === "translate"
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-700 text-gray-300"
                                }`}
                            >
                                Move (W)
                            </button>
                            <button
                                onClick={() => setTransformMode("rotate")}
                                className={`px-2 py-1 text-xs rounded ${
                                    transformMode === "rotate"
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-700 text-gray-300"
                                }`}
                            >
                                Rotate (E)
                            </button>
                            <button
                                onClick={() => setTransformMode("scale")}
                                className={`px-2 py-1 text-xs rounded ${
                                    transformMode === "scale"
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-700 text-gray-300"
                                }`}
                            >
                                Scale (R)
                            </button>
                        </div>
                        <div className="text-xs text-gray-300 space-y-1">
                            {transformMode === "translate" && (
                                <>
                                    <div>
                                        <span className="text-red-400">
                                            Red:
                                        </span>{" "}
                                        X-axis
                                    </div>
                                    <div>
                                        <span className="text-green-400">
                                            Green:
                                        </span>{" "}
                                        Y-axis
                                    </div>
                                    <div>
                                        <span className="text-blue-400">
                                            Blue:
                                        </span>{" "}
                                        Z-axis
                                    </div>
                                    <div>
                                        <span className="text-yellow-400">
                                            Yellow:
                                        </span>{" "}
                                        XY plane
                                    </div>
                                </>
                            )}
                            {transformMode === "rotate" && (
                                <>
                                    <div>
                                        <span className="text-red-400">
                                            Red ring:
                                        </span>{" "}
                                        X rotation
                                    </div>
                                    <div>
                                        <span className="text-green-400">
                                            Green ring:
                                        </span>{" "}
                                        Y rotation
                                    </div>
                                    <div>
                                        <span className="text-blue-400">
                                            Blue ring:
                                        </span>{" "}
                                        Z rotation
                                    </div>
                                </>
                            )}
                            {transformMode === "scale" && (
                                <div>
                                    <span className="text-yellow-400">
                                        Handles:
                                    </span>{" "}
                                    Uniform scale
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Rocket Stats */}
                <div className="mb-4 p-3 bg-gray-800 rounded">
                    <h3 className="text-sm font-semibold text-green-400 mb-2">
                        Rocket Stats
                    </h3>
                    <div className="text-xs space-y-1">
                        <div>Mass: {rocketStats.totalMass.toFixed(1)} tons</div>
                        <div>Thrust: {rocketStats.totalThrust} kN</div>
                        <div>Fuel: {rocketStats.totalFuel} units</div>
                        <div>
                            TWR:{" "}
                            {rocketStats.totalMass > 0
                                ? (
                                      rocketStats.totalThrust /
                                      rocketStats.totalMass
                                  ).toFixed(2)
                                : "N/A"}
                        </div>
                        <div>Cost: ${rocketStats.totalCost}</div>
                    </div>
                </div>

                {/* Add Components */}
                <div className="mb-4">
                    <h3 className="text-sm font-semibold text-blue-300 mb-2">
                        Add Components
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                        {Object.keys(COMPONENT_STATS).map((type) => (
                            <button
                                key={type}
                                onClick={() => addComponent(type)}
                                className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded"
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Enhanced Component List */}
                <div className="mb-4">
                    <h3 className="text-sm font-semibold text-blue-300 mb-2">
                        Components ({rocketComponents.length})
                    </h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                        {rocketComponents.map((component) => (
                            <div
                                key={component.id}
                                className={`p-2 rounded text-xs cursor-pointer transition-colors ${
                                    selectedComponent === component.id
                                        ? "bg-blue-600 border border-blue-400"
                                        : "bg-gray-700 hover:bg-gray-600"
                                }`}
                                onClick={() =>
                                    setSelectedComponent(component.id)
                                }
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <span className="font-medium">
                                            {component.type}
                                        </span>
                                        <div className="text-gray-400 text-xs">
                                            {component.position
                                                .map((p) => p.toFixed(1))
                                                .join(", ")}
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeComponent(component.id);
                                        }}
                                        className="text-red-400 hover:text-red-300 p-1"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Enhanced Component Editor */}
                {selectedComponent && (
                    <div className="mb-4 p-3 bg-gray-800 rounded">
                        <h3 className="text-sm font-semibold text-yellow-400 mb-2">
                            Component Properties
                        </h3>
                        {(() => {
                            const component = rocketComponents.find(
                                (c) => c.id === selectedComponent
                            );
                            if (!component) return null;

                            const isEngineNozzle =
                                component.type.includes("EngineNozzle");

                            return (
                                <div className="space-y-3">
                                    {/* Engine Nozzle Activation */}
                                    {isEngineNozzle && (
                                        <div>
                                            <label className="text-xs block mb-2 font-semibold text-orange-300">
                                                Engine Nozzle Control
                                            </label>
                                            <button
                                                onClick={() =>
                                                    updateComponent(
                                                        component.id,
                                                        {
                                                            isActive:
                                                                !component.isActive,
                                                        }
                                                    )
                                                }
                                                className={`w-full py-2 text-sm rounded font-semibold ${
                                                    component.isActive
                                                        ? "bg-red-600 hover:bg-red-700 text-white"
                                                        : "bg-green-600 hover:bg-green-700 text-white"
                                                }`}
                                            >
                                                {component.isActive
                                                    ? "Deactivate Engine"
                                                    : "Activate Engine"}
                                            </button>
                                        </div>
                                    )}

                                    <div>
                                        <label className="text-xs block mb-1">
                                            Color
                                        </label>
                                        <input
                                            type="color"
                                            value={component.color}
                                            onChange={(e) =>
                                                updateComponent(component.id, {
                                                    color: e.target.value,
                                                })
                                            }
                                            className="w-full h-6 rounded"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs block mb-1">
                                            Scale: {component.scale.toFixed(1)}
                                        </label>
                                        <input
                                            type="range"
                                            min={0.5}
                                            max={3}
                                            step={0.1}
                                            value={component.scale}
                                            onChange={(e) =>
                                                updateComponent(component.id, {
                                                    scale: parseFloat(
                                                        e.target.value
                                                    ),
                                                })
                                            }
                                            className="w-full"
                                        />
                                    </div>

                                    {/* Position Controls */}
                                    <div>
                                        <label className="text-xs block mb-2 font-semibold text-blue-300">
                                            Position
                                        </label>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div>
                                                <label className="text-xs block mb-1">
                                                    X:{" "}
                                                    {component.position[0].toFixed(
                                                        1
                                                    )}
                                                </label>
                                                <input
                                                    type="number"
                                                    step={0.1}
                                                    value={component.position[0].toFixed(
                                                        1
                                                    )}
                                                    onChange={(e) =>
                                                        updateComponent(
                                                            component.id,
                                                            {
                                                                position: [
                                                                    parseFloat(
                                                                        e.target
                                                                            .value
                                                                    ),
                                                                    component
                                                                        .position[1],
                                                                    component
                                                                        .position[2],
                                                                ],
                                                            }
                                                        )
                                                    }
                                                    className="w-full px-1 py-1 text-xs bg-gray-700 rounded"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs block mb-1">
                                                    Y:{" "}
                                                    {component.position[1].toFixed(
                                                        1
                                                    )}
                                                </label>
                                                <input
                                                    type="number"
                                                    step={0.1}
                                                    value={component.position[1].toFixed(
                                                        1
                                                    )}
                                                    onChange={(e) =>
                                                        updateComponent(
                                                            component.id,
                                                            {
                                                                position: [
                                                                    component
                                                                        .position[0],
                                                                    parseFloat(
                                                                        e.target
                                                                            .value
                                                                    ),
                                                                    component
                                                                        .position[2],
                                                                ],
                                                            }
                                                        )
                                                    }
                                                    className="w-full px-1 py-1 text-xs bg-gray-700 rounded"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs block mb-1">
                                                    Z:{" "}
                                                    {component.position[2].toFixed(
                                                        1
                                                    )}
                                                </label>
                                                <input
                                                    type="number"
                                                    step={0.1}
                                                    value={component.position[2].toFixed(
                                                        1
                                                    )}
                                                    onChange={(e) =>
                                                        updateComponent(
                                                            component.id,
                                                            {
                                                                position: [
                                                                    component
                                                                        .position[0],
                                                                    component
                                                                        .position[1],
                                                                    parseFloat(
                                                                        e.target
                                                                            .value
                                                                    ),
                                                                ],
                                                            }
                                                        )
                                                    }
                                                    className="w-full px-1 py-1 text-xs bg-gray-700 rounded"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Rotation Controls */}
                                    <div>
                                        <label className="text-xs block mb-2 font-semibold text-green-300">
                                            Rotation (degrees)
                                        </label>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div>
                                                <label className="text-xs block mb-1">
                                                    X:{" "}
                                                    {(
                                                        (component.rotation[0] *
                                                            180) /
                                                        Math.PI
                                                    ).toFixed(1)}
                                                    °
                                                </label>
                                                <input
                                                    type="number"
                                                    step={1}
                                                    value={Math.round(
                                                        (component.rotation[0] *
                                                            180) /
                                                            Math.PI
                                                    )}
                                                    onChange={(e) =>
                                                        updateComponent(
                                                            component.id,
                                                            {
                                                                rotation: [
                                                                    (parseFloat(
                                                                        e.target
                                                                            .value
                                                                    ) *
                                                                        Math.PI) /
                                                                        180,
                                                                    component
                                                                        .rotation[1],
                                                                    component
                                                                        .rotation[2],
                                                                ],
                                                            }
                                                        )
                                                    }
                                                    className="w-full px-1 py-1 text-xs bg-gray-700 rounded"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs block mb-1">
                                                    Y:{" "}
                                                    {(
                                                        (component.rotation[1] *
                                                            180) /
                                                        Math.PI
                                                    ).toFixed(1)}
                                                    °
                                                </label>
                                                <input
                                                    type="number"
                                                    step={1}
                                                    value={Math.round(
                                                        (component.rotation[1] *
                                                            180) /
                                                            Math.PI
                                                    )}
                                                    onChange={(e) =>
                                                        updateComponent(
                                                            component.id,
                                                            {
                                                                rotation: [
                                                                    component
                                                                        .rotation[0],
                                                                    (parseFloat(
                                                                        e.target
                                                                            .value
                                                                    ) *
                                                                        Math.PI) /
                                                                        180,
                                                                    component
                                                                        .rotation[2],
                                                                ],
                                                            }
                                                        )
                                                    }
                                                    className="w-full px-1 py-1 text-xs bg-gray-700 rounded"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs block mb-1">
                                                    Z:{" "}
                                                    {(
                                                        (component.rotation[2] *
                                                            180) /
                                                        Math.PI
                                                    ).toFixed(1)}
                                                    °
                                                </label>
                                                <input
                                                    type="number"
                                                    step={1}
                                                    value={Math.round(
                                                        (component.rotation[2] *
                                                            180) /
                                                            Math.PI
                                                    )}
                                                    onChange={(e) =>
                                                        updateComponent(
                                                            component.id,
                                                            {
                                                                rotation: [
                                                                    component
                                                                        .rotation[0],
                                                                    component
                                                                        .rotation[1],
                                                                    (parseFloat(
                                                                        e.target
                                                                            .value
                                                                    ) *
                                                                        Math.PI) /
                                                                        180,
                                                                ],
                                                            }
                                                        )
                                                    }
                                                    className="w-full px-1 py-1 text-xs bg-gray-700 rounded"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() =>
                                            setSelectedComponent(null)
                                        }
                                        className="w-full py-1 text-xs bg-gray-600 hover:bg-gray-500 rounded"
                                    >
                                        Deselect Component
                                    </button>
                                </div>
                            );
                        })()}
                    </div>
                )}

                {/* Flight Controls */}
                {isRocketActive && (
                    <div className="border-t border-gray-600 pt-2">
                        <div className="text-xs font-semibold text-blue-300 mb-1">
                            Flight Controls:
                        </div>
                        <div className="text-xs text-gray-300 space-y-1">
                            <div>
                                <strong>Movement:</strong> WASD + Space/Shift
                            </div>
                            <div>
                                <strong>Rotation:</strong> Arrow Keys + Q/E
                            </div>
                            <div className="text-yellow-400">
                                Camera follows rocket when active
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Save Dialog */}
            {showSaveDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                    <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-white mb-4">
                            Save Rocket Design
                        </h3>
                        <input
                            type="text"
                            value={rocketName}
                            onChange={(e) => setRocketName(e.target.value)}
                            placeholder="Rocket name..."
                            className="w-full p-2 mb-4 bg-gray-700 text-white rounded"
                        />
                        <div className="flex space-x-2">
                            <button
                                onClick={saveRocketDesign}
                                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                            >
                                Save
                            </button>
                            <button
                                onClick={() => setShowSaveDialog(false)}
                                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Load Dialog */}
            {showLoadDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                    <div className="bg-gray-800 p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                        <h3 className="text-lg font-semibold text-white mb-4">
                            Load Rocket Design
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {savedDesigns.map((design) => (
                                <div
                                    key={design.id}
                                    className="p-4 bg-gray-700 rounded cursor-pointer hover:bg-gray-600"
                                    onClick={() => loadRocketDesign(design.id)}
                                >
                                    <div className="font-medium text-white">
                                        {design.name}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        {design.components.length} components
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        Modified:{" "}
                                        {new Date(
                                            design.lastModified
                                        ).toLocaleDateString()}
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            RocketStorage.deleteDesign(
                                                design.id
                                            );
                                            setSavedDesigns(
                                                RocketStorage.getAllDesigns()
                                            );
                                        }}
                                        className="mt-2 px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded"
                                    >
                                        Delete
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setShowLoadDialog(false)}
                                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Enhanced Keyboard shortcuts */}
            {selectedComponent && !isRocketActive && (
                <div className="absolute bottom-4 right-4 z-20 bg-black bg-opacity-90 text-white p-3 rounded-lg text-xs">
                    <div className="font-semibold mb-1">
                        Keyboard Shortcuts:
                    </div>
                    <div>W - Move mode</div>
                    <div>E - Rotate mode</div>
                    <div>R - Scale mode</div>
                    <div>G - Toggle grid snap</div>
                    <div className="text-yellow-400">
                        Hold Shift - Free camera
                    </div>
                    <div className="border-t border-gray-600 mt-2 pt-2">
                        <div className="font-semibold mb-1 text-green-300">
                            Arrow Key Controls:
                        </div>
                        {transformMode === "translate" && (
                            <>
                                <div>↑↓ - Move Y axis</div>
                                <div>←→ - Move X axis</div>
                                <div>PgUp/PgDn - Move Z axis</div>
                            </>
                        )}
                        {transformMode === "rotate" && (
                            <>
                                <div>↑↓ - Rotate X axis</div>
                                <div>←→ - Rotate Y axis</div>
                                <div>PgUp/PgDn - Rotate Z axis</div>
                            </>
                        )}
                        {transformMode === "scale" && (
                            <>
                                <div>↑ - Scale up</div>
                                <div>↓ - Scale down</div>
                            </>
                        )}
                        <div className="text-cyan-300 mt-1">
                            Hold Shift for larger steps
                        </div>
                    </div>
                    <div className="border-t border-gray-600 mt-2 pt-2">
                        <div>Ctrl+S - Save</div>
                        <div>Ctrl+O - Load</div>
                    </div>
                </div>
            )}

            {/* Settings Panel */}
            <div className="absolute bottom-4 left-4 z-20 bg-black bg-opacity-90 text-white p-4 rounded-lg text-sm">
                <div className="mb-2">
                    <h3 className="text-sm font-semibold text-blue-300">
                        Environment Settings
                    </h3>
                </div>

                <div className="space-y-3">
                    {/* Scale Control */}
                    <div>
                        <label className="text-xs font-medium mb-1 block">
                            Rocket Scale: {rocketScale.toFixed(1)}
                        </label>
                        <input
                            type="range"
                            min={0.1}
                            max={5}
                            step={0.1}
                            value={rocketScale}
                            onChange={(e) =>
                                setRocketScale(parseFloat(e.target.value))
                            }
                            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    {/* Lighting Control */}
                    <div>
                        <label className="text-xs font-medium mb-1 block">
                            Ambient Light: {ambientLightIntensity.toFixed(1)}
                        </label>
                        <input
                            type="range"
                            min={0}
                            max={2}
                            step={0.1}
                            value={ambientLightIntensity}
                            onChange={(e) =>
                                setAmbientLightIntensity(
                                    parseFloat(e.target.value)
                                )
                            }
                            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    {/* Toggle Controls */}
                    <div className="space-y-2">
                        <ToggleControl
                            label="Grid"
                            checked={showGrid}
                            onChange={setShowGrid}
                        />
                        <ToggleControl
                            label="Stars"
                            checked={showStars}
                            onChange={setShowStars}
                        />
                        <ToggleControl
                            label="Performance Stats"
                            checked={showPerformance}
                            onChange={setShowPerformance}
                        />
                    </div>
                </div>
            </div>

            {/* Back to Solar System */}
            <div className="absolute top-4 right-4 z-20">
                <a
                    href="/"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                    Back to Solar System
                </a>
            </div>
        </div>
    );
}

function ToggleControl({
    label,
    checked,
    onChange,
    disabled = false,
}: {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
}) {
    return (
        <label
            className={`flex items-center justify-between cursor-pointer group ${
                disabled ? "opacity-50" : ""
            }`}
        >
            <span
                className={`text-xs font-medium ${
                    disabled ? "" : "group-hover:text-blue-300"
                } transition-colors`}
            >
                {label}
            </span>
            <div className="relative">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => !disabled && onChange(e.target.checked)}
                    disabled={disabled}
                    className="sr-only peer"
                />
                <div
                    className={`w-7 h-4 ${
                        disabled ? "bg-gray-700" : "bg-gray-600"
                    } peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600`}
                ></div>
            </div>
        </label>
    );
}
