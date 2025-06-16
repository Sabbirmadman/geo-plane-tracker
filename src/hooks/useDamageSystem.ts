import { useState, useCallback, useRef } from 'react';
import { DamageNumber } from '../types/enemy';
import * as THREE from 'three';

export function useDamageSystem() {
  const [damageNumbers, setDamageNumbers] = useState<DamageNumber[]>([]);
  const damageIdCounter = useRef(0);

  const addDamageNumber = useCallback((
    position: THREE.Vector3,
    damage: number
  ) => {
    damageIdCounter.current++;
    
    const newDamageNumber: DamageNumber = {
      id: `damage_${damageIdCounter.current}`,
      position: position.clone(),
      damage,
      life: 2.0, // 2 seconds
      maxLife: 2.0
    };
    
    setDamageNumbers(prev => [...prev, newDamageNumber]);
  }, []);

  const updateDamageNumbers = useCallback((deltaTime: number) => {
    setDamageNumbers(prev => prev
      .map(dmg => ({
        ...dmg,
        position: new THREE.Vector3(
          dmg.position.x,
          dmg.position.y + deltaTime * 2, // Float upward
          dmg.position.z
        ),
        life: dmg.life - deltaTime
      }))
      .filter(dmg => dmg.life > 0)
    );
  }, []);

  return {
    damageNumbers,
    addDamageNumber,
    updateDamageNumbers
  };
}
