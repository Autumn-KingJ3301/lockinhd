import React from "react";

export interface WindDownActivityPlugin {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  component: React.ComponentType<{
    onComplete: (moodRatingAfter: number) => void;
    onCancel: () => void;
  }>;
}
