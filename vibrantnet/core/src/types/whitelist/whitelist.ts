import { BlockchainType } from '../blockchainType';
import { DiscordRequiredRole } from '../discordRequiredRole';
import { WhitelistType } from './whitelistType';

export type Whitelist = {
  id: number
  name: string
  displayName: string
  creator: string
  requiredRoles: DiscordRequiredRole[]
  blockchains: BlockchainType[]
  awardedRole?: string
  createTime: string
  type: WhitelistType
  signupAfter: string
  signupUntil: string
  launchDate?: string
  maxUsers: number
  currentUsers: number
  closed: boolean
  sharedWithServer: number
  logoUrl?: string
};
