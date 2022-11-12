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
  closed?: boolean
}

export interface PollPartial extends Omit<Poll, 'description' | 'options'> {
  description?: string
  tokenType?: string
  assetFingerprint?: string
  policyId?: string
  options?: any[]
  snapshotId?: number
  weighted?: boolean
  optionCollector?: MessageCollector
}

export type PollOption = {
  reactionId: string
  reactionName: string
  text: string
}

export type DiscordRequiredRole = {
  roleId: string
}