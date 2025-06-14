import { useState, useEffect, useRef } from "react";
import { FlightData, FlightDataService } from "../../utils/flightData";
import { Airplane } from "./Airplane";
import { FlightPath } from "./FlightPath";

interface FlightTrackerProps {
    showFlights: boolean;
    showFlightPaths: boolean;
    maxFlights: number;
    updateInterval: number;
    onFlightSelect?: (flight: FlightData | null) => void;
    airplaneScale?: number;
}

export function FlightTracker({
    showFlights,
    showFlightPaths,
    maxFlights = 50,
    updateInterval = 60000, // Default to 60 seconds
    onFlightSelect,
    airplaneScale = 1,
}: FlightTrackerProps) {
    const [flights, setFlights] = useState<FlightData[]>([]);
    const [selectedFlight, setSelectedFlight] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const intervalRef = useRef<number | null>(null);
    const flightService = FlightDataService.getInstance();

    const fetchFlights = async () => {
        if (!showFlights) return;

        setLoading(true);
        try {
            // Get rate limiting status
            const rateLimitStatus = flightService.getRateLimitStatus();
            console.log("Rate limit status:", rateLimitStatus);

            // Fetch flights with rate limiting
            const flightData = await flightService.fetchLiveFlights();
            console.log(
                `Received ${flightData.length} total flights from service`
            );

            // Filter for active flights with valid data - more permissive filtering
            const validFlights = flightData
                .filter(
                    (flight) =>
                        flight.velocity > 30 && // Lower minimum velocity
                        flight.altitude > 500 && // Lower minimum altitude
                        flight.callsign !== "Unknown" &&
                        flight.latitude >= -90 &&
                        flight.latitude <= 90 &&
                        flight.longitude >= -180 &&
                        flight.longitude <= 180
                )
                .slice(0, maxFlights);

            setFlights(validFlights);

            const statusMsg = rateLimitStatus.isUsingCache
                ? `Using cached data (${rateLimitStatus.cacheAge}s old) - ${validFlights.length} flights`
                : `Fresh data from API - ${validFlights.length} flights`;

            console.log(statusMsg);
        } catch (error) {
            console.error("Error fetching flights:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (showFlights) {
            fetchFlights();
            // Ensure minimum 30 second interval to respect rate limits
            const safeInterval = Math.max(updateInterval, 30000);
            intervalRef.current = window.setInterval(
                fetchFlights,
                safeInterval
            ); // Use window.setInterval

            if (safeInterval !== updateInterval) {
                console.log(
                    `Interval adjusted from ${updateInterval / 1000}s to ${
                        safeInterval / 1000
                    }s for rate limiting`
                );
            }
        } else {
            if (intervalRef.current) {
                window.clearInterval(intervalRef.current); // Use window.clearInterval
            }
        }

        return () => {
            if (intervalRef.current) {
                window.clearInterval(intervalRef.current); // Use window.clearInterval
            }
        };
    }, [showFlights, maxFlights, updateInterval]);

    const handleFlightClick = async (flight: FlightData) => {
        if (selectedFlight === flight.icao24) {
            setSelectedFlight(null);
            onFlightSelect?.(null);
            return;
        }

        setSelectedFlight(flight.icao24);
        onFlightSelect?.(flight);

        if (showFlightPaths) {
            const endTime = Math.floor(Date.now() / 1000);
            const beginTime = endTime - 7200; // Last 2 hours
            await flightService.fetchFlightPath(flight.icao24, beginTime);
        }
    };

    if (!showFlights) return null;

    // Don't render anything if loading and no flights yet
    if (loading && flights.length === 0) return null;

    return (
        <group>
            {/* Flight trails for all flights */}
            {showFlightPaths &&
                flights.map((flight) => (
                    <FlightPath
                        key={`trail-${flight.icao24}`}
                        icao24={flight.icao24}
                        showTrail={true}
                    />
                ))}

            {/* Individual airplanes with dynamic scaling */}
            {flights.map((flight) => (
                <Airplane
                    key={flight.icao24}
                    flight={flight}
                    isSelected={selectedFlight === flight.icao24}
                    onClick={() => handleFlightClick(flight)}
                    scaleMultiplier={airplaneScale}
                />
            ))}

            {/* Extended path for selected flight */}
            {showFlightPaths && selectedFlight && (
                <FlightPath icao24={selectedFlight} showTrail={false} />
            )}
        </group>
    );
}
