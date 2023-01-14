import { MessageCollector } from "discord.js"

export type Poll = {
  name: string
  displayName: string
  id: number
  description: string
  options: PollOption[]
  requiredRoles: DiscordRequiredRole[]
  createTime: string
  openAfter: string
  openUntil: string
  channelId?: string
  messageId?: string
  creator: number
  resultsVisible: boolean
  multipleVotes: boolean
  weighted: boolean
  snapshotId?: number
  voteaireUUID?: string
  archived: boolean
}

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
  optionCollector?: MessageCollector
}

export type PollOption = {
  id: string
  reactionId: string
  reactionName: string
  text: string
}

export type DiscordRequiredRole = {
  roleId: string
}