import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Img, staticFile } from "remotion";
import { colors, fonts } from "../theme";
import { FloatingOrb } from "../components/FloatingOrb";

export const Scene1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgHue = interpolate(frame, [0, 150], [168, 175]);

  const logoProgress = spring({ frame: frame - 10, fps, config: { damping: 30 } });
  const logoOpacity = interpolate(logoProgress, [0, 1], [0, 1]);
  const logoScale = interpolate(logoProgress, [0, 1], [0.8, 1]);

  const textProgress = spring({ frame: frame - 30, fps, config: { damping: 25 } });
  const textOpacity = interpolate(textProgress, [0, 1], [0, 1]);
  const textY = interpolate(textProgress, [0, 1], [50, 0]);

  const subProgress = spring({ frame: frame - 55, fps, config: { damping: 25 } });
  const subOpacity = interpolate(subProgress, [0, 1], [0, 1]);
  const subY = interpolate(subProgress, [0, 1], [30, 0]);

  const breathe = Math.sin(frame * 0.03) * 3;

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${colors.cream} 0%, hsl(${bgHue}, 55%, 95%) 50%, ${colors.cream} 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
      }}
    >
      <FloatingOrb x={200} y={150} size={300} color={colors.teal} speed={0.015} amplitude={15} />
      <FloatingOrb x={1400} y={600} size={250} color={colors.coral} speed={0.02} amplitude={20} />
      <FloatingOrb x={800} y={800} size={200} color={colors.tealLight} speed={0.018} amplitude={12} />

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 10 }}>
        <Img
          src={staticFile("images/logo.png")}
          style={{
            height: 160,
            opacity: logoOpacity,
            transform: `scale(${logoScale}) translateY(${breathe}px)`,
            marginBottom: 50,
          }}
        />

        <div
          style={{
            fontFamily: fonts.display,
            fontSize: 78,
            fontWeight: 700,
            color: colors.navy,
            opacity: textOpacity,
            transform: `translateY(${textY}px)`,
            textAlign: "center",
            maxWidth: 1200,
            lineHeight: 1.15,
          }}
        >
          What if your business had
          <br />
          its own <span style={{ color: colors.teal }}>AI Auditor & CFO?</span>
        </div>

        <div
          style={{
            fontFamily: fonts.body,
            fontSize: 36,
            color: colors.muted,
            opacity: subOpacity,
            transform: `translateY(${subY}px)`,
            marginTop: 35,
            textAlign: "center",
            maxWidth: 800,
          }}
        >
          Always on. Always watching. Always advising.
        </div>
      </div>
    </AbsoluteFill>
  );
};
