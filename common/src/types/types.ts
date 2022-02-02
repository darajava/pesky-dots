export type Point = number;
export type Position = [number, number];

export type Board = Point[][];

export type GameState = {
  board?: Board;
  score?: { black: number; white: number };
};

export type UpdateState = {
  board: Board;
  movedFrom?: (Position | undefined)[];
  movedTo?: (Position | undefined)[];
};
