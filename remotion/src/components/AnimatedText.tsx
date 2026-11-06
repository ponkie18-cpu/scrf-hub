import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

interface AnimatedTextProps {
  text: string;
  delay?: number;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
  fontWeight?: number;
  maxWidth?: number;
  lineHeight?: number;
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  delay = 0,
  fontSize = 48,
  color = "#2A3547",
  fontFamily = "Plus Jakarta Sans, sans-serif",
  fontWeight = 700,
  maxWidth = 1200,
  lineHeight = 1.3,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 30, stiffness: 120 },
  });

  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const y = interpolate(progress, [0, 1], [40, 0]);

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${y}px)`,
        fontSize,
        color,
        fontFamily,
        fontWeight,
        maxWidth,
        lineHeight,
        textAlign: "center",
      }}
    >
      {text}
    </div>
  );
};
