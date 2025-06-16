/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from 'react';

export function useGroundDetection(
  groundSensorRef: React.RefObject<any>,
  setIsOnGround: (value: boolean) => void
) {
  useEffect(() => {
    const handleBeginContact = (event: any) => {
      if (event.target === groundSensorRef.current || event.body === groundSensorRef.current) {
        setIsOnGround(true);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleEndContact = (event: any) => {
      if (event.target === groundSensorRef.current || event.body === groundSensorRef.current) {
        setTimeout(() => {
          setIsOnGround(false);
        }, 50);
      }
    };

    if (groundSensorRef.current) {
      groundSensorRef.current.addEventListener('collide', handleBeginContact);
    }

    return () => {
      if (groundSensorRef.current) {
        groundSensorRef.current.removeEventListener('collide', handleBeginContact);
      }
    };
  }, [groundSensorRef, setIsOnGround]);
}
