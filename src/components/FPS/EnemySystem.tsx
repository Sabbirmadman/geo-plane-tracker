import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSphere } from '@react-three/cannon';
import * as THREE from 'three';
import { Gun } from './Gun';
import { HealthBar } from './HealthBar';

interface EnemyState {
  id: string;
  position: THREE.Vector3;
  rotation: number;
  health: number;
  maxHealth: number;
  isDetectingPlayer: boolean;
  lastShotTime: number;
}

interface EnemySystemProps {
  playerPosition: THREE.Vector3;
  onPlayerHit?: (damage: number, hitPosition: THREE.Vector3) => void;
  onEnemyUpdate?: (enemies: Array<{ id: string; position: THREE.Vector3; }>) => void;
  onEnemyDamageRequest?: (handler: (enemyId: string, damage: number) => void) => void;
}

export function EnemySystem({ playerPosition, onPlayerHit, onEnemyUpdate, onEnemyDamageRequest }: EnemySystemProps) {
  const lastTime = useRef(performance.now());
  const updateCounter = useRef(0);
  
  const enemyConfig = {
    health: 50,
    maxHealth: 50,
    detectionRange: 15,
    radarAngle: Math.PI / 3,
    fireRate: 2,
    bulletDamage: 15,
    rotationSpeed: 2
  };

  // Reduced number of enemies for better performance - KEEP ONLY 2
  const safeSpawnPositions = [
    new THREE.Vector3(10, 1, 10),
    new THREE.Vector3(-10, 1, -10),
  ];

  const [enemies, setEnemies] = useState<EnemyState[]>(
    safeSpawnPositions.map((pos, index) => ({
      id: `enemy${index + 1}`,
      position: pos.clone(),
      rotation: Math.random() * Math.PI * 2,
      health: enemyConfig.maxHealth,
      maxHealth: enemyConfig.maxHealth,
      isDetectingPlayer: false,
      lastShotTime: 0
    }))
  );

  // Handle enemy taking damage
  const handleEnemyDamage = useCallback((enemyId: string, damage: number) => {
    console.log(`EnemySystem: Processing damage for ${enemyId}, damage: ${damage}`);
    
    setEnemies(prev => prev.map(enemy => {
      if (enemy.id === enemyId) {
        const newHealth = Math.max(0, enemy.health - damage);
        console.log(`Enemy ${enemyId}: ${enemy.health} -> ${newHealth} HP`);
        
        if (newHealth <= 0) {
          console.log(`Enemy ${enemyId} defeated! Respawning...`);
          // Respawn at a random safe position
          const randomSafePos = safeSpawnPositions[Math.floor(Math.random() * safeSpawnPositions.length)];
          return { 
            ...enemy, 
            health: enemyConfig.maxHealth,
            position: randomSafePos.clone(),
            rotation: Math.random() * Math.PI * 2
          };
        }
        return { ...enemy, health: newHealth };
      }
      return enemy;
    }));
  }, [enemyConfig.maxHealth, safeSpawnPositions]);

  // Provide damage handler to parent
  useEffect(() => {
    if (onEnemyDamageRequest) {
      onEnemyDamageRequest(handleEnemyDamage);
    }
  }, [onEnemyDamageRequest, handleEnemyDamage]);

  // Optimized enemy AI - update every 6th frame for better performance
  useFrame(() => {
    updateCounter.current++;
    if (updateCounter.current % 6 !== 0) return; // Only update every 6th frame

    const currentTime = performance.now();
    const deltaTime = (currentTime - lastTime.current) / 1000;
    lastTime.current = currentTime;

    setEnemies(prev => {
      const updatedEnemies = prev.map(enemy => {
        const updatedEnemy = { ...enemy };
        
        // Pre-calculate distance using squared distance to avoid sqrt
        const dx = playerPosition.x - enemy.position.x;
        const dy = playerPosition.y - enemy.position.y;
        const dz = playerPosition.z - enemy.position.z;
        const distanceSq = dx * dx + dy * dy + dz * dz;
        const detectionRangeSq = enemyConfig.detectionRange * enemyConfig.detectionRange;
        
        if (distanceSq <= detectionRangeSq) {
          // Use pre-calculated values instead of creating new vectors
          const distance = Math.sqrt(distanceSq);
          const toPlayerX = dx / distance;
          const toPlayerZ = dz / distance;
          
          const enemyForwardX = Math.sin(enemy.rotation);
          const enemyForwardZ = Math.cos(enemy.rotation);
          
          const dot = enemyForwardX * toPlayerX + enemyForwardZ * toPlayerZ;
          const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
          updatedEnemy.isDetectingPlayer = angle <= enemyConfig.radarAngle / 2;
          
          if (updatedEnemy.isDetectingPlayer) {
            const targetRotation = Math.atan2(toPlayerX, toPlayerZ);
            let rotationDiff = targetRotation - enemy.rotation;
            
            while (rotationDiff > Math.PI) rotationDiff -= 2 * Math.PI;
            while (rotationDiff < -Math.PI) rotationDiff += 2 * Math.PI;
            
            const rotationStep = enemyConfig.rotationSpeed * deltaTime * 6; // Compensate for 6-frame update
            if (Math.abs(rotationDiff) < rotationStep) {
              updatedEnemy.rotation = targetRotation;
            } else {
              updatedEnemy.rotation += Math.sign(rotationDiff) * rotationStep;
            }
            
            const timeSinceLastShot = currentTime - enemy.lastShotTime;
            const fireInterval = 1000 / enemyConfig.fireRate;
            
            if (timeSinceLastShot >= fireInterval && onPlayerHit) {
              if (distance < enemyConfig.detectionRange && Math.abs(rotationDiff) < 0.2) {
                // Reuse playerPosition instead of cloning
                onPlayerHit(enemyConfig.bulletDamage, playerPosition);
                updatedEnemy.lastShotTime = currentTime;
              }
            }
          }
        } else {
          updatedEnemy.isDetectingPlayer = false;
        }
        
        return updatedEnemy;
      });

      // Only update parent every 30th frame
      if (updateCounter.current % 30 === 0 && onEnemyUpdate) {
        onEnemyUpdate(updatedEnemies.map(e => ({ id: e.id, position: e.position })));
      }

      return updatedEnemies;
    });
  });

  return (
    <group>
      {enemies.map(enemy => (
        <EnemyPlayer 
          key={enemy.id} 
          enemy={enemy} 
          config={enemyConfig}
        />
      ))}
    </group>
  );
}

// Individual enemy component with proper types
interface EnemyPlayerProps {
  enemy: EnemyState;
  config: {
    detectionRange: number;
    radarAngle: number;
  };
}

function EnemyPlayer({ enemy, config }: EnemyPlayerProps) {
  const [enemyRef] = useSphere<THREE.Mesh>(() => ({
    mass: 1,
    position: [enemy.position.x, enemy.position.y, enemy.position.z],
    material: {
      friction: 0.1,
      restitution: 0.1,
    },
    fixedRotation: true,
    linearDamping: 0.4,
    angularDamging: 1,
  }));

  // Pre-calculate and cache expensive operations
  const gunPosition: [number, number, number] = useMemo(() => {
    const offsetX = 0.3 * Math.cos(enemy.rotation) - 0.4 * Math.sin(enemy.rotation);
    const offsetZ = 0.3 * Math.sin(enemy.rotation) + 0.4 * Math.cos(enemy.rotation);
    return [
      enemy.position.x + offsetX,
      enemy.position.y + 0.1,
      enemy.position.z + offsetZ
    ];
  }, [enemy.position.x, enemy.position.y, enemy.position.z, enemy.rotation]);

  const healthPercent = enemy.health / enemy.maxHealth;
  const enemyColor = useMemo(() => 
    healthPercent > 0.6 ? "#ff4444" : 
    healthPercent > 0.3 ? "#ff6666" : "#ff8888"
  , [healthPercent]);

  // Cache radar geometry to avoid recreating
  const radarGeometry = useMemo(() => 
    new THREE.ConeGeometry(
      config.detectionRange * Math.tan(config.radarAngle / 2),
      config.detectionRange,
      4, // Reduced segments for performance
      1,
      true
    ), [config.detectionRange, config.radarAngle]);

  return (
    <group>
      <mesh ref={enemyRef} castShadow rotation={[0, enemy.rotation, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 1.0, 6]} /> {/* Reduced segments */}
        <meshLambertMaterial color={enemyColor} />
      </mesh>
      
      <group 
        position={gunPosition}
        rotation={[0, enemy.rotation, 0]}
      >
        <Gun position={[0, 0, 0]} rotation={[0, 0, 0]} />
      </group>
      
      <HealthBar 
        position={enemy.position}
        health={enemy.health}
        maxHealth={enemy.maxHealth}
        isEnemy={true}
      />
      
      {/* Only render radar when detecting - reduces draw calls */}
      {enemy.isDetectingPlayer && (
        <mesh 
          position={[enemy.position.x, enemy.position.y + 0.1, enemy.position.z]}
          rotation={[-Math.PI / 2, enemy.rotation, 0]}
        >
          <primitive object={radarGeometry} />
          <meshBasicMaterial 
            color="#ff0000" 
            transparent 
            opacity={0.15} 
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}
