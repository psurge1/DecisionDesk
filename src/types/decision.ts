export type ContentSource = "human" | "agent";

export type ThoughtType = "pro" | "con";

export type ThoughtWeight = 1 | 2 | 3 | 4 | 5;

export type AppState = {
  desks: Desk[];
  currentDeskId: string | null;
};

export type Desk = {
  id: string;
  title: string;
  createdAt: string;
  options: Option[];
  considerations: Consideration[];
};

export type Option = {
  id: string;
  name: string;
  source: ContentSource;
  thoughts: Thought[];
};

export type Thought = {
  id: string;
  text: string;
  type: ThoughtType;
  weight: ThoughtWeight;
  pinned: boolean;
  source: ContentSource;
};

export type Consideration = {
  id: string;
  text: string;
  source: ContentSource;
  relatedOptionIds?: string[];
};
