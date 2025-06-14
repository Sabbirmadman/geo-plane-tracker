import { useState, useCallback } from "react";
import { Scene } from "../components/Scene/Scene";
import { FlightDetails } from "../components/FlightTracker/FlightDetails";
import { FlightData } from "../utils/flightData";

export default function EarthView() {
    const [isNightTexture, setIsNightTexture] = useState(false);
    const [showClouds, setShowClouds] = useState(true);
    const [showStars, setShowStars] = useState(true);
    const [brightness, setBrightness] = useState(1);
    const [ambientLightIntensity, setAmbientLightIntensity] = useState(0.2);
    const [directionalLightIntensity, setDirectionalLightIntensity] =
        useState(1);
    const [borderThickness, setBorderThickness] = useState(1.5);
    const [showBorders, setShowBorders] = useState(true);
    const [earthQuality, setEarthQuality] = useState(64);
    const [isControlsExpanded, setIsControlsExpanded] = useState(true);
    const [showFlightPaths, setShowFlightPaths] = useState(true); // Default to true
    const [maxFlights, setMaxFlights] = useState(50);
    const [flightUpdateInterval, setFlightUpdateInterval] = useState(60); // Increased to 60 seconds
    const [borderOnlyMode, setBorderOnlyMode] = useState(false);
    const [selectedFlightData, setSelectedFlightData] =
        useState<FlightData | null>(null);
    const [airplaneScale, setAirplaneScale] = useState(2); // Start with 2x default scale
    const [borderColor, setBorderColor] = useState("#00ff88");

    // Memoized handlers to prevent unnecessary re-renders
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
    const handleFlightPathsToggle = useCallback(
        (checked: boolean) => setShowFlightPaths(checked),
        []
    );
    const handleBorderOnlyToggle = useCallback((checked: boolean) => {
        setBorderOnlyMode(checked);
        if (checked) {
            setShowBorders(true);
            setShowClouds(false);
        }
    }, []);
    const handleFlightSelect = useCallback((flight: FlightData | null) => {
        setSelectedFlightData(flight);
    }, []);
    const handleCloseFlightDetails = useCallback(() => {
        setSelectedFlightData(null);
    }, []);

    return (
        <div className="relative w-full h-screen bg-black overflow-hidden">
            {/* 3D Scene */}
            <Scene
                isNightTexture={isNightTexture}
                showClouds={showClouds}
                showStars={showStars}
                brightness={brightness}
                ambientLightIntensity={ambientLightIntensity}
                directionalLightIntensity={directionalLightIntensity}
                borderThickness={borderThickness}
                showBorders={showBorders}
                earthQuality={earthQuality}
                showFlights={true} // Always true
                showFlightPaths={showFlightPaths}
                maxFlights={maxFlights}
                flightUpdateInterval={flightUpdateInterval * 1000}
                borderOnlyMode={borderOnlyMode}
                onFlightSelect={handleFlightSelect}
                borderColor={borderColor}
                airplaneScale={airplaneScale}
            />

            {/* Flight Details Panel */}
            <FlightDetails
                flight={selectedFlightData}
                onClose={handleCloseFlightDetails}
            />

            {/* Flight Status Indicator - Updated with rate limiting info */}
            <div className="absolute top-4 left-4 z-20">
                <div className="bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-sm">
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span>Live Flight Tracking</span>
                    </div>
                    <div className="text-xs text-gray-300 mt-1">
                        Updates every {flightUpdateInterval}s • API Rate Limited
                    </div>
                </div>
            </div>

            {/* Model Status Indicator - Updated */}
            <div className="absolute top-16 left-4 z-20">
                <div className="bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-xs">
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span>3D Boeing 747 Models (Dynamic Scaling)</span>
                    </div>
                </div>
            </div>

            {/* Zoom Hint */}
            <div className="absolute top-4 right-4 z-20">
                <div className="bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-xs">
                    Scroll to zoom • Drag to rotate
                </div>
            </div>

            {/* Expand/Collapse Button */}
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

            {/* Controls Panel */}
            <div
                className={`absolute bottom-0 left-0 right-0 z-10 text-white bg-gray-900 bg-opacity-95 backdrop-blur-sm border-t border-gray-600 transition-transform duration-300 ${
                    isControlsExpanded ? "translate-y-0" : "translate-y-full"
                }`}
            >
                <div className="max-w-7xl mx-auto p-4">
                    {/* Header */}
                    <div className="text-center mb-4">
                        <h1 className="text-xl font-bold text-blue-400">
                            3D Earth Explorer with Live Flight Tracking
                        </h1>
                        <p className="text-sm opacity-75">
                            Mouse: Rotate • Wheel: Zoom • Right-click: Pan •
                            Click flights for details
                        </p>
                        <p className="text-xs text-green-400 mt-1">
                            ✈️ Live flight tracking with intelligent rate
                            limiting and caching
                        </p>
                    </div>

                    {/* Main Controls Grid */}
                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                        {/* Visual Controls */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-blue-300 border-b border-gray-600 pb-1">
                                Visual Settings
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
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

                            {/* Border Color Picker */}
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

                        {/* Lighting Controls */}
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
                                    value={directionalLightIntensity}
                                    min={0}
                                    max={3}
                                    step={0.1}
                                    onChange={setDirectionalLightIntensity}
                                />
                            </div>
                        </div>

                        {/* Performance Controls */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-blue-300 border-b border-gray-600 pb-1">
                                Performance
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

                                {/* Airplane Scale Slider - Better range for tiny scales */}
                                <div className="space-y-1">
                                    <SliderControl
                                        label="Airplane Size"
                                        value={airplaneScale}
                                        min={0.5}
                                        max={10}
                                        step={0.5}
                                        onChange={setAirplaneScale}
                                    />
                                    <p className="text-xs text-gray-400">
                                        Auto-scales with zoom level (GLTF models
                                        are tiny)
                                    </p>
                                </div>

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

                        {/* Flight Controls - Updated info */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-blue-300 border-b border-gray-600 pb-1">
                                Flight Tracking
                            </h3>
                            <div className="space-y-2">
                                {/* Flight tracking status - read-only */}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">
                                        Live Flights
                                    </span>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                        <span className="text-xs text-green-400">
                                            Always On
                                        </span>
                                    </div>
                                </div>

                                <ToggleControl
                                    label="Flight Trails"
                                    checked={showFlightPaths}
                                    onChange={handleFlightPathsToggle}
                                />
                                <SliderControl
                                    label="Max Flights"
                                    value={maxFlights}
                                    min={10}
                                    max={100}
                                    step={10}
                                    onChange={setMaxFlights}
                                />
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium">
                                        Update (sec):
                                    </label>
                                    <select
                                        value={flightUpdateInterval}
                                        onChange={(e) =>
                                            setFlightUpdateInterval(
                                                Number(e.target.value)
                                            )
                                        }
                                        className="bg-gray-700 text-white text-sm px-2 py-1 rounded border border-gray-600"
                                    >
                                        <option value={30}>30s</option>
                                        <option value={60}>
                                            60s (Recommended)
                                        </option>
                                        <option value={120}>2min</option>
                                        <option value={300}>5min</option>
                                    </select>
                                </div>

                                {/* API Status - Updated */}
                                <div className="pt-2 border-t border-gray-700">
                                    <div className="text-xs text-gray-400">
                                        <p>✈️ 3D Boeing 747 GLTF Models</p>
                                        <p>📏 Micro-scale with zoom scaling</p>
                                        <p>🔍 Larger when zoomed out</p>
                                        <p>🔎 Smaller when zoomed in</p>
                                        <p>🔄 Smart caching (15s)</p>
                                        <p>
                                            ⏱️ Rate limiting (10s min interval)
                                        </p>
                                        <p>📡 OpenSky Network API</p>
                                        <p className="text-yellow-400">
                                            ⚠️ Limited to 400 requests/hour
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Reusable Toggle Component
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

// Reusable Slider Component
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
