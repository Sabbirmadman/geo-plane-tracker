import { useEffect, useState, useMemo, useRef } from "react";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import { ScaleUtils } from "../../utils/scaleUtils";

interface CountryBordersProps {
    visible?: boolean;
    opacity?: number;
    color?: string;
    lineWidth?: number;
}

interface GeoJSONFeature {
    type: "Feature";
    properties: {
        NAME?: string;
        NAME_EN?: string;
    };
    geometry: {
        type: "Polygon" | "MultiPolygon";
        coordinates: number[][][] | number[][][][];
    };
}

interface GeoJSONData {
    type: "FeatureCollection";
    features: GeoJSONFeature[];
}

interface BorderLine {
    key: string;
    points: THREE.Vector3[];
    name: string;
}

export function CountryBorders({
    opacity = 0.8,
    color = "#00ff88",
    lineWidth = 1.5,
}: CountryBordersProps) {
    const [countriesData, setCountriesData] = useState<GeoJSONData | null>(
        null
    );
    const [loading, setLoading] = useState(false);
    const loadingRef = useRef(false);

    useEffect(() => {
        if (!countriesData && !loading && !loadingRef.current) {
            loadingRef.current = true;
            setLoading(true);

            fetch("/ne_10m_admin_0_countries.json")
                .then((res) => {
                    if (!res.ok) {
                        throw new Error(`HTTP error! status: ${res.status}`);
                    }
                    return res.json();
                })
                .then((data: GeoJSONData) => {
                    console.log(
                        "Countries data loaded:",
                        data.features?.length || 0,
                        "features"
                    );
                    setCountriesData(data);
                })
                .catch((err) => {
                    console.error("Failed to load countries data:", err);
                })
                .finally(() => {
                    setLoading(false);
                    loadingRef.current = false;
                });
        }
    }, [countriesData, loading]);

    const borderLines = useMemo(() => {
        if (!countriesData?.features) return [];

        console.log("Processing border lines...");
        const lines: BorderLine[] = [];
        let processedCount = 0;

        // Process with optimization - skip very small features
        countriesData.features.forEach((feature, index) => {
            try {
                const name =
                    feature.properties.NAME_EN ||
                    feature.properties.NAME ||
                    `Country-${index}`;

                if (feature.geometry.type === "Polygon") {
                    const coordinates = feature.geometry
                        .coordinates as number[][][];
                    coordinates.forEach((ring, ringIndex) => {
                        // Skip very small rings for performance
                        if (ring.length < 3) return;

                        const points = convertToSphereCoords(ring);
                        if (points.length > 2) {
                            lines.push({
                                key: `${index}-${ringIndex}`,
                                points: points,
                                name: name,
                            });
                        }
                    });
                } else if (feature.geometry.type === "MultiPolygon") {
                    const coordinates = feature.geometry
                        .coordinates as number[][][][];
                    coordinates.forEach((polygon, polygonIndex) => {
                        polygon.forEach((ring, ringIndex) => {
                            if (ring.length < 3) return;

                            const points = convertToSphereCoords(ring);
                            if (points.length > 2) {
                                lines.push({
                                    key: `${index}-${polygonIndex}-${ringIndex}`,
                                    points: points,
                                    name: name,
                                });
                            }
                        });
                    });
                }
                processedCount++;
            } catch (error) {
                console.warn(`Error processing feature ${index}:`, error);
            }
        });

        console.log(
            `Generated ${lines.length} border lines from ${processedCount} features`
        );
        return lines;
    }, [countriesData]);

    if (loading || !borderLines.length) {
        return null;
    }

    return (
        <group>
            {borderLines.map((line) => (
                <Line
                    key={line.key}
                    points={line.points}
                    color={color}
                    lineWidth={lineWidth}
                    transparent
                    opacity={opacity}
                />
            ))}
        </group>
    );
}

// Updated coordinate conversion using scale utility
function convertToSphereCoords(coordinates: number[][]): THREE.Vector3[] {
    const points: THREE.Vector3[] = [];

    for (let i = 0; i < coordinates.length; i++) {
        const [lng, lat] = coordinates[i];

        if (
            typeof lng !== "number" ||
            typeof lat !== "number" ||
            isNaN(lng) ||
            isNaN(lat) ||
            lng < -180 ||
            lng > 180 ||
            lat < -90 ||
            lat > 90
        ) {
            continue;
        }

        const coords = ScaleUtils.getBorderPosition(lng, lat);
        points.push(new THREE.Vector3(...coords));
    }

    return points;
}
