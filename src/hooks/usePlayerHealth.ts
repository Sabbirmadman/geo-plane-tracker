import { useState, useCallback } from 'react';

export function usePlayerHealth(initialHealth: number = 100) {
  const [health, setHealth] = useState(initialHealth);
  const [maxHealth] = useState(initialHealth);

  const takeDamage = useCallback((damage: number): boolean => {
    setHealth(prev => {
      const newHealth = Math.max(0, prev - damage);
      return newHealth;
    });
    
    return health - damage <= 0; // Return true if player died
  }, [health]);

  const heal = useCallback((amount: number) => {
    setHealth(prev => Math.min(maxHealth, prev + amount));
  }, [maxHealth]);

  const reset = useCallback(() => {
    setHealth(maxHealth);
  }, [maxHealth]);

  return {
    health,
    maxHealth,
    takeDamage,
    heal,
    reset,
    isDead: health <= 0
  };
}
