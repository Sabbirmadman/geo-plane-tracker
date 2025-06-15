import { useState, useCallback } from "react";
import { Scene } from "../components/Scene/Scene";

export default function EarthView() {
    const [isNightTexture, setIsNightTexture] = useState(false);
    const [showClouds, setShowClouds] = useState(true);
    const [showStars, setShowStars] = useState(true);
    const [brightness, setBrightness] = useState(1);
    const [ambientLightIntensity, setAmbientLightIntensity] = useState(0.1);
    const [borderThickness, setBorderThickness] = useState(1.5);
    const [showBorders, setShowBorders] = useState(true);
    const [earthQuality, setEarthQuality] = useState(64);
    const [isControlsExpanded, setIsControlsExpanded] = useState(true);
    const [borderOnlyMode, setBorderOnlyMode] = useState(false);
    const [borderColor, setBorderColor] = useState("#00ff88");
    const [showOrbitLines, setShowOrbitLines] = useState(true);
    const [selectedObject, setSelectedObject] = useState<string>("");
    const [sunIntensity, setSunIntensity] = useState(1.5); // Add sun intensity state

    const handlePlanetClick = useCallback(
        (position: [number, number, number]) => {
            // Determine which object was clicked based on position
            const distance = Math.sqrt(position[0] ** 2 + position[2] ** 2);

            if (position[0] === 0 && position[1] === 0 && position[2] === 0) {
                setSelectedObject("Sun");
            } else if (Math.abs(distance - 15) < 2) {
                setSelectedObject("Mercury");
            } else if (Math.abs(distance - 22) < 3) {
                setSelectedObject("Venus");
            } else if (Math.abs(distance - 30) < 5) {
                setSelectedObject("Earth or Moon");
            } else if (Math.abs(distance - 45) < 3) {
                setSelectedObject("Mars");
            } else if (Math.abs(distance - 70) < 8) {
                setSelectedObject("Jupiter");
            } else if (Math.abs(distance - 100) < 8) {
                setSelectedObject("Saturn");
            } else {
                setSelectedObject("Unknown Object");
            }
            console.log("Object clicked, camera following to:", position);
        },
        []
    );

    const handleTextureToggle = useCallback(
        (checked: boolean) => setIsNightTexture(checked),
        []
    );
    const handleCloudsToggle = useCallback(
        (checked: boolean) => setShowClouds(checked),
        []
    );
    const handleStarsToggle = useCallback(
        (checked: boolean) => setShowStars(checked),
        []
    );
    const handleBordersToggle = useCallback(
        (checked: boolean) => setShowBorders(checked),
        []
    );
    const handleBorderOnlyToggle = useCallback((checked: boolean) => {
        setBorderOnlyMode(checked);
        if (checked) {
            setShowBorders(true);
            setShowClouds(false);
        }
    }, []);

    return (
        <div className="relative w-full h-screen bg-black overflow-hidden">
            <Scene
                isNightTexture={isNightTexture}
                showClouds={showClouds}
                showStars={showStars}
                brightness={brightness}
                ambientLightIntensity={ambientLightIntensity}
                borderThickness={borderThickness}
                showBorders={showBorders}
                earthQuality={earthQuality}
                borderOnlyMode={borderOnlyMode}
                borderColor={borderColor}
                showOrbitLines={showOrbitLines}
                sunIntensity={sunIntensity}
                onPlanetClick={handlePlanetClick}
            />

            {selectedObject && (
                <div className="absolute top-4 left-4 z-20">
                    <div className="bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-sm">
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                            <span>Following: {selectedObject}</span>
                        </div>
                        <div className="text-xs text-gray-300 mt-1">
                            Realistic orbital mechanics • 1h = 24h Earth time
                        </div>
                    </div>
                </div>
            )}

            <div className="absolute top-4 right-4 z-20">
                <div className="bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-xs">
                    Click celestial bodies to follow • Realistic time scale
                </div>
            </div>

            <button
                onClick={() => setIsControlsExpanded(!isControlsExpanded)}
                className="absolute bottom-4 right-4 z-20 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-200"
                aria-label={
                    isControlsExpanded ? "Collapse controls" : "Expand controls"
                }
            >
                <svg
                    className={`w-5 h-5 transition-transform duration-200 ${
                        isControlsExpanded ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 15l7-7 7 7"
                    />
                </svg>
            </button>

            <div
                className={`absolute bottom-0 left-0 right-0 z-10 text-white bg-gray-900 bg-opacity-95 backdrop-blur-sm border-t border-gray-600 transition-transform duration-300 ${
                    isControlsExpanded ? "translate-y-0" : "translate-y-full"
                }`}
            >
                <div className="max-w-7xl mx-auto p-4">
                    <div className="text-center mb-4">
                        <h1 className="text-xl font-bold text-blue-400">
                            3D Solar System Explorer
                        </h1>
                        <p className="text-sm opacity-75">
                            Realistic orbital mechanics • 1 hour = 24 hours
                            Earth time
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-blue-300 border-b border-gray-600 pb-1">
                                Visual Settings
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <ToggleControl
                                    label="Orbit Lines"
                                    checked={showOrbitLines}
                                    onChange={setShowOrbitLines}
                                />
                                <ToggleControl
                                    label="Border Only"
                                    checked={borderOnlyMode}
                                    onChange={handleBorderOnlyToggle}
                                />
                                <ToggleControl
                                    label={isNightTexture ? "Night" : "Day"}
                                    checked={isNightTexture}
                                    onChange={handleTextureToggle}
                                    disabled={borderOnlyMode}
                                />
                                <ToggleControl
                                    label="Clouds"
                                    checked={showClouds}
                                    onChange={handleCloudsToggle}
                                    disabled={borderOnlyMode}
                                />
                                <ToggleControl
                                    label="Stars"
                                    checked={showStars}
                                    onChange={handleStarsToggle}
                                />
                                <ToggleControl
                                    label="Borders"
                                    checked={showBorders}
                                    onChange={handleBordersToggle}
                                    disabled={borderOnlyMode}
                                />
                            </div>

                            <div className="pt-2">
                                <label className="text-sm font-medium mb-2 block">
                                    Border Color:
                                </label>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="color"
                                        value={borderColor}
                                        onChange={(e) =>
                                            setBorderColor(e.target.value)
                                        }
                                        className="w-8 h-8 rounded border border-gray-600 bg-gray-700 cursor-pointer"
                                    />
                                    <span className="text-xs text-gray-300">
                                        {borderColor}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-blue-300 border-b border-gray-600 pb-1">
                                Lighting
                            </h3>
                            <div className="space-y-2">
                                <SliderControl
                                    label="Brightness"
                                    value={brightness}
                                    min={0.1}
                                    max={2}
                                    step={0.1}
                                    onChange={setBrightness}
                                />
                                <SliderControl
                                    label="Ambient"
                                    value={ambientLightIntensity}
                                    min={0}
                                    max={1}
                                    step={0.1}
                                    onChange={setAmbientLightIntensity}
                                />
                                <SliderControl
                                    label="Sun"
                                    value={sunIntensity}
                                    min={0}
                                    max={3}
                                    step={0.1}
                                    onChange={setSunIntensity}
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-blue-300 border-b border-gray-600 pb-1">
                                Quality & Effects
                            </h3>
                            <div className="space-y-2">
                                <SliderControl
                                    label="Border Width"
                                    value={borderThickness}
                                    min={0.5}
                                    max={5}
                                    step={0.1}
                                    onChange={setBorderThickness}
                                />

                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium">
                                        Quality:
                                    </label>
                                    <select
                                        value={earthQuality}
                                        onChange={(e) =>
                                            setEarthQuality(
                                                Number(e.target.value)
                                            )
                                        }
                                        className="bg-gray-700 text-white text-sm px-2 py-1 rounded border border-gray-600"
                                    >
                                        <option value={32}>Low (32)</option>
                                        <option value={64}>Medium (64)</option>
                                        <option value={128}>High (128)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
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
                className={`text-sm font-medium ${
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
                    className={`w-9 h-5 ${
                        disabled ? "bg-gray-700" : "bg-gray-600"
                    } peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600`}
                ></div>
            </div>
        </label>
    );
}

function SliderControl({
    label,
    value,
    min,
    max,
    step,
    onChange,
}: {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (value: number) => void;
}) {
    return (
        <div className="flex items-center justify-between">
            <label className="text-sm font-medium">{label}:</label>
            <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-300 w-8 text-right">
                    {value.toFixed(1)}
                </span>
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(parseFloat(e.target.value))}
                    className="w-16 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                />
            </div>
        </div>
    );
}
