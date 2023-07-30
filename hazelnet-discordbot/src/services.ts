import { AccountsApi, ClaimListsApi, DiscordBanApi, DiscordServerApi, DiscordQuizApi, ExternalAccountsApi, GlobalSettingsApi, CardanoInfoApi, PingsApi, SnapshotsApi, VerificationsApi, RemindersApi } from '@vibrantnet/core';

export default {
  discordserver: new DiscordServerApi(process.env.HAZELNET_COMMUNITY_URL!),
  discordquiz: new DiscordQuizApi(process.env.HAZELNET_COMMUNITY_URL!),
  discordbans: new DiscordBanApi(process.env.HAZELNET_COMMUNITY_URL!),
  globalsettings: new GlobalSettingsApi(process.env.HAZELNET_COMMUNITY_URL!),
  accounts: new AccountsApi(process.env.HAZELNET_COMMUNITY_URL!),
  externalaccounts: new ExternalAccountsApi(process.env.HAZELNET_COMMUNITY_URL!),
  pings: new PingsApi(process.env.HAZELNET_COMMUNITY_URL!),
  verifications: new VerificationsApi(process.env.HAZELNET_COMMUNITY_URL!),
  cardanoinfo: new CardanoInfoApi(process.env.HAZELNET_CONNECT_URL!),
  claimlists: new ClaimListsApi(process.env.HAZELNET_COMMUNITY_URL!),
  snapshots: new SnapshotsApi(process.env.HAZELNET_COMMUNITY_URL!),
  reminders: new RemindersApi(process.env.HAZELNET_COMMUNITY_URL!),
};
