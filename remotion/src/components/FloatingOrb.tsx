import { useCurrentFrame, interpolate } from "remotion";

interface FloatingOrbProps {
  x: number;
  y: number;
  size: number;
  color: string;
  speed?: number;
  amplitude?: number;
}

export const FloatingOrb: React.FC<FloatingOrbProps> = ({
  x, y, size, color, speed = 0.02, amplitude = 20,
}) => {
  const frame = useCurrentFrame();
  const offsetY = Math.sin(frame * speed) * amplitude;
  const offsetX = Math.cos(frame * speed * 0.7) * amplitude * 0.5;
  const scale = 1 + Math.sin(frame * speed * 0.5) * 0.05;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle at 30% 30%, ${color}40, ${color}10)`,
        transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
        filter: "blur(2px)",
      }}
    />
  );
};
