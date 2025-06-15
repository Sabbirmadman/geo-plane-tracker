import * as THREE from "three";

export class GeometryManager {
    private static geometryCache = new Map<string, THREE.BufferGeometry>();
    private static instances = new Map<string, THREE.InstancedMesh>();

    /**
     * Get or create cached sphere geometry
     */
    public static getSphereGeometry(
        radius: number,
        segments: number
    ): THREE.BufferGeometry {
        const key = `sphere_${radius}_${segments}`;

        if (!this.geometryCache.has(key)) {
            const geometry = new THREE.SphereGeometry(
                radius,
                segments,
                segments
            );
            this.geometryCache.set(key, geometry);
        }

        return this.geometryCache.get(key)!;
    }

    /**
     * Get LOD-appropriate geometry based on distance
     */
    public static getLODGeometry(
        radius: number,
        distance: number,
        baseQuality: number = 64
    ): THREE.BufferGeometry {
        let segments = baseQuality;

        // Reduce quality based on distance
        if (distance > 100) segments = Math.max(16, baseQuality / 4);
        else if (distance > 50) segments = Math.max(24, baseQuality / 2);
        else if (distance > 20) segments = Math.max(32, (baseQuality * 3) / 4);

        return this.getSphereGeometry(radius, segments);
    }

    /**
     * Create instanced mesh for multiple similar objects
     */
    public static createInstancedMesh(
        geometry: THREE.BufferGeometry,
        material: THREE.Material,
        count: number
    ): THREE.InstancedMesh {
        const mesh = new THREE.InstancedMesh(geometry, material, count);
        mesh.frustumCulled = true;
        return mesh;
    }

    /**
     * Clear unused geometries
     */
    public static clearCache(): void {
        for (const geometry of this.geometryCache.values()) {
            geometry.dispose();
        }
        this.geometryCache.clear();
    }

    /**
     * Get cache statistics
     */
    public static getCacheStats(): { count: number; memoryEstimateMB: number } {
        let memoryEstimate = 0;

        for (const geometry of this.geometryCache.values()) {
            // Rough estimate: positions (3 floats) + normals (3 floats) + uvs (2 floats)
            const vertexCount = geometry.attributes.position?.count || 0;
            memoryEstimate += vertexCount * 8 * 4; // 8 floats * 4 bytes each
        }

        return {
            count: this.geometryCache.size,
            memoryEstimateMB: memoryEstimate / (1024 * 1024),
        };
    }
}
