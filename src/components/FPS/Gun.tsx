
interface GunProps {
  position: [number, number, number];
  rotation: [number, number, number];
}

export function Gun({ position, rotation }: GunProps) {
  return (
    <group position={position} rotation={rotation}>
      {/* Gun barrel - rotated to point forward correctly */}
      <mesh position={[0, 0, 0.4]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.8]} />
        <meshLambertMaterial color="#333333" />
      </mesh>
      
      {/* Gun body - rotated to be upright */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <boxGeometry args={[0.15, 0.6, 0.2]} />
        <meshLambertMaterial color="#444444" />
      </mesh>
      
      {/* Gun grip - rotated correctly */}
      <mesh position={[0, 0, -0.2]} rotation={[Math.PI / 2 + 0.3, 0, 0]}>
        <boxGeometry args={[0.1, 0.3, 0.1]} />
        <meshLambertMaterial color="#222222" />
      </mesh>
    </group>
  );
}

