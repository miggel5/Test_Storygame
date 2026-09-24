export type Flags = Record<string, boolean | string | number>;

export interface FlagCondition {
  flag: string;
  equals: boolean | string | number;
}

/** One weighted possibility inside a random transition. */
export interface RandomOption {
  next: string;
  /** Relative weight; defaults to 1. */
  weight?: number;
  /** Flags to set only if this particular option is picked. */
  setFlags?: Flags;
}

/** A fixed scene id, or a weighted random pick among several. */
export type NextRef = string | { random: RandomOption[] };

/** The shape every interaction outcome (choice, question, conversation) resolves to. */
export interface Transition {
  next: NextRef;
  /** Flags to set regardless of which random option (if any) is picked. */
  setFlags?: Flags;
}

export interface Choice extends Transition {
  /** Stable key for React lists; recommended when two choices could share text. */
  id?: string;
  text: string;
  /** Choice is only shown if this condition is met (or if omitted). */
  condition?: FlagCondition;
}

export interface GlowPixel {
  x: number;
  y: number;
  /** Hex color; defaults to an ember accent if omitted. */
  color?: string;
  animation?: "pulse" | "flicker" | "sparkle";
}

export interface PixelArtSpec {
  width: number;
  height: number;
  /** Hex colors, indexed by the values in `pixels`. */
  palette: string[];
  /** [height][width] grid of palette indices; -1 means transparent. */
  pixels: number[][];
  glowPixels?: GlowPixel[];
}

export interface SceneBase {
  text: string;
  image?: PixelArtSpec;
}

export interface ChoiceScene extends SceneBase {
  interaction: "choice";
  choices: Choice[];
}

export interface QuestionScene extends SceneBase {
  interaction: "question";
  acceptedAnswers: string[];
  onCorrect: Transition;
  /** Can point back at this scene's own id to make the player retry. */
  onIncorrect: Transition;
  maxAttempts?: number;
}

export type ConversationOutcome = "success" | "failure" | "twist";

export interface ConversationScene extends SceneBase {
  interaction: "conversation";
  characterName: string;
  /** Persona, backstory, and win/fail/twist conditions for the LLM. */
  systemPrompt: string;
  /** Shown immediately without a backend call. */
  greeting?: string;
  outcomeTransitions: {
    success: Transition;
    failure: Transition;
    /** Optional - most conversations only need success/failure. */
    twist?: Transition;
  };
  /** Safety cap; forces the failure transition once reached. */
  maxTurns?: number;
}

export type EndingCategory = "death" | "bad" | "neutral" | "good" | "twist";

export interface EndingScene extends SceneBase {
  interaction: "ending";
  endingCategory: EndingCategory;
}

export type Scene = ChoiceScene | QuestionScene | ConversationScene | EndingScene;

export interface Story {
  title: string;
  start: string;
  scenes: Record<string, Scene>;
}
