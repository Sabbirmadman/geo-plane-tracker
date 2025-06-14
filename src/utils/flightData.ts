/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ScaleUtils } from "./scaleUtils";

export interface FlightData {
    icao24: string;
    callsign: string;
    originCountry: string;
    longitude: number;
    latitude: number;
    altitude: number;
    velocity: number;
    heading: number;
    verticalRate: number;
    onGround: boolean;
    lastPositionUpdate: number;
}

export interface FlightPathPoint {
    longitude: number;
    latitude: number;
    altitude: number;
    timestamp: number;
}

export interface FlightPath {
    id: string;
    points: FlightPathPoint[];
}

// OpenSky Network API
const OPENSKY_API_BASE = "https://opensky-network.org/api";

export class FlightDataService {
    private static instance: FlightDataService;
    private flightPaths = new Map<string, FlightPath>();
    private flightTrails = new Map<string, FlightPathPoint[]>();

    // Rate limiting and caching
    private lastRequestTime = 0;
    private readonly MIN_REQUEST_INTERVAL = 10000; // 10 seconds between requests
    private cachedFlights: FlightData[] = [];
    private cacheTimestamp = 0;
    private readonly CACHE_DURATION = 15000; // 15 seconds cache
    private requestCount = 0;
    private readonly MAX_REQUESTS_PER_HOUR = 400;
    private requestTimes: number[] = [];

    static getInstance(): FlightDataService {
        if (!FlightDataService.instance) {
            FlightDataService.instance = new FlightDataService();
        }
        return FlightDataService.instance;
    }

    private canMakeRequest(): boolean {
        const now = Date.now();

        // Check minimum interval
        if (now - this.lastRequestTime < this.MIN_REQUEST_INTERVAL) {
            console.log(
                `Rate limited: waiting ${Math.ceil(
                    (this.MIN_REQUEST_INTERVAL - (now - this.lastRequestTime)) /
                        1000
                )}s`
            );
            return false;
        }

        // Clean old request times (older than 1 hour)
        this.requestTimes = this.requestTimes.filter(
            (time) => now - time < 3600000
        );

        // Check hourly limit
        if (this.requestTimes.length >= this.MAX_REQUESTS_PER_HOUR) {
            console.log("Hourly rate limit reached");
            return false;
        }

        return true;
    }

    private isDataCached(): boolean {
        const now = Date.now();
        return (
            now - this.cacheTimestamp < this.CACHE_DURATION &&
            this.cachedFlights.length > 0
        );
    }

    async fetchLiveFlights(bounds?: {
        minLat: number;
        maxLat: number;
        minLon: number;
        maxLon: number;
    }): Promise<FlightData[]> {
        try {
            // Return cached data if available
            if (this.isDataCached()) {
                console.log(
                    `Using cached flight data (${this.cachedFlights.length} flights)`
                );
                return this.cachedFlights;
            }

            // Check rate limiting
            if (!this.canMakeRequest()) {
                console.log(
                    "Request blocked by rate limiting, using cached data"
                );
                return this.cachedFlights;
            }

            const now = Date.now();
            this.lastRequestTime = now;
            this.requestTimes.push(now);

            let url = `${OPENSKY_API_BASE}/states/all`;

            // Use bounds to reduce data if provided
            if (bounds) {
                const params = new URLSearchParams({
                    lamin: bounds.minLat.toString(),
                    lamax: bounds.maxLat.toString(),
                    lomin: bounds.minLon.toString(),
                    lomax: bounds.maxLon.toString(),
                });
                url += `?${params}`;
            }

            console.log(`Making API request to OpenSky Network...`);
            const response = await fetch(url);

            if (!response.ok) {
                if (response.status === 429) {
                    console.error("Rate limit exceeded by OpenSky API");
                    // Increase interval on rate limit
                    this.lastRequestTime = now + 30000; // Wait extra 30 seconds
                    return this.cachedFlights;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (!data.states) {
                console.log("No flight states received from API");
                return this.cachedFlights;
            }

            const flights = data.states
                .filter(
                    (state: any[]) =>
                        state[5] !== null && // longitude
                        state[6] !== null && // latitude
                        state[7] !== null && // altitude
                        state[7] > 100 && // minimum altitude
                        !state[8] // not on ground
                )
                .map((state: any[]) => ({
                    icao24: state[0],
                    callsign: state[1]?.trim() || "Unknown",
                    originCountry: state[2],
                    longitude: state[5],
                    latitude: state[6],
                    altitude: state[7] || 0,
                    velocity: state[9] || 0,
                    heading: state[10] || 0,
                    verticalRate: state[11] || 0,
                    onGround: state[8] || false,
                    lastPositionUpdate: state[4] || Date.now() / 1000,
                }));

            // Update cache
            this.cachedFlights = flights;
            this.cacheTimestamp = now;

            // Update flight trails
            flights.forEach((flight: FlightData) => {
                this.updateFlightTrail(flight);
            });

            console.log(
                `Successfully fetched ${flights.length} flights from API`
            );
            return flights;
        } catch (error) {
            console.error("Failed to fetch flight data:", error);

            // Return cached data if available, otherwise empty array
            if (this.cachedFlights.length > 0) {
                console.log(
                    `API failed, using cached data (${this.cachedFlights.length} flights)`
                );
                return this.cachedFlights;
            }

            return [];
        }
    }

    private updateFlightTrail(flight: FlightData) {
        const trail = this.flightTrails.get(flight.icao24) || [];
        const newPoint: FlightPathPoint = {
            longitude: flight.longitude,
            latitude: flight.latitude,
            altitude: flight.altitude,
            timestamp: flight.lastPositionUpdate,
        };

        // Add new point if it's different from the last one
        const lastPoint = trail[trail.length - 1];
        if (
            !lastPoint ||
            Math.abs(lastPoint.longitude - newPoint.longitude) > 0.001 ||
            Math.abs(lastPoint.latitude - newPoint.latitude) > 0.001
        ) {
            trail.push(newPoint);
        }

        // Keep only last 50 points for performance
        if (trail.length > 50) {
            trail.splice(0, trail.length - 50);
        }

        this.flightTrails.set(flight.icao24, trail);
    }

    getFlightTrail(icao24: string): FlightPathPoint[] {
        return this.flightTrails.get(icao24) || [];
    }

    async fetchFlightPath(
        icao24: string,
        beginTime: number,
        endTime: number
    ): Promise<FlightPath | null> {
        try {
            // Check if we already have this path cached
            const existing = this.flightPaths.get(icao24);
            if (existing) {
                console.log(`Using cached flight path for ${icao24}`);
                return existing;
            }

            // Rate limiting for path requests too
            if (!this.canMakeRequest()) {
                console.log("Flight path request blocked by rate limiting");
                return null;
            }

            const now = Date.now();
            this.lastRequestTime = now;
            this.requestTimes.push(now);

            const url = `${OPENSKY_API_BASE}/tracks/all?icao24=${icao24}&time=${beginTime}`;
            console.log(`Fetching flight path for ${icao24}...`);

            const response = await fetch(url);

            if (!response.ok) {
                if (response.status === 429) {
                    console.error(
                        "Rate limit exceeded for flight path request"
                    );
                    this.lastRequestTime = now + 30000;
                }
                return null;
            }

            const data = await response.json();

            if (!data.path || data.path.length === 0) {
                return null;
            }

            const path: FlightPath = {
                id: icao24,
                points: data.path
                    .filter(
                        (point: any[]) => point[1] !== null && point[2] !== null
                    )
                    .map((point: any[]) => ({
                        longitude: point[2],
                        latitude: point[1],
                        altitude: point[3] || 0,
                        timestamp: point[0],
                    })),
            };

            this.flightPaths.set(icao24, path);
            console.log(
                `Successfully fetched flight path for ${icao24} (${path.points.length} points)`
            );
            return path;
        } catch (error) {
            console.error("Failed to fetch flight path:", error);
            return null;
        }
    }

    getStoredFlightPath(icao24: string): FlightPath | null {
        return this.flightPaths.get(icao24) || null;
    }

    // Get rate limiting status for UI
    getRateLimitStatus() {
        const now = Date.now();
        const recentRequests = this.requestTimes.filter(
            (time) => now - time < 3600000
        );
        const timeUntilNextRequest = Math.max(
            0,
            this.MIN_REQUEST_INTERVAL - (now - this.lastRequestTime)
        );

        return {
            requestsThisHour: recentRequests.length,
            maxRequestsPerHour: this.MAX_REQUESTS_PER_HOUR,
            timeUntilNextRequest: Math.ceil(timeUntilNextRequest / 1000),
            cacheAge: Math.ceil((now - this.cacheTimestamp) / 1000),
            isUsingCache: this.isDataCached(),
        };
    }

    // Convert lat/lng to 3D sphere coordinates
    static coordsToSphere(
        longitude: number,
        latitude: number,
        altitude: number = 0
    ): [number, number, number] {
        return ScaleUtils.getAirplanePosition(longitude, latitude, altitude);
    }

    // Calculate direction vector between two points
    static calculateDirection(
        from: FlightPathPoint,
        to: FlightPathPoint
    ): [number, number, number] {
        const fromCoords = this.coordsToSphere(
            from.longitude,
            from.latitude,
            from.altitude
        );
        const toCoords = this.coordsToSphere(
            to.longitude,
            to.latitude,
            to.altitude
        );

        const dx = toCoords[0] - fromCoords[0];
        const dy = toCoords[1] - fromCoords[1];
        const dz = toCoords[2] - fromCoords[2];

        const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
        return length > 0 ? [dx / length, dy / length, dz / length] : [0, 0, 1];
    }
}
