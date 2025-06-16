import { Html } from '@react-three/drei';
import { DamageNumber } from '../../types/enemy';

interface DamageNumbersProps {
  damageNumbers: DamageNumber[];
}

export function DamageNumbers({ damageNumbers }: DamageNumbersProps) {
  return (
    <group>
      {damageNumbers.map((dmg) => {
        const opacity = dmg.life / dmg.maxLife;
        
        return (
          <Html
            key={dmg.id}
            position={[dmg.position.x, dmg.position.y, dmg.position.z]}
            center
            distanceFactor={8}
            sprite
          >
            <div 
              className="text-red-500 font-bold text-lg pointer-events-none"
              style={{ opacity }}
            >
              -{dmg.damage}
            </div>
          </Html>
        );
      })}
    </group>
  );
}
