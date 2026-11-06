import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { colors, fonts } from "../theme";
import { FloatingOrb } from "../components/FloatingOrb";

const domains = [
  { name: "Operational", desc: "Protect daily operations & processes", color: "#3B82F6", icon: "⚙️", score: 72 },
  { name: "Financial & Tax", desc: "Cash flow, forecasting & tax health", color: "#22C55E", icon: "📊", score: 68 },
  { name: "Compliance & Legal", desc: "POPIA, BBBEE, contracts & regulations", color: "#A855F7", icon: "📜", score: 81 },
  { name: "Strategic & Cyber", desc: "Cyber threats, market risks & partnerships", color: "#F59E0B", icon: "🛡️", score: 55 },
];

export const Scene4Promise: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleProgress = spring({ frame: frame - 10, fps, config: { damping: 25 } });
  const titleOpacity = interpolate(titleProgress, [0, 1], [0, 1]);
  const titleY = interpolate(titleProgress, [0, 1], [30, 0]);

  const subProgress = spring({ frame: frame - 30, fps, config: { damping: 25 } });

  // Overall score animation
  const scoreProgress = spring({ frame: frame - 45, fps, config: { damping: 15, stiffness: 60 } });
  const overallScore = Math.round(interpolate(scoreProgress, [0, 1], [0, 69]));

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${colors.navy} 0%, ${colors.navyLight} 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
      }}
    >
      <FloatingOrb x={100} y={100} size={300} color={colors.teal} speed={0.012} amplitude={15} />
      <FloatingOrb x={1500} y={700} size={250} color={colors.coral} speed={0.015} amplitude={20} />

      <div style={{ zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div
          style={{
            fontFamily: fonts.display,
            fontSize: 58,
            fontWeight: 700,
            color: colors.white,
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            textAlign: "center",
            maxWidth: 1100,
            lineHeight: 1.2,
            marginBottom: 10,
          }}
        >
          Your <span style={{ color: colors.tealLight }}>Resilience Health Score</span>
        </div>

        <div
          style={{
            fontFamily: fonts.body,
            fontSize: 30,
            color: `${colors.white}B0`,
            opacity: interpolate(subProgress, [0, 1], [0, 1]),
            textAlign: "center",
            maxWidth: 800,
            marginBottom: 40,
          }}
        >
          One score. Four risk domains. Always up to date.
        </div>

        {/* Overall score circle */}
        <div
          style={{
            width: 160,
            height: 160,
            borderRadius: "50%",
            border: `6px solid ${colors.tealLight}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            marginBottom: 50,
            opacity: interpolate(scoreProgress, [0, 0.3], [0, 1], { extrapolateRight: "clamp" }),
            boxShadow: `0 0 40px ${colors.teal}30`,
          }}
        >
          <div style={{ fontFamily: fonts.display, fontSize: 64, fontWeight: 700, color: colors.tealLight }}>
            {overallScore}
          </div>
          <div style={{ fontFamily: fonts.body, fontSize: 16, color: `${colors.white}90`, marginTop: -6 }}>
            / 100
          </div>
        </div>

        {/* Four domains */}
        <div style={{ display: "flex", gap: 28 }}>
          {domains.map((d, i) => {
            const cardProgress = spring({
              frame: frame - 70 - i * 12,
              fps,
              config: { damping: 18, stiffness: 100 },
            });
            const cardOpacity = interpolate(cardProgress, [0, 1], [0, 1]);
            const cardY = interpolate(cardProgress, [0, 1], [50, 0]);
            const domainScore = Math.round(interpolate(cardProgress, [0, 1], [0, d.score]));
            const breathe = Math.sin((frame - i * 10) * 0.04) * 3;

            return (
              <div
                key={i}
                style={{
                  opacity: cardOpacity,
                  transform: `translateY(${cardY + breathe}px)`,
                  width: 240,
                  padding: "28px 22px",
                  background: `${colors.white}10`,
                  borderRadius: 20,
                  border: `1px solid ${d.color}40`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 44 }}>{d.icon}</span>
                <div style={{ fontFamily: fonts.display, fontSize: 22, fontWeight: 700, color: d.color }}>
                  {d.name}
                </div>
                <div style={{ fontFamily: fonts.display, fontSize: 36, fontWeight: 700, color: colors.white }}>
                  {domainScore}
                </div>
                <div style={{ fontFamily: fonts.body, fontSize: 15, color: `${colors.white}80`, textAlign: "center" }}>
                  {d.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
