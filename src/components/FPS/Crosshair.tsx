export function Crosshair() {
  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
      <div className="relative">
        {/* Horizontal line */}
        <div className="absolute w-6 h-0.5 bg-white -translate-x-1/2 -translate-y-1/4"></div>
        {/* Vertical line */}
        <div className="absolute w-0.5 h-6 bg-white -translate-x-1/4 -translate-y-1/2"></div>
        {/* Center dot */}
        <div className="absolute w-1 h-1 bg-red-500 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
      </div>
    </div>
  );
}
