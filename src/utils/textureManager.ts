export interface PlanetTextures {
    day?: string;
    night?: string;
    clouds?: string;
    bump?: string;
    normal?: string;
    emissive?: string;
    specular?: string;
}

export interface TextureSet {
    [key: string]: PlanetTextures;
}

export class TextureManager {
    // Base texture directory
    private static readonly BASE_PATH = "/textures";

    // Base Planet texture directory
    private static readonly PLANET_PATH = `${TextureManager.BASE_PATH}/planets`;

    // Default fallback texture (1x1 transparent pixel)
    public static readonly DEFAULT_TEXTURE =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

    // Planetary texture sets
    public static readonly PLANETS: TextureSet = {
        earth: {
            day: `${TextureManager.PLANET_PATH}/earth/2k_earth_daymap.jpg`,
            night: `${TextureManager.PLANET_PATH}/earth/2k_earth_nightmap.jpg`,
            clouds: `${TextureManager.PLANET_PATH}/earth/2k_earth_clouds.jpg`,
        },
        moon: {
            day: `${TextureManager.PLANET_PATH}/earth/moon/2k_moon.jpg`,
        },
        sun: {
            emissive: `${TextureManager.PLANET_PATH}/sun/2k_sun.jpg`,
        },
        mercury: {
            day: `${TextureManager.PLANET_PATH}/mercury/2k_mercury.jpg`,
        },
        venus: {
            day: `${TextureManager.PLANET_PATH}/venus/2k_venus_surface.jpg`,
            clouds: `${TextureManager.PLANET_PATH}/venus/2k_venus_atmosphere.jpg`,
        },
        mars: {
            day: `${TextureManager.PLANET_PATH}/mars/2k_mars.jpg`,
        },
        jupiter: {
            day: `${TextureManager.PLANET_PATH}/jupiter/2k_jupiter.jpg`,
        },
        saturn: {
            day: `${TextureManager.PLANET_PATH}/saturn/2k_saturn.jpg`,
        },
    };

    // Special texture sets
    public static readonly RINGS = {
        saturn: `${TextureManager.PLANET_PATH}/saturn/2k_saturn_ring_alpha.png`,
    };

    public static readonly SKYBOXES = {
        stars: `${TextureManager.BASE_PATH}/skybox/2k_stars.jpg`,
        milkyway: `${TextureManager.BASE_PATH}/skybox/2k_stars_milky_way.jpg`,
    };

    // Fallback textures for when specific textures are not available
    public static readonly FALLBACKS = {
        rocky: `${TextureManager.PLANET_PATH}/fallbacks/rocky_surface.jpg`,
        gas: `${TextureManager.PLANET_PATH}/fallbacks/gas_surface.jpg`,
        ice: `${TextureManager.PLANET_PATH}/fallbacks/ice_surface.jpg`,
        metal: `${TextureManager.PLANET_PATH}/fallbacks/metal_surface.jpg`,
    };

    /**
     * Get texture path for a specific planet and texture type
     */
    public static getPlanetTexture(
        planet: string,
        textureType: keyof PlanetTextures
    ): string | undefined {
        const planetTextures = this.PLANETS[planet.toLowerCase()];
        return planetTextures?.[textureType];
    }

    /**
     * Get all textures for a planet
     */
    public static getPlanetTextures(
        planet: string
    ): PlanetTextures | undefined {
        return this.PLANETS[planet.toLowerCase()];
    }

    /**
     * Get texture with fallback support
     */
    public static getTextureWithFallback(
        planet: string,
        textureType: keyof PlanetTextures,
        fallbackType?: keyof typeof TextureManager.FALLBACKS
    ): string {
        const texture = this.getPlanetTexture(planet, textureType);

        if (texture) {
            return texture;
        }

        // Special handling for bump textures - try to use the day texture as bump
        if (textureType === "bump") {
            const dayTexture = this.getPlanetTexture(planet, "day");
            if (dayTexture) {
                return dayTexture;
            }
        }

        // Special handling for normal textures - try bump texture first
        if (textureType === "normal") {
            const bumpTexture = this.getPlanetTexture(planet, "bump");
            if (bumpTexture) {
                return bumpTexture;
            }
        }

        // Try fallback
        if (fallbackType && this.FALLBACKS[fallbackType]) {
            return this.FALLBACKS[fallbackType];
        }

        // Use moon texture as universal fallback for solid surfaces
        if (textureType === "day") {
            return this.PLANETS.moon.day || this.DEFAULT_TEXTURE;
        }

        // For bump/normal textures, use moon bump as fallback
        if (textureType === "bump" || textureType === "normal") {
            return (
                this.PLANETS.moon.bump ||
                this.PLANETS.moon.day ||
                this.DEFAULT_TEXTURE
            );
        }

        return this.DEFAULT_TEXTURE;
    }

    /**
     * Get bump texture with intelligent fallbacks
     */
    public static getBumpTexture(planet: string): string {
        // First try dedicated bump texture
        const bumpTexture = this.getPlanetTexture(planet, "bump");
        if (bumpTexture) {
            return bumpTexture;
        }

        // Fall back to day texture (can be used as bump)
        const dayTexture = this.getPlanetTexture(planet, "day");
        if (dayTexture) {
            return dayTexture;
        }

        // Use moon bump as last resort
        return (
            this.PLANETS.moon.bump ||
            this.PLANETS.moon.day ||
            this.DEFAULT_TEXTURE
        );
    }

    /**
     * Get normal texture with intelligent fallbacks
     */
    public static getNormalTexture(planet: string): string {
        // First try dedicated normal texture
        const normalTexture = this.getPlanetTexture(planet, "normal");
        if (normalTexture) {
            return normalTexture;
        }

        // Fall back to bump texture
        const bumpTexture = this.getPlanetTexture(planet, "bump");
        if (bumpTexture) {
            return bumpTexture;
        }

        // Fall back to day texture
        const dayTexture = this.getPlanetTexture(planet, "day");
        if (dayTexture) {
            return dayTexture;
        }

        // Use moon textures as last resort
        return (
            this.PLANETS.moon.normal ||
            this.PLANETS.moon.bump ||
            this.PLANETS.moon.day ||
            this.DEFAULT_TEXTURE
        );
    }

    /**
     * Validate if texture path exists (for development)
     */
    public static async validateTexture(texturePath: string): Promise<boolean> {
        try {
            const response = await fetch(texturePath, { method: "HEAD" });
            return response.ok;
        } catch {
            return false;
        }
    }

    /**
     * Get all texture URLs for preloading
     */
    public static getAllTextureUrls(): string[] {
        const urls: string[] = [];

        // Add all planet textures
        Object.values(this.PLANETS).forEach((planetTextures) => {
            Object.values(planetTextures).forEach((texture) => {
                if (texture && !urls.includes(texture)) {
                    urls.push(texture);
                }
            });
        });

        // Add ring textures
        Object.values(this.RINGS).forEach((ringTexture) => {
            if (!urls.includes(ringTexture)) {
                urls.push(ringTexture);
            }
        });

        // Add skybox textures
        Object.values(this.SKYBOXES).forEach((skyboxTexture) => {
            if (!urls.includes(skyboxTexture)) {
                urls.push(skyboxTexture);
            }
        });

        // Add fallback textures
        Object.values(this.FALLBACKS).forEach((fallbackTexture) => {
            if (!urls.includes(fallbackTexture)) {
                urls.push(fallbackTexture);
            }
        });

        return urls;
    }

    /**
     * Get texture set for a specific celestial body type
     */
    public static getTextureSetByType(
        type: "terrestrial" | "gas-giant" | "ice-giant" | "dwarf"
    ): string[] {
        const sets = {
            terrestrial: ["earth", "moon", "mercury", "venus", "mars", "pluto"],
            "gas-giant": ["jupiter", "saturn"],
            "ice-giant": ["uranus", "neptune"],
            dwarf: ["pluto"],
        };

        return sets[type] || [];
    }

    /**
     * Generate texture configuration for Planet component with smart fallbacks
     */
    public static createPlanetConfig(
        planet: string,
        overrides?: Partial<PlanetTextures>
    ): PlanetTextures {
        const baseTextures = this.getPlanetTextures(planet) || {};

        // Ensure we have fallbacks for missing textures
        const config: PlanetTextures = {
            day: baseTextures.day || this.getTextureWithFallback(planet, "day"),
            night: baseTextures.night,
            clouds: baseTextures.clouds,
            bump: baseTextures.bump || this.getBumpTexture(planet),
            normal: baseTextures.normal || this.getNormalTexture(planet),
            emissive: baseTextures.emissive,
            specular: baseTextures.specular,
        };

        return { ...config, ...overrides };
    }

    /**
     * Check if a planet has specific texture types
     */
    public static hasTexture(
        planet: string,
        textureType: keyof PlanetTextures
    ): boolean {
        return !!this.getPlanetTexture(planet, textureType);
    }

    /**
     * Get available texture types for a planet
     */
    public static getAvailableTextureTypes(
        planet: string
    ): (keyof PlanetTextures)[] {
        const planetTextures = this.getPlanetTextures(planet);
        if (!planetTextures) return [];

        return (Object.keys(planetTextures) as (keyof PlanetTextures)[]).filter(
            (key) => planetTextures[key] !== undefined
        );
    }

    /**
     * Preload textures for a specific planet
     */
    public static async preloadPlanetTextures(
        planet: string
    ): Promise<boolean[]> {
        const textures = this.getPlanetTextures(planet);
        if (!textures) return [];

        const textureUrls = Object.values(textures).filter(Boolean) as string[];
        const validationPromises = textureUrls.map((url) =>
            this.validateTexture(url)
        );

        return Promise.all(validationPromises);
    }

    /**
     * Get ring texture for a planet
     */
    public static getRingTexture(planet: string): string | undefined {
        return this.RINGS[planet.toLowerCase() as keyof typeof this.RINGS];
    }

    /**
     * Get skybox texture
     */
    public static getSkyboxTexture(
        type: keyof typeof TextureManager.SKYBOXES
    ): string {
        return this.SKYBOXES[type];
    }
}

// Type exports for better TypeScript support
export type PlanetName = keyof typeof TextureManager.PLANETS;
export type RingPlanet = keyof typeof TextureManager.RINGS;
export type SkyboxType = keyof typeof TextureManager.SKYBOXES;
export type FallbackType = keyof typeof TextureManager.FALLBACKS;

// Utility functions for common operations
export const getEarthTextures = () => TextureManager.getPlanetTextures("earth");
export const getMoonTexture = () =>
    TextureManager.getPlanetTexture("moon", "day");
export const getSunTexture = () =>
    TextureManager.getPlanetTexture("sun", "day");
export const getSaturnRings = () => TextureManager.getRingTexture("saturn");
