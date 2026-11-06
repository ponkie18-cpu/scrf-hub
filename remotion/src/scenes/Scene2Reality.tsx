import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { colors, fonts } from "../theme";
import { FloatingOrb } from "../components/FloatingOrb";

const problems = [
  { text: "No dedicated risk team or CFO on staff", icon: "🚨", delay: 0 },
  { text: "Regulations change — you find out too late", icon: "📋", delay: 18 },
  { text: "Cash flow blind spots that cost you", icon: "💸", delay: 36 },
  { text: "Cyber threats you can't see coming", icon: "🔓", delay: 54 },
  { text: "Decisions made on gut feel, not data", icon: "🎯", delay: 72 },
];

const ProblemItem: React.FC<{ text: string; icon: string; delay: number; index: number }> = ({
  text, icon, delay, index,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame: frame - delay, fps, config: { damping: 20, stiffness: 100 } });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const x = interpolate(enter, [0, 1], [index % 2 === 0 ? -60 : 60, 0]);

  return (
    <div
      style={{
        opacity,
        transform: `translateX(${x}px)`,
        display: "flex",
        alignItems: "center",
        gap: 24,
        padding: "22px 36px",
        background: `linear-gradient(135deg, ${colors.white}E0, ${colors.creamDark}C0)`,
        borderRadius: 16,
        border: `1px solid ${colors.coral}30`,
        boxShadow: `0 4px 20px ${colors.coral}10`,
      }}
    >
      <span style={{ fontSize: 42 }}>{icon}</span>
      <span
        style={{
          fontFamily: fonts.body,
          fontSize: 32,
          color: colors.navy,
          fontWeight: 500,
        }}
      >
        {text}
      </span>
    </div>
  );
};

export const Scene2Reality: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleProgress = spring({ frame: frame - 5, fps, config: { damping: 25 } });
  const titleOpacity = interpolate(titleProgress, [0, 1], [0, 1]);
  const titleY = interpolate(titleProgress, [0, 1], [40, 0]);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${colors.cream} 0%, ${colors.creamDark} 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <FloatingOrb x={100} y={100} size={200} color={colors.coral} speed={0.025} amplitude={10} />
      <FloatingOrb x={1500} y={700} size={180} color={colors.coral} speed={0.02} amplitude={15} />

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 10, width: "100%" }}>
        <div
          style={{
            fontFamily: fonts.display,
            fontSize: 62,
            fontWeight: 700,
            color: colors.navy,
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            marginBottom: 50,
            textAlign: "center",
          }}
        >
          SMEs face <span style={{ color: colors.coral }}>enterprise-level risks</span>
          <br />
          without enterprise-level resources.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 900 }}>
          {problems.map((w, i) => (
            <ProblemItem key={i} {...w} index={i} />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
