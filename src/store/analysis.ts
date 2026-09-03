import type { Desk, Option, Thought } from "../types";

export type DeskLean = {
  leadingOptionId: string | null;
  leadingOptionName: string | null;
  score: number | null;
  tiedOptionIds: string[];
};

export type OptionTradeoff = {
  optionId: string;
  optionName: string;
  score: number;
  proWeight: number;
  conWeight: number;
  strongestPros: Thought[];
  strongestCons: Thought[];
};

export type TradeoffSummary = {
  deskId: string;
  deskTitle: string;
  lean: DeskLean;
  openConsiderationCount: number;
  options: OptionTradeoff[];
};

function getThoughtsByStrength(option: Option, type: Thought["type"], limit: number): Thought[] {
  return option.thoughts
    .map((thought, index) => ({ thought, index }))
    .filter(({ thought }) => thought.type === type)
    .sort((left, right) => right.thought.weight - left.thought.weight || left.index - right.index)
    .slice(0, Math.max(0, limit))
    .map(({ thought }) => thought);
}

export function getOptionScore(option: Option): number {
  return option.thoughts.reduce(
    (score, thought) => score + (thought.type === "pro" ? thought.weight : -thought.weight),
    0,
  );
}

export function getDeskLean(desk: Desk): DeskLean {
  if (desk.options.length === 0) {
    return {
      leadingOptionId: null,
      leadingOptionName: null,
      score: null,
      tiedOptionIds: [],
    };
  }

  const scoredOptions = desk.options.map((option) => ({ option, score: getOptionScore(option) }));
  const highestScore = Math.max(...scoredOptions.map(({ score }) => score));
  const leaders = scoredOptions.filter(({ score }) => score === highestScore);
  const hasSingleLeader = leaders.length === 1;

  return {
    leadingOptionId: hasSingleLeader ? leaders[0].option.id : null,
    leadingOptionName: hasSingleLeader ? leaders[0].option.name : null,
    score: highestScore,
    tiedOptionIds: hasSingleLeader ? [] : leaders.map(({ option }) => option.id),
  };
}

export function getStrongestPros(option: Option, limit = 3): Thought[] {
  return getThoughtsByStrength(option, "pro", limit);
}

export function getStrongestCons(option: Option, limit = 3): Thought[] {
  return getThoughtsByStrength(option, "con", limit);
}

export function getOpenConsiderationCount(desk: Desk): number {
  return desk.considerations.length;
}

export function getTradeoffSummary(desk: Desk): TradeoffSummary {
  return {
    deskId: desk.id,
    deskTitle: desk.title,
    lean: getDeskLean(desk),
    openConsiderationCount: getOpenConsiderationCount(desk),
    options: desk.options.map((option) => {
      const proWeight = option.thoughts
        .filter((thought) => thought.type === "pro")
        .reduce((total, thought) => total + thought.weight, 0);
      const conWeight = option.thoughts
        .filter((thought) => thought.type === "con")
        .reduce((total, thought) => total + thought.weight, 0);

      return {
        optionId: option.id,
        optionName: option.name,
        score: proWeight - conWeight,
        proWeight,
        conWeight,
        strongestPros: getStrongestPros(option),
        strongestCons: getStrongestCons(option),
      };
    }),
  };
}
