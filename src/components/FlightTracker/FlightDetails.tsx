import { FlightData } from "../../utils/flightData";

interface FlightDetailsProps {
    flight: FlightData | null;
    onClose: () => void;
}

export function FlightDetails({ flight, onClose }: FlightDetailsProps) {
    if (!flight) return null;

    const getVelocityInKnots = (velocity: number) => {
        return Math.round(velocity * 1.944); // Convert m/s to knots
    };

    const getAltitudeInFeet = (altitude: number) => {
        return Math.round(altitude * 3.281); // Convert meters to feet
    };

    const getCardinalDirection = (heading: number) => {
        const directions = [
            "N",
            "NNE",
            "NE",
            "ENE",
            "E",
            "ESE",
            "SE",
            "SSE",
            "S",
            "SSW",
            "SW",
            "WSW",
            "W",
            "WNW",
            "NW",
            "NNW",
        ];
        const index = Math.round(heading / 22.5) % 16;
        return directions[index];
    };

    return (
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-30 w-80 bg-gray-900 bg-opacity-95 backdrop-blur-sm rounded-lg border border-gray-600 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-600">
                <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                    <h2 className="text-lg font-bold text-blue-400">
                        Flight Details
                    </h2>
                </div>
                <button
                    onClick={onClose}
                    className="text-white hover:text-white transition-colors"
                    aria-label="Close flight details"
                >
                    <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
            </div>

            {/* Flight Info */}
            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                {/* Main Info */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-white uppercase tracking-wide">
                            Callsign
                        </label>
                        <p className="text-lg font-semibold text-white">
                            {flight.callsign}
                        </p>
                    </div>
                    <div>
                        <label className="text-xs text-white uppercase tracking-wide">
                            ICAO24
                        </label>
                        <p className="text-sm text-white font-mono">
                            {flight.icao24}
                        </p>
                    </div>
                </div>

                {/* Flight Data */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-white uppercase tracking-wide">
                            Altitude
                        </label>
                        <p className="text-sm text-white">
                            {getAltitudeInFeet(
                                flight.altitude
                            ).toLocaleString()}{" "}
                            ft
                        </p>
                    </div>
                    <div>
                        <label className="text-xs text-white uppercase tracking-wide">
                            Speed
                        </label>
                        <p className="text-sm text-white">
                            {getVelocityInKnots(flight.velocity)} kts
                        </p>
                    </div>
                </div>

                {/* Position */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-white uppercase tracking-wide">
                            Latitude
                        </label>
                        <p className="text-sm text-white font-mono">
                            {flight.latitude.toFixed(4)}°
                        </p>
                    </div>
                    <div>
                        <label className="text-xs text-white uppercase tracking-wide">
                            Longitude
                        </label>
                        <p className="text-sm text-white font-mono">
                            {flight.longitude.toFixed(4)}°
                        </p>
                    </div>
                </div>

                {/* Navigation */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-white uppercase tracking-wide">
                            Heading
                        </label>
                        <p className="text-sm text-white">
                            {Math.round(flight.heading)}° (
                            {getCardinalDirection(flight.heading)})
                        </p>
                    </div>
                    <div>
                        <label className="text-xs text-white uppercase tracking-wide">
                            Origin
                        </label>
                        <p className="text-sm text-white">
                            {flight.originCountry}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
