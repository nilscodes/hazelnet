import { DiscordRequiredRole } from '../discordRequiredRole';
import { PollOption } from './pollOption';

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
};
