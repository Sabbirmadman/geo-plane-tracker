import { useMemo } from "react";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import { FlightDataService } from "../../utils/flightData";

interface FlightPathProps {
    icao24: string;
    showTrail?: boolean;
}

export function FlightPath({ icao24, showTrail = true }: FlightPathProps) {
    const flightService = FlightDataService.getInstance();

    const pathData = useMemo(() => {
        // Get stored flight path (historical)
        const historicalPath = flightService.getStoredFlightPath(icao24);
        // Get real-time trail
        const trail = flightService.getFlightTrail(icao24);

        const points: THREE.Vector3[] = [];
        const colors: number[] = [];

        // Add historical path first (if available)
        if (historicalPath && historicalPath.points.length > 0) {
            historicalPath.points.forEach((point, index) => {
                const coords = FlightDataService.coordsToSphere(
                    point.longitude,
                    point.latitude,
                    point.altitude
                );
                points.push(new THREE.Vector3(...coords));

                // Historical path in blue tones
                const ratio = index / (historicalPath.points.length - 1);
                colors.push(
                    0.2, // red
                    0.4 + ratio * 0.4, // green
                    0.8 + ratio * 0.2 // blue
                );
            });
        }

        // Add real-time trail
        if (showTrail && trail.length > 1) {
            trail.forEach((point, index) => {
                const coords = FlightDataService.coordsToSphere(
                    point.longitude,
                    point.latitude,
                    point.altitude
                );
                points.push(new THREE.Vector3(...coords));

                // Trail in orange to yellow gradient
                const ratio = index / (trail.length - 1);
                colors.push(
                    1.0, // red
                    0.5 + ratio * 0.5, // green
                    0.0 // blue
                );
            });
        }

        return { points, colors };
    }, [icao24, flightService, showTrail]);

    const trailData = useMemo(() => {
        if (!showTrail) return { points: [], colors: [] };

        const trail = flightService.getFlightTrail(icao24);
        if (trail.length < 2) return { points: [], colors: [] };

        const points: THREE.Vector3[] = [];
        const colors: number[] = [];

        trail.forEach((point) => {
            const coords = FlightDataService.coordsToSphere(
                point.longitude,
                point.latitude,
                point.altitude
            );
            points.push(new THREE.Vector3(...coords));

            // Fade effect - newer points brighter
            colors.push(
                1.0, // red
                0.8, // green
                0.0 // blue
            );
        });

        return { points, colors };
    }, [icao24, flightService, showTrail]);

    if (pathData.points.length === 0 && trailData.points.length === 0)
        return null;

    return (
        <group>
            {/* Historical flight path */}
            {pathData.points.length > 0 && (
                <Line
                    points={pathData.points}
                    color="#4488ff"
                    lineWidth={2}
                    transparent
                    opacity={0.6}
                    dashed
                    dashScale={10}
                    dashSize={1}
                    gapSize={0.5}
                />
            )}

            {/* Real-time trail */}
            {trailData.points.length > 0 && (
                <>
                    <Line
                        points={trailData.points}
                        color="#ff8800"
                        lineWidth={3}
                        transparent
                        opacity={0.8}
                    />
                    {/* Glowing effect */}
                    <Line
                        points={trailData.points}
                        color="#ffaa00"
                        lineWidth={1}
                        transparent
                        opacity={0.4}
                    />
                </>
            )}
        </group>
    );
}
