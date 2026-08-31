// One stage in a chained multi-stage run: a game-agnostic sequencing id.
// Games with per-stage scoring config (e.g. a par or difficulty) extend this
// with their own fields rather than the games package assuming any exist.
export interface RunStage {
  stageId: string;
}
