import React from "react";
import type { WindDownActivityPlugin } from "./types";
import { BreathingActivity } from "./activities/BreathingActivity";
import { MeditationActivity } from "./activities/MeditationActivity";
import { StretchingActivity } from "./activities/StretchingActivity";

// Create custom SVG element renderers for clean icon styling without external dependency
const BreathingIcon = React.createElement(
  "svg",
  {
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: { display: "block" }
  },
  React.createElement("circle", { cx: "12", cy: "12", r: "10" }),
  React.createElement("path", { d: "M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" }),
  React.createElement("path", { d: "M2 12h20" })
);

const MeditationIcon = React.createElement(
  "svg",
  {
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: { display: "block" }
  },
  React.createElement("path", { d: "M12 2a3 3 0 1 0 0 6 3 3 0 1 0 0-6z" }),
  React.createElement("path", { d: "M6 20h12" }),
  React.createElement("path", { d: "M18 17a6 6 0 0 1-12 0" }),
  React.createElement("path", { d: "M12 8v9" }),
  React.createElement("path", { d: "m9 11 3 3 3-3" })
);

const StretchingIcon = React.createElement(
  "svg",
  {
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: { display: "block" }
  },
  React.createElement("circle", { cx: "18", cy: "6", r: "2" }),
  React.createElement("path", { d: "m14 10-4 1 1 4 3 4" }),
  React.createElement("path", { d: "M9 17v4" }),
  React.createElement("path", { d: "M6 10v4" }),
  React.createElement("path", { d: "M14 6H8a2 2 0 0 0-2 2v6" })
);

export const activityRegistry: WindDownActivityPlugin[] = [
  {
    id: "breathing",
    name: "Box Breathing",
    description: "Relax your nervous system with a simple 4x4 cyclic breathing pattern.",
    icon: BreathingIcon,
    component: BreathingActivity
  },
  {
    id: "meditation",
    name: "Mindful Meditation",
    description: "Calm your thoughts with ambient tones and visual ripples on canvas.",
    icon: MeditationIcon,
    component: MeditationActivity
  },
  {
    id: "stretching",
    name: "Desk Stretching",
    description: "Release physical tension from neck, shoulders, and wrists.",
    icon: StretchingIcon,
    component: StretchingActivity
  }
];
