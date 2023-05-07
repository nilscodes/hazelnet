import { DiscordRequiredRole } from '../discordRequiredRole';

export type Quiz = {
  name: string
  displayName: string,
  id: number
  description: string,
  requiredRoles: DiscordRequiredRole[]
  createTime?: string
  openAfter?: string
  openUntil?: string
  channelId?: string
  messageId?: string
  creator: number
  winnerCount: number
  archived: boolean
  logoUrl?: string
  awardedRole?: string
  attemptsPerQuestion: number
  correctAnswersRequired: number
};
