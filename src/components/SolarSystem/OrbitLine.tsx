import { useMemo } from "react";
import { Line } from "@react-three/drei";
import * as THREE from "three";

interface OrbitLineProps {
    radius: number;
    color?: string;
    opacity?: number;
    segments?: number;
}

export function OrbitLine({
    radius,
    color = "#444444",
    opacity = 0.3,
    segments = 128,
}: OrbitLineProps) {
    const points = useMemo(() => {
        const points: THREE.Vector3[] = [];
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            points.push(
                new THREE.Vector3(
                    Math.cos(angle) * radius,
                    0,
                    Math.sin(angle) * radius
                )
            );
        }
        return points;
    }, [radius, segments]);

    return (
        <Line
            points={points}
            color={color}
            lineWidth={1}
            transparent
            opacity={opacity}
            dashed
            dashScale={10}
            dashSize={2}
            gapSize={1}
        />
    );
}
