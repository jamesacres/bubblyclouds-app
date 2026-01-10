export interface Notes {
  [key: number]: boolean;
}

export type ToggleNote = (_value: number) => void;
