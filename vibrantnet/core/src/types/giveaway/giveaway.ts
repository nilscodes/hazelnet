import { DiscordRequiredRole } from '../discordRequiredRole';
import { GiveawayDrawType } from './giveawayDrawType';

export type Giveaway = {
  name: string
  displayName: string,
  id: number
  description: string,
  requiredRoles: DiscordRequiredRole[]
  createTime?: string
  openAfter?: string
  openUntil?: string
  snapshotTime?: string
  weighted?: boolean
  uniqueWinners?: boolean
  channelId?: string
  messageId?: string
  snapshotIds: number[]
  creator: number
  winnerCount: number
  drawType: GiveawayDrawType
  archived: boolean
  logoUrl?: string
};
