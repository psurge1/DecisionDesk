export type DemoThought = {
  text: string;
  type: "pro" | "con";
  weight: number;
  pinned?: boolean;
  source?: "human" | "agent";
};

export type DemoOption = {
  name: string;
  thoughts: DemoThought[];
};

export const demoDesk: {
  title: string;
  eyebrow: string;
  description: string;
  options: DemoOption[];
  considerations: string[];
} = {
  title: "Where should I live?",
  eyebrow: "A decision desk",
  description: "A place to gather what matters before choosing a new home.",
  options: [
    {
      name: "Westview",
      thoughts: [
        { text: "Great neighborhood", type: "pro", weight: 5, pinned: true },
        { text: "Expensive", type: "con", weight: 3 },
      ],
    },
    {
      name: "Parkline",
      thoughts: [
        { text: "Friends live nearby", type: "pro", weight: 5, pinned: true },
        { text: "Longer commute", type: "con", weight: 3 },
      ],
    },
    {
      name: "The Grove",
      thoughts: [
        { text: "Large bedroom", type: "pro", weight: 2 },
        { text: "Dark bedroom", type: "con", weight: 4 },
      ],
    },
  ],
  considerations: [
    "How flexible is the lease?",
    "Are utilities included?",
    "How noisy is the area at night?",
  ],
};
