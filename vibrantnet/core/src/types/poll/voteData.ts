export type VoteData = {
  votes: VoteMap
  voterCount: number
};

type VoteMap = {
  [index: string]: number
};
