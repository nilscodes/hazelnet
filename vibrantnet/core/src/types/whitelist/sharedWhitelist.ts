import { SharedWhitelistSignup } from './sharedWhitelistSignup';
import { WhitelistType } from './whitelistType';

export type SharedWhitelist = {
  guildId: string
  guildName: string
  whitelistName: string
  whitelistDisplayName: string
  type: WhitelistType
  signups: SharedWhitelistSignup[],
};
