import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { colors, fonts } from "../theme";
import { FloatingOrb } from "../components/FloatingOrb";

const capabilities = [
  { title: "Daily Risk Briefings", desc: "Your AI agent scans your business daily and tells you what needs attention", icon: "📋", delay: 15 },
  { title: "Smart Recommendations", desc: "Prioritised action items with clear next steps — like a CFO in your pocket", icon: "🎯", delay: 35 },
  { title: "Regulatory Radar", desc: "Auto-tracks POPIA, tax law changes, BBBEE updates — so you never fall behind", icon: "📡", delay: 55 },
  { title: "Risk Heat Maps & Registers", desc: "Visual tools that show your exposure across every domain at a glance", icon: "🗺️", delay: 75 },
  { title: "Stress Testing & Scenarios", desc: "What-if analysis on cash flow, suppliers, and market shifts", icon: "⚡", delay: 95 },
];

export const Scene5Trust: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleProgress = spring({ frame: frame - 5, fps, config: { damping: 25 } });
  const titleOpacity = interpolate(titleProgress, [0, 1], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${colors.cream} 0%, ${colors.creamDark} 50%, hsl(168, 55%, 95%) 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
      }}
    >
      <FloatingOrb x={1500} y={200} size={250} color={colors.teal} speed={0.015} amplitude={12} />
      <FloatingOrb x={200} y={700} size={200} color={colors.tealLight} speed={0.02} amplitude={15} />

      <div style={{ zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
        <div
          style={{
            fontFamily: fonts.display,
            fontSize: 60,
            fontWeight: 700,
            color: colors.navy,
            opacity: titleOpacity,
            marginBottom: 50,
            textAlign: "center",
            lineHeight: 1.2,
          }}
        >
          Your AI agent <span style={{ color: colors.teal }}>works for you</span>
          <br />
          around the clock.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 1000 }}>
          {capabilities.map((cap, i) => {
            const pProgress = spring({
              frame: frame - cap.delay,
              fps,
              config: { damping: 22, stiffness: 100 },
            });
            const pOpacity = interpolate(pProgress, [0, 1], [0, 1]);
            const pX = interpolate(pProgress, [0, 1], [i % 2 === 0 ? -50 : 50, 0]);

            return (
              <div
                key={i}
                style={{
                  opacity: pOpacity,
                  transform: `translateX(${pX}px)`,
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                  padding: "20px 32px",
                  background: `linear-gradient(135deg, ${colors.white}F0, ${colors.creamDark}D0)`,
                  borderRadius: 16,
                  border: `1px solid ${colors.teal}25`,
                  boxShadow: `0 4px 16px ${colors.teal}08`,
                }}
              >
                <span style={{ fontSize: 40, flexShrink: 0 }}>{cap.icon}</span>
                <div>
                  <div style={{ fontFamily: fonts.display, fontSize: 26, fontWeight: 700, color: colors.navy }}>
                    {cap.title}
                  </div>
                  <div style={{ fontFamily: fonts.body, fontSize: 20, color: colors.muted, marginTop: 4 }}>
                    {cap.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
