import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";

import { Scene1Hook } from "./scenes/Scene1Hook";
import { Scene2Reality } from "./scenes/Scene2Reality";
import { Scene3Shift } from "./scenes/Scene3Shift";
import { Scene4Promise } from "./scenes/Scene4Promise";
import { Scene5Trust } from "./scenes/Scene5Trust";
import { Scene6Close } from "./scenes/Scene6Close";

import { loadFont as loadJakarta } from "@remotion/google-fonts/PlusJakartaSans";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

loadJakarta();
loadInter();

// Scene durations (frames at 30fps)
// Scene1: 150 (5s) — Hook
// Scene2: 360 (12s) — Reality/pain
// Scene3: 270 (9s) — The Shift
// Scene4: 420 (14s) — Promise
// Scene5: 300 (10s) — Trust
// Scene6: 450 (15s) — Close
// Transitions: 5 x 30 frames = 150 frames overlap
// Total: 150+360+270+420+300+450 - 150 = 1800 frames = 60s
// But user wants up to 3 min (5400 frames). Let me expand scenes for breathing room.

// Expanded for ~90s (2700 frames):
// Scene1: 300 (10s), Scene2: 480 (16s), Scene3: 360 (12s)
// Scene4: 540 (18s), Scene5: 420 (14s), Scene6: 750 (25s)
// Transitions: 5 x 30 = 150 overlap
// Total: 300+480+360+540+420+750 - 150 = 2700 ✓

export const MainVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={300}>
          <Scene1Hook />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 30 })}
        />

        <TransitionSeries.Sequence durationInFrames={480}>
          <Scene2Reality />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 30 })}
        />

        <TransitionSeries.Sequence durationInFrames={360}>
          <Scene3Shift />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-left" })}
          timing={linearTiming({ durationInFrames: 30 })}
        />

        <TransitionSeries.Sequence durationInFrames={540}>
          <Scene4Promise />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 30 })}
        />

        <TransitionSeries.Sequence durationInFrames={420}>
          <Scene5Trust />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 30 })}
        />

        <TransitionSeries.Sequence durationInFrames={750}>
          <Scene6Close />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
