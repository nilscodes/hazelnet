import { DiscordRequiredRole } from '../discordRequiredRole';
import { Poll } from './poll';

export interface PollPartial extends Omit<Poll, 'id' | 'createTime' | 'archived' | 'requiredRoles' | 'description' | 'options' | 'openAfter' | 'openUntil' | 'name' | 'displayName' | 'creator' | 'weighted' | 'resultsVisible' | 'multipleVotes'> {
  name?: string
  displayName?: string
  description?: string
  tokenType?: string
  requiredRoles?: DiscordRequiredRole[]
  assetFingerprint?: string
  openAfter?: string
  openUntil?: string
  policyId?: string
  options?: any[]
  snapshotId?: number
  resultsVisible?: boolean
  multipleVotes?: boolean
  weighted?: boolean
}
