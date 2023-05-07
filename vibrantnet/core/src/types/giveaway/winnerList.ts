import { GiveawayDrawType } from './giveawayDrawType';

export type WinnerList = {
  winners: string[]
  winnerCount: number
  winnerType: GiveawayDrawType
};
