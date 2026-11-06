import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Img, staticFile } from "remotion";
import { colors, fonts } from "../theme";

export const Scene3Shift: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fogOpacity = interpolate(frame, [0, 60, 120], [0.7, 0.3, 0], { extrapolateRight: "clamp" });

  const mainProgress = spring({ frame: frame - 30, fps, config: { damping: 20 } });
  const mainOpacity = interpolate(mainProgress, [0, 1], [0, 1]);
  const mainScale = interpolate(mainProgress, [0, 1], [0.9, 1]);

  const subProgress = spring({ frame: frame - 60, fps, config: { damping: 25 } });
  const subOpacity = interpolate(subProgress, [0, 1], [0, 1]);

  const logoProgress = spring({ frame: frame - 80, fps, config: { damping: 25 } });
  const logoOpacity = interpolate(logoProgress, [0, 1], [0, 1]);
  const logoScale = interpolate(logoProgress, [0, 1], [0.8, 1]);

  const lightRadius = interpolate(frame, [20, 150], [0, 120], { extrapolateRight: "clamp" });
  const glowPulse = Math.sin(frame * 0.05) * 0.1 + 0.9;

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 50%, ${colors.tealLight}20 ${lightRadius}%, ${colors.cream} 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, ${colors.creamDark}${Math.round(fogOpacity * 255).toString(16).padStart(2, '0')}, ${colors.muted}${Math.round(fogOpacity * 200).toString(16).padStart(2, '0')})`,
          zIndex: 5,
        }}
      />

      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${colors.teal}15, transparent 70%)`,
          transform: `scale(${glowPulse})`,
        }}
      />

      <div style={{ zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Img
          src={staticFile("images/logo.png")}
          style={{
            height: 130,
            opacity: logoOpacity,
            transform: `scale(${logoScale})`,
            marginBottom: 40,
          }}
        />

        <div
          style={{
            fontFamily: fonts.display,
            fontSize: 72,
            fontWeight: 700,
            color: colors.teal,
            opacity: mainOpacity,
            transform: `scale(${mainScale})`,
            textAlign: "center",
            maxWidth: 1100,
            lineHeight: 1.15,
          }}
        >
          Meet your AI-powered
          <br />
          Risk & Resilience Hub.
        </div>

        <div
          style={{
            fontFamily: fonts.body,
            fontSize: 34,
            color: colors.navyLight,
            opacity: subOpacity,
            marginTop: 35,
            textAlign: "center",
            maxWidth: 800,
            lineHeight: 1.5,
          }}
        >
          An agentic AI that works like your personal
          <br />
          <span style={{ fontWeight: 700, color: colors.navy }}>auditor, CFO, and risk advisor — combined.</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
