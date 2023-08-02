import { DiscordServerMemberPledge } from './discordServerMemberPledge';

export type ExternalAccountPremiumInfo = {
  discordServers: DiscordServerMemberPledge[],
  stakeAmount: number,
  tokenBalance: number,
  premium: boolean
};
