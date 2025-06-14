export class ScaleUtils {
    // Base earth radius
    static readonly EARTH_RADIUS = 2.001;

    // Scale factors for different objects - MUCH smaller than before
    static readonly DEFAULT_AIRPLANE_SCALE = 0.00001; // Tiny scale for GLTF models
    static readonly AIRPLANE_SCALE_RANGE = {
        min: 0.000005,
        max: 0.00005,
    };

    // Distance offsets from Earth surface
    static readonly AIRPLANE_SURFACE_OFFSET = 0.01; // Small offset from surface
    static readonly BORDER_SURFACE_OFFSET = 0.001;

    // Zoom-based scaling parameters
    static readonly MIN_CAMERA_DISTANCE = 2.5;
    static readonly MAX_CAMERA_DISTANCE = 50;
    static readonly ZOOM_SCALE_MULTIPLIER = 3.0; // How much to scale based on zoom

    // Convert lat/lng to 3D sphere coordinates with proper scaling
    static coordsToSphere(
        longitude: number,
        latitude: number,
        altitude: number = 0,
        surfaceOffset: number = 0
    ): [number, number, number] {
        // Scale altitude very conservatively
        const altitudeScale = Math.min(altitude / 1000000, 0.01); // Much smaller altitude scaling
        const radius = this.EARTH_RADIUS + altitudeScale + surfaceOffset;

        const phi = (90 - latitude) * (Math.PI / 180);
        const theta = (longitude + 180) * (Math.PI / 180);

        const x = -(radius * Math.sin(phi) * Math.cos(theta));
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(phi) * Math.sin(theta);

        return [x, y, z];
    }

    // Get airplane scale based on user preference and camera distance
    static getAirplaneScale(
        scaleMultiplier: number = 1,
        cameraDistance: number = 8
    ): number {
        // Calculate zoom factor (1 = closest, 0 = furthest)
        const zoomFactor =
            1 -
            Math.min(
                Math.max(
                    (cameraDistance - this.MIN_CAMERA_DISTANCE) /
                        (this.MAX_CAMERA_DISTANCE - this.MIN_CAMERA_DISTANCE),
                    0
                ),
                1
            );

        // Inverse scaling: larger when zoomed out, smaller when zoomed in
        const zoomScale = 1 + (1 - zoomFactor) * this.ZOOM_SCALE_MULTIPLIER;

        return this.DEFAULT_AIRPLANE_SCALE * scaleMultiplier * zoomScale;
    }

    // Get airplane position on Earth surface
    static getAirplanePosition(
        longitude: number,
        latitude: number,
        altitude: number
    ): [number, number, number] {
        return this.coordsToSphere(
            longitude,
            latitude,
            altitude,
            this.AIRPLANE_SURFACE_OFFSET
        );
    }

    // Get border line position
    static getBorderPosition(
        longitude: number,
        latitude: number
    ): [number, number, number] {
        return this.coordsToSphere(
            longitude,
            latitude,
            0,
            this.BORDER_SURFACE_OFFSET
        );
    }
}
