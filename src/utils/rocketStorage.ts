import { RocketComponent } from "../components/Rocket/Rocket";

export interface RocketDesign {
    id: string;
    name: string;
    components: RocketComponent[];
    createdAt: string;
    lastModified: string;
    thumbnail?: string; // Base64 encoded image
}

const STORAGE_KEY = "rocket_designs";

export class RocketStorage {
    static saveDesign(name: string, components: RocketComponent[]): string {
        const designs = this.getAllDesigns();
        const id = this.generateId();

        const newDesign: RocketDesign = {
            id,
            name,
            components: JSON.parse(JSON.stringify(components)), // Deep clone
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
        };

        designs.push(newDesign);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(designs));

        return id;
    }

    static updateDesign(
        id: string,
        name: string,
        components: RocketComponent[]
    ): boolean {
        const designs = this.getAllDesigns();
        const index = designs.findIndex((d) => d.id === id);

        if (index === -1) return false;

        designs[index] = {
            ...designs[index],
            name,
            components: JSON.parse(JSON.stringify(components)),
            lastModified: new Date().toISOString(),
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(designs));
        return true;
    }

    static loadDesign(id: string): RocketDesign | null {
        const designs = this.getAllDesigns();
        return designs.find((d) => d.id === id) || null;
    }

    static deleteDesign(id: string): boolean {
        const designs = this.getAllDesigns();
        const filteredDesigns = designs.filter((d) => d.id !== id);

        if (filteredDesigns.length === designs.length) return false;

        localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredDesigns));
        return true;
    }

    static getAllDesigns(): RocketDesign[] {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error("Error loading rocket designs:", error);
            return [];
        }
    }

    static exportDesign(id: string): string | null {
        const design = this.loadDesign(id);
        return design ? JSON.stringify(design, null, 2) : null;
    }

    static importDesign(jsonData: string): string | null {
        try {
            const design = JSON.parse(jsonData) as RocketDesign;

            // Validate the design structure
            if (
                !design.name ||
                !design.components ||
                !Array.isArray(design.components)
            ) {
                throw new Error("Invalid rocket design format");
            }

            // Generate new ID and save
            const newId = this.generateId();
            const newDesign: RocketDesign = {
                ...design,
                id: newId,
                createdAt: new Date().toISOString(),
                lastModified: new Date().toISOString(),
            };

            const designs = this.getAllDesigns();
            designs.push(newDesign);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(designs));

            return newId;
        } catch (error) {
            console.error("Error importing rocket design:", error);
            return null;
        }
    }

    static saveThumbnail(id: string, thumbnail: string): boolean {
        const designs = this.getAllDesigns();
        const index = designs.findIndex((d) => d.id === id);

        if (index === -1) return false;

        designs[index].thumbnail = thumbnail;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(designs));
        return true;
    }

    private static generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    static getDesignStats() {
        const designs = this.getAllDesigns();
        return {
            total: designs.length,
            totalSize: new Blob([JSON.stringify(designs)]).size,
            lastModified:
                designs.length > 0
                    ? Math.max(
                          ...designs.map((d) =>
                              new Date(d.lastModified).getTime()
                          )
                      )
                    : null,
        };
    }
}
