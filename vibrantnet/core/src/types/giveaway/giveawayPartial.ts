import { DiscordRequiredRole } from '../discordRequiredRole';
import { Giveaway } from './giveaway';
import { GiveawayDrawType } from './giveawayDrawType';

export interface GiveawayPartial extends Omit<Giveaway, 'description' | 'id' | 'createTime' | 'snapshotIds' | 'archived' | 'name' | 'winnerCount' | 'displayName' | 'creator' | 'drawType' | 'requiredRoles'> {
  name?: string
  displayName?: string,
  description?: string
  tokenType?: string
  assetFingerprint?: string
  policyId?: string
  snapshotIds?: number[]
  requiredRoles?: DiscordRequiredRole[]
  drawType?: GiveawayDrawType
  winnerCount?: number
  archived?: boolean
}
