import type { AppState, Desk } from "../types";

export const demoDesk: Desk = {
  id: "desk-apartment-selection",
  title: "Where should I live?",
  createdAt: "2026-09-03T00:00:00.000Z",
  options: [
    {
      id: "option-westview",
      name: "Westview",
      source: "human",
      thoughts: [
        {
          id: "thought-westview-neighborhood",
          text: "Great neighborhood",
          type: "pro",
          weight: 5,
          pinned: true,
          source: "human",
        },
        {
          id: "thought-westview-expensive",
          text: "Expensive",
          type: "con",
          weight: 3,
          pinned: false,
          source: "human",
        },
      ],
    },
    {
      id: "option-parkline",
      name: "Parkline",
      source: "human",
      thoughts: [
        {
          id: "thought-parkline-friends",
          text: "Friends live nearby",
          type: "pro",
          weight: 5,
          pinned: true,
          source: "human",
        },
        {
          id: "thought-parkline-commute",
          text: "Longer commute",
          type: "con",
          weight: 3,
          pinned: false,
          source: "human",
        },
      ],
    },
    {
      id: "option-the-grove",
      name: "The Grove",
      source: "human",
      thoughts: [
        {
          id: "thought-the-grove-bedroom",
          text: "Large bedroom",
          type: "pro",
          weight: 2,
          pinned: false,
          source: "human",
        },
        {
          id: "thought-the-grove-light",
          text: "Dark bedroom",
          type: "con",
          weight: 4,
          pinned: false,
          source: "human",
        },
      ],
    },
  ],
  considerations: [
    {
      id: "consideration-lease-flexibility",
      text: "How flexible is the lease?",
      source: "agent",
    },
    {
      id: "consideration-utilities",
      text: "Are utilities included?",
      source: "agent",
    },
    {
      id: "consideration-noise",
      text: "How noisy is the area at night?",
      source: "agent",
    },
  ],
};

export const demoAppState: AppState = {
  desks: [demoDesk],
  currentDeskId: demoDesk.id,
};
