export type Flags = Record<string, boolean | string | number>;

export interface FlagCondition {
  flag: string;
  equals: boolean | string | number;
}

export interface Choice {
  text: string;
  next: string;
  /** Choice is only shown if this condition is met (or if omitted). */
  condition?: FlagCondition;
  /** Flags to set when this choice is picked. */
  setFlags?: Flags;
}

export interface Scene {
  text: string;
  /** True if reaching this scene ends the game (no choices shown). */
  ending?: boolean;
  choices?: Choice[];
}

export interface Story {
  title: string;
  start: string;
  scenes: Record<string, Scene>;
}
