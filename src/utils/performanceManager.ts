import * as THREE from "three";

export interface PerformanceMetrics {
    fps: number;
    frameTime: number;
    drawCalls: number;
    triangles: number;
    geometries: number;
    textures: number;
    memoryUsage: number;
}

export class PerformanceManager {
    private static instance: PerformanceManager;
    private renderer: THREE.WebGLRenderer | null = null;
    private stats: PerformanceMetrics = {
        fps: 0,
        frameTime: 0,
        drawCalls: 0,
        triangles: 0,
        geometries: 0,
        textures: 0,
        memoryUsage: 0,
    };

    private frameCount = 0;
    private lastTime = performance.now();
    private fpsUpdateInterval = 1000; // Update FPS every second

    public static getInstance(): PerformanceManager {
        if (!PerformanceManager.instance) {
            PerformanceManager.instance = new PerformanceManager();
        }
        return PerformanceManager.instance;
    }

    public setRenderer(renderer: THREE.WebGLRenderer): void {
        this.renderer = renderer;
    }

    public update(): void {
        const currentTime = performance.now();
        this.frameCount++;

        // Update FPS calculation
        const deltaTime = currentTime - this.lastTime;
        if (deltaTime >= this.fpsUpdateInterval) {
            this.stats.fps = Math.round((this.frameCount * 1000) / deltaTime);
            this.stats.frameTime = deltaTime / this.frameCount;
            this.frameCount = 0;
            this.lastTime = currentTime;
        }

        // Update renderer stats
        if (this.renderer) {
            const info = this.renderer.info;
            this.stats.drawCalls = info.render.calls;
            this.stats.triangles = info.render.triangles;
            this.stats.geometries = info.memory.geometries;
            this.stats.textures = info.memory.textures;
        }

        // Estimate memory usage
        this.stats.memoryUsage = this.estimateMemoryUsage();
    }

    public getStats(): PerformanceMetrics {
        return { ...this.stats };
    }

    private estimateMemoryUsage(): number {
        // Rough estimation based on renderer info
        if (!this.renderer) return 0;

        const info = this.renderer.info;
        // Estimate: 1MB per texture + 0.1MB per geometry
        return info.memory.textures * 1 + info.memory.geometries * 0.1;
    }

    public getQualityRecommendation(): "low" | "medium" | "high" {
        if (this.stats.fps < 30) return "low";
        if (this.stats.fps < 50) return "medium";
        return "high";
    }

    public shouldReduceQuality(): boolean {
        return this.stats.fps < 30 || this.stats.memoryUsage > 500; // 500MB threshold
    }
}
