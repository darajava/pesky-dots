export declare type Point = number;
export declare type Position = [number, number];
export declare type Board = Point[][];
export declare type GameState = {
    board?: Board;
    score?: {
        black: number;
        white: number;
    };
};
export declare type UpdateState = {
    board: Board;
    movedFrom?: (Position | undefined)[];
    movedTo?: (Position | undefined)[];
};
