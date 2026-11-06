import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Img, staticFile } from "remotion";
import { colors, fonts } from "../theme";
import { FloatingOrb } from "../components/FloatingOrb";

export const Scene6Close: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const taglineProgress = spring({ frame: frame - 20, fps, config: { damping: 15, stiffness: 80 } });
  const taglineOpacity = interpolate(taglineProgress, [0, 1], [0, 1]);
  const taglineScale = interpolate(taglineProgress, [0, 1], [0.85, 1]);

  const logoProgress = spring({ frame: frame - 60, fps, config: { damping: 25 } });
  const logoOpacity = interpolate(logoProgress, [0, 1], [0, 1]);

  const urlProgress = spring({ frame: frame - 80, fps, config: { damping: 25 } });
  const urlOpacity = interpolate(urlProgress, [0, 1], [0, 1]);

  const ctaProgress = spring({ frame: frame - 100, fps, config: { damping: 20 } });
  const ctaOpacity = interpolate(ctaProgress, [0, 1], [0, 1]);
  const ctaY = interpolate(ctaProgress, [0, 1], [20, 0]);

  const glowPulse = Math.sin(frame * 0.04) * 0.15 + 1;

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${colors.navy} 0%, ${colors.navyLight} 40%, ${colors.tealDark} 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
      }}
    >
      <FloatingOrb x={300} y={200} size={400} color={colors.teal} speed={0.01} amplitude={15} />
      <FloatingOrb x={1200} y={600} size={350} color={colors.coral} speed={0.015} amplitude={20} />

      <div
        style={{
          position: "absolute",
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${colors.teal}15, transparent 60%)`,
          transform: `scale(${glowPulse})`,
        }}
      />

      <div style={{ zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div
          style={{
            fontFamily: fonts.display,
            fontSize: 72,
            fontWeight: 700,
            color: colors.white,
            opacity: taglineOpacity,
            transform: `scale(${taglineScale})`,
            textAlign: "center",
            maxWidth: 1100,
            lineHeight: 1.2,
            marginBottom: 50,
          }}
        >
          Your AI-powered auditor.
          <br />
          <span style={{ color: colors.tealLight }}>Your resilience, measured.</span>
        </div>

        <Img
          src={staticFile("images/logo.png")}
          style={{
            height: 140,
            opacity: logoOpacity,
            marginBottom: 30,
          }}
        />

        <div
          style={{
            fontFamily: fonts.display,
            fontSize: 38,
            color: `${colors.white}E0`,
            opacity: urlOpacity,
            marginBottom: 30,
            letterSpacing: 1,
            fontWeight: 600,
          }}
        >
          hub.tsadinaledi.co.za
        </div>

        <div
          style={{
            fontFamily: fonts.display,
            fontSize: 26,
            color: colors.tealLight,
            opacity: ctaOpacity,
            transform: `translateY(${ctaY}px)`,
            padding: "14px 50px",
            border: `2px solid ${colors.tealLight}60`,
            borderRadius: 40,
          }}
        >
          Start building your resilience — free
        </div>
      </div>
    </AbsoluteFill>
  );
};
