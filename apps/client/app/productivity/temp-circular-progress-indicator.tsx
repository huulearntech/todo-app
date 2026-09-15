import type { ReactNode } from "react";

interface CircularProgressProps {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0 to 100
  className?: string;
  fillColor?: string;
  icon?: ReactNode;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function TempCircularProgress({
  size = 40,
  strokeWidth = 4,
  progress = 0,
  className = "",
  fillColor = "stroke-primary",
  icon,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - clamp(progress, 0, 1));
  const halfSize = size / 2;

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={halfSize}
          cy={halfSize}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-muted"
        />
        <circle
          cx={halfSize}
          cy={halfSize}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`transition-all duration-300 ease-in-out ${fillColor}`}
          transform={`rotate(-90 ${halfSize} ${halfSize})`}
        />
      </svg>

      {icon && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {icon}
        </div>
      )}
    </div>
  );
}