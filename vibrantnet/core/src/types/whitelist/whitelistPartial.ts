import { BlockchainType } from '../blockchainType';
import { DiscordRequiredRole } from '../discordRequiredRole';

export type WhitelistPartial = {
  displayName?: string | null
  maxUsers?: number | null
  signupAfter?: string | null
  signupUntil?: string | null
  closed?: boolean | null
  sharedWithServer?: number | null
  launchDate?: string | null
  logoUrl?: string | null
  awardedRole?: string | null
  requiredRoles?: DiscordRequiredRole[] | null
  blockchain?: BlockchainType[] | null
};
