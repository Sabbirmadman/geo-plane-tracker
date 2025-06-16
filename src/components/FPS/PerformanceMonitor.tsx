import { useState, useRef, useEffect } from 'react';

export function PerformanceMonitor() {
  const [fps, setFps] = useState(60);
  const [frameTime, setFrameTime] = useState(16.67);
  const [memoryUsage, setMemoryUsage] = useState(0);
  
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const fpsArray = useRef<number[]>([]);

  useEffect(() => {
    let animationId: number;
    
    const updatePerformance = () => {
      frameCount.current++;
      const currentTime = performance.now();
      
      // Calculate FPS every 30 frames for better stability and performance
      if (frameCount.current % 30 === 0) {
        const deltaTime = currentTime - lastTime.current;
        const currentFPS = 30000 / deltaTime; // 30 frames * 1000ms
        fpsArray.current.push(currentFPS);
        
        // Keep only last 10 readings for smoothing
        if (fpsArray.current.length > 10) {
          fpsArray.current.shift();
        }
        
        // Calculate average FPS
        const avgFPS = fpsArray.current.reduce((a, b) => a + b, 0) / fpsArray.current.length;
        setFps(Math.round(avgFPS));
        setFrameTime(Number((1000 / avgFPS).toFixed(2)));
        
        // Get memory usage less frequently
        if (frameCount.current % 90 === 0 && 'memory' in performance) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const memory = (performance as any).memory;
          setMemoryUsage(Math.round(memory.usedJSHeapSize / 1024 / 1024));
        }
        
        lastTime.current = currentTime;
      }
      
      animationId = requestAnimationFrame(updatePerformance);
    };
    
    updatePerformance();
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  return (
    <div className="absolute top-4 right-4 z-20 text-white text-xs">
      <div className="bg-black bg-opacity-75 px-3 py-2 rounded-lg space-y-1">
        <div className="text-green-400 font-bold mb-1">Performance</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <span>FPS:</span>
          <span className={fps < 30 ? 'text-red-400' : fps < 60 ? 'text-yellow-400' : 'text-green-400'}>
            {fps}
          </span>
          
          <span>Frame:</span>
          <span>{frameTime}ms</span>
          
          {memoryUsage > 0 && (
            <>
              <span>Memory:</span>
              <span>{memoryUsage}MB</span>
            </>
          )}
          
          <span>Status:</span>
          <span className={fps >= 60 ? 'text-green-400' : fps >= 30 ? 'text-yellow-400' : 'text-red-400'}>
            {fps >= 60 ? 'Excellent' : fps >= 30 ? 'Good' : 'Poor'}
          </span>
        </div>
        
        {/* Performance indicator */}
        <div className="mt-2 flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            fps >= 60 ? 'bg-green-400' : 
            fps >= 30 ? 'bg-yellow-400' : 'bg-red-400'
          } ${fps >= 30 ? 'animate-pulse' : ''}`}></div>
          <span className="text-xs">
            {fps >= 60 ? 'Smooth' : fps >= 30 ? 'Playable' : 'Choppy'}
          </span>
        </div>
      </div>
    </div>
  );
}
