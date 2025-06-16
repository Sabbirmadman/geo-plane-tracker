interface GunProps {
  position: [number, number, number];
  rotation: [number, number, number];
}

export function Gun({ position, rotation }: GunProps) {
  return (
    <group position={position} rotation={rotation}>
      {/* Gun barrel - reduced segments from default to 4 */}
      <mesh position={[0, 0, 0.4]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.8, 4]} />
        <meshLambertMaterial color="#333333" />
      </mesh>
      
      {/* Gun body - simplified box */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <boxGeometry args={[0.15, 0.6, 0.2]} />
        <meshLambertMaterial color="#444444" />
      </mesh>
      
      {/* Gun grip - simplified */}
      <mesh position={[0, 0, -0.2]} rotation={[Math.PI / 2 + 0.3, 0, 0]}>
        <boxGeometry args={[0.1, 0.3, 0.1]} />
        <meshLambertMaterial color="#222222" />
      </mesh>
    </group>
  );
}

