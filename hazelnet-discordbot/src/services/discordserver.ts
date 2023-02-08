import axios from "axios";
import NodeCache from "node-cache";
import { Giveaway, GiveawayPartial, ParticipationData, WinnerList } from "../utility/giveaway";
import { DiscordRequiredRole, Poll, PollPartial } from "../utility/polltypes";
import { ActivityMap, AttributeOperatorType, DelegatorRole, DiscordGiveawayUpdate, DiscordMarketplaceChannelType, DiscordMemberPartial, DiscordMintCounterUpdate, DiscordPollUpdate, DiscordRoleAssignment, DiscordRoleCounterUpdate, DiscordServer, DiscordServerMember as DiscordMember, DiscordServerPartial, DiscordServerPremiumInfo, DiscordWidgetUpdate, IncomingDiscordPayment, Marketplace, MarketplaceChannel, MetadataFilter, SharedWhitelist, SharedWhitelistSignup, Stakepool, TokenMetadata, TokenOwnershipAggregationType, TokenOwnershipRole, TokenOwnershipRolePartial, TokenPolicy, TokenRoleAssetInfo, TokenStakingType, VoteData, Whitelist, WhitelistPartial, WhitelistSignupContainer, WhitelistType } from "../utility/sharedtypes";
import globalsettings from "./globalsettings";

const hazelCommunityUrl = process.env.HAZELNET_COMMUNITY_URL;

export default {
  cache: new NodeCache({ stdTTL: 600 }),
  async registerDiscordServer(guildId: string, guildName: string, guildOwner: string, guildMemberCount: number) {
    return axios.post(`${hazelCommunityUrl}/discord/servers`, {
      guildId,
      guildName,
      guildOwner,
      guildMemberCount,
    });
  },
  async getDiscordServer(guildId: string): Promise<DiscordServer> {
    const cachedDiscordServer = this.cache.get(`${guildId}`) as DiscordServer;
    if (cachedDiscordServer !== undefined) {
      return cachedDiscordServer;
    }
    const discordServer = await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}`);
    const discordServerObject = this.makeDiscordServerObject(discordServer.data);
    this.cache.set(`${guildId}`, discordServerObject);
    return discordServerObject;
  },
  async getDiscordServerByInternalId(serverId: number): Promise<DiscordServer> {
    const discordServer = await axios.get(`${hazelCommunityUrl}/discord/servers/${serverId}?byId=true`);
    const discordServerObject = await this.makeDiscordServerObject(discordServer.data);
    this.cache.set(`${discordServerObject.id}`, discordServerObject);
    return discordServerObject;
  },
  async updateDiscordServer(guildId: string, discordServerPartial: DiscordServerPartial): Promise<DiscordServer> {
    const discordServerPromise = await axios.patch(`${hazelCommunityUrl}/discord/servers/${guildId}`, discordServerPartial);
    const discordServerObject = this.makeDiscordServerObject(discordServerPromise.data);
    this.cache.set(`${guildId}`, discordServerObject);
    return discordServerObject;
  },
  async listExternalAccounts(guildId: string): Promise<DiscordMember[]> {
    const membersPromise = await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/members`);
    return membersPromise.data;
  },
  async connectExternalAccount(guildId: string, externalAccountId: string) {
    await axios.post(`${hazelCommunityUrl}/discord/servers/${guildId}/members`, {
      externalAccountId,
    });
    this.clearCacheEntry(guildId);
  },
  async getExternalAccountOnDiscord(guildId: string, externalAccountId: string): Promise<DiscordMember | null> {
    try {
      const memberPromise = await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/members/${externalAccountId}`);
      return memberPromise.data;
    } catch (error) {
      return null;
    }
  },
  async updateExternalAccountOnDiscord(guildId: string, externalAccountId: string, discordMemberPartial: DiscordMemberPartial): Promise<DiscordMember> {
    const memberPromise = await axios.patch(`${hazelCommunityUrl}/discord/servers/${guildId}/members/${externalAccountId}`, discordMemberPartial);
    return memberPromise.data;
  },
  async disconnectExternalAccount(guildId: string, externalAccountId: string, skipRoleUpdates: boolean) {
    await axios.delete(`${hazelCommunityUrl}/discord/servers/${guildId}/members/${externalAccountId}?skipRoleUpdates=${!!skipRoleUpdates}`);
    this.clearCacheEntry(guildId);
  },
  async getEligibleTokenRolesOfUser(guildId: string, externalAccountId: string): Promise<DiscordRoleAssignment[]> {
    const memberPromise = await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/members/${externalAccountId}/roleassignments/tokenroles`);
    return memberPromise.data;
  },
  async getEligibleDelegatorRolesOfUser(guildId: string, externalAccountId: string): Promise<DiscordRoleAssignment[]> {
    const memberPromise = await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/members/${externalAccountId}/roleassignments/delegatorroles`);
    return memberPromise.data;
  },
  async queueTokenRoleAssignments(guildId: string, externalAccountId: string) {
    await axios.post(`${hazelCommunityUrl}/discord/servers/${guildId}/members/${externalAccountId}/roleassignments/tokenroles`);
  },
  async queueDelegatorRoleAssignments(guildId: string, externalAccountId: string) {
    await axios.post(`${hazelCommunityUrl}/discord/servers/${guildId}/members/${externalAccountId}/roleassignments/delegatorroles`);
  },
  async updateDiscordServerSetting(guildId: string, settingName: string, settingValue: string) {
    await axios.put(`${hazelCommunityUrl}/discord/servers/${guildId}/settings/${settingName}`, {
      name: settingName,
      value: `${settingValue}`,
    });
    this.clearCacheEntry(guildId);
  },
  async deleteDiscordServerSetting(guildId: string, settingName: string) {
    await axios.delete(`${hazelCommunityUrl}/discord/servers/${guildId}/settings/${settingName}`);
    this.clearCacheEntry(guildId);
  },
  async deleteStakepool(guildId: string, poolToRemove: string) {
    await axios.delete(`${hazelCommunityUrl}/discord/servers/${guildId}/stakepools/${poolToRemove}`);
  },
  async deleteTokenPolicy(guildId: string, policyToRemove: string) {
    await axios.delete(`${hazelCommunityUrl}/discord/servers/${guildId}/tokenpolicies/${policyToRemove}`);
  },
  async deleteTokenRole(guildId: string, tokenRoleIdToRemove: number) {
    await axios.delete(`${hazelCommunityUrl}/discord/servers/${guildId}/tokenroles/${tokenRoleIdToRemove}`);
  },
  async deleteDelegatorRole(guildId: string, delegatorRoleIdToRemove: number) {
    await axios.delete(`${hazelCommunityUrl}/discord/servers/${guildId}/delegatorroles/${delegatorRoleIdToRemove}`);
  },
  async deleteWhitelist(guildId: string, whitelistIdToRemove: number) {
    await axios.delete(`${hazelCommunityUrl}/discord/servers/${guildId}/whitelists/${whitelistIdToRemove}`);
  },
  async listTokenPolicies(guildId: string): Promise<TokenPolicy[]> {
    return (await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/tokenpolicies`)).data;
  },
  async listStakepools(guildId: string): Promise<Stakepool[]> {
    return (await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/stakepools`)).data;
  },
  async listDelegatorRoles(guildId: string): Promise<DelegatorRole[]> {
    return (await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/delegatorroles`)).data;
  },
  async listTokenOwnershipRoles(guildId: string): Promise<TokenOwnershipRole[]> {
    return (await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/tokenroles`)).data;
  },
  async listWhitelists(guildId: string): Promise<Whitelist[]> {
    return (await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/whitelists`)).data;
  },
  async addStakepool(guildId: string, poolHash: string): Promise<any> {
    return axios.post(`${hazelCommunityUrl}/discord/servers/${guildId}/stakepools`, {
      poolHash,
    });
  },
  async addTokenPolicy(guildId: string, policyId: string, projectName: string): Promise<any> {
    return axios.post(`${hazelCommunityUrl}/discord/servers/${guildId}/tokenpolicies`, {
      policyId,
      projectName,
    });
  },
  async createTokenRole(guildId: string, policyId: string, minimumTokenQuantity: string, maximumTokenQuantity: string | null, discordRoleId: string, assetFingerprint: string | null): Promise<any> {
    return axios.post(`${hazelCommunityUrl}/discord/servers/${guildId}/tokenroles`, {
      minimumTokenQuantity,
      maximumTokenQuantity,
      roleId: discordRoleId,
      acceptedAssets: [{
        policyId,
        assetFingerprint,
      }],
    });
  },
  async updateTokenRole(guildId: string, tokenRoleId: number, acceptedAssets: TokenRoleAssetInfo[] | null, minimumTokenQuantity?: string | null, maximumTokenQuantity?: string | null, discordRoleId?: string, aggregationType?: TokenOwnershipAggregationType | null, stakingType?: TokenStakingType | null): Promise<TokenOwnershipRole> {
    return (await axios.patch(`${hazelCommunityUrl}/discord/servers/${guildId}/tokenroles/${tokenRoleId}`, {
      acceptedAssets,
      minimumTokenQuantity,
      maximumTokenQuantity,
      roleId: discordRoleId,
      aggregationType,
      stakingType,
    } as TokenOwnershipRolePartial)).data;
  },
  async addTokenRoleMetadataFilter(guildId: string, tokenRoleId: number, attributeName: string, operator: AttributeOperatorType, attributeValue: string): Promise<MetadataFilter> {
    return (await axios.post(`${hazelCommunityUrl}/discord/servers/${guildId}/tokenroles/${tokenRoleId}/metadatafilters`, {
      attributeName,
      operator,
      attributeValue,
    })).data;
  },
  async deleteTokenRoleMetadataFilter(guildId: string, tokenRoleId: number, filterIdToRemove: number) {
    axios.delete(`${hazelCommunityUrl}/discord/servers/${guildId}/tokenroles/${tokenRoleId}/metadatafilters/${filterIdToRemove}`);
  },
  async createDelegatorRole(guildId: string, poolHash: string | null, minimumStake: number, discordRoleId: string): Promise<any> {
    return axios.post(`${hazelCommunityUrl}/discord/servers/${guildId}/delegatorroles`, {
      poolHash,
      minimumStake,
      roleId: discordRoleId,
    });
  },
  async createPoll(guildId: string, pollObject: Poll): Promise<Poll> {
    return (await axios.post(`${hazelCommunityUrl}/discord/servers/${guildId}/polls`, pollObject)).data;
  },
  async updatePoll(guildId: string, pollId: number, discordPollPartial: PollPartial): Promise<Poll> {
    const discordPollPromise = await axios.patch(`${hazelCommunityUrl}/discord/servers/${guildId}/polls/${pollId}`, discordPollPartial);
    return discordPollPromise.data;
  },
  async createWhitelist(guildId: string, creator: string, name: string, displayName: string, type: WhitelistType, signupAfter: string | null, signupUntil: string | null, maxUsers: number | null, requiredRoles: DiscordRequiredRole[], awardedRole: string | undefined, launchDate: string | null, logoUrl: string | null): Promise<any> {
    return axios.post(`${hazelCommunityUrl}/discord/servers/${guildId}/whitelists`, {
      creator,
      displayName,
      name,
      type,
      signupAfter,
      signupUntil,
      maxUsers,
      requiredRoles,
      awardedRole,
      launchDate,
      logoUrl,
    });
  },
  async updateWhitelist(guildId: string, whitelistId: number, whitelistPartial: WhitelistPartial): Promise<Whitelist> {
    return (await axios.patch(`${hazelCommunityUrl}/discord/servers/${guildId}/whitelists/${whitelistId}`, whitelistPartial)).data;
  },
  async getSharedWhitelists(guildId: string, withSignups: boolean): Promise<SharedWhitelist[]> {
    return (await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/whitelists/shared?withSignups=${withSignups ? 'true' : 'false'}`)).data;
  },
  async getWhitelistSignupsForExternalAccount(guildId: string, whitelistId: number, externalAccountId: string): Promise<WhitelistSignupContainer> {
    const registrationPromise = await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/whitelists/${whitelistId}/signups/${externalAccountId}`);
    return {
      whitelistId,
      signup: registrationPromise.data,
    };
  },
  async registerForWhitelist(guildId: string, whitelistId: number, externalAccountId: string, address: string | null) {
    return axios.post(`${hazelCommunityUrl}/discord/servers/${guildId}/whitelists/${whitelistId}/signups`, {
      externalAccountId,
      address,
    });
  },
  async getWhitelistSignups(guildId: string, whitelistId: number): Promise<SharedWhitelistSignup[]> {
    return (await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/whitelists/${whitelistId}/signups`)).data;
  },
  async unregisterFromWhitelist(guildId: string, whitelistId: number, externalAccountId: string) {
    await axios.delete(`${hazelCommunityUrl}/discord/servers/${guildId}/whitelists/${whitelistId}/signups/${externalAccountId}`);
  },
  async listMarketplaceChannels(guildId: string): Promise<MarketplaceChannel[]> {
    return (await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/marketplaces/channels`)).data;
  },
  async createMarketplaceChannel(guildId: string, creator: string, type: DiscordMarketplaceChannelType, channelId: string, policyId: string, marketplace: Marketplace, minimumValue?: number | null, maximumValue?: number | null, highlightAttributeName?: string | null, highlightAttributeDisplayName?: string | null): Promise<MarketplaceChannel> {
    return (await axios.post(`${hazelCommunityUrl}/discord/servers/${guildId}/marketplaces/channels`, {
      creator,
      type,
      channelId,
      policyId,
      marketplaces: [marketplace],
      minimumValue,
      maximumValue,
      highlightAttributeName,
      highlightAttributeDisplayName,
    })).data;
  },
  async deleteMarketplaceChannel(guildId: string, marketplaceChannelId: number) {
    await axios.delete(`${hazelCommunityUrl}/discord/servers/${guildId}/marketplaces/channels/${marketplaceChannelId}`);
  },
  async addMarketplaceChannelMetadataFilter(guildId: string, marketplaceChannelId: number, attributeName: string, operator: AttributeOperatorType, attributeValue: string): Promise<MetadataFilter> {
    return (await axios.post(`${hazelCommunityUrl}/discord/servers/${guildId}/marketplaces/channels/${marketplaceChannelId}/metadatafilters`, {
      attributeName,
      operator,
      attributeValue,
    })).data;
  },
  async deleteMarketplaceChannelMetadataFilter(guildId: string, marketplaceChannelId: number, filterIdToRemove: number) {
    await axios.delete(`${hazelCommunityUrl}/discord/servers/${guildId}/marketplaces/channels/${marketplaceChannelId}/metadatafilters/${filterIdToRemove}`);
  },
  async getCurrentDelegatorRoleAssignments(guildId: string): Promise<DiscordRoleAssignment[]> {
    return (await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/roleassignments/delegatorroles`)).data;
  },
  async getCurrentTokenRoleAssignments(guildId: string): Promise<DiscordRoleAssignment[]> {
    return (await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/roleassignments/tokenroles`)).data;
  },
  async getCurrentWhitelistRoleAssignments(guildId: string): Promise<DiscordRoleAssignment[]> {
    return (await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/roleassignments/whitelistroles`)).data;
  },
  async getPolls(guildId: string): Promise<Poll[]> {
    return (await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/polls`)).data;
  },
  async getPoll(guildId: string, pollId: number): Promise<Poll> {
    return (await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/polls/${pollId}`)).data;
  },
  async deletePoll(guildId: string, pollId: number) {
    await axios.delete(`${hazelCommunityUrl}/discord/servers/${guildId}/polls/${pollId}`);
  },
  async getPollTokenMetadata(guildId: string, pollId: number): Promise<TokenMetadata> {
    return (await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/polls/${pollId}/tokenmetadata`)).data;
  },
  async getPollResults(guildId: string, pollId: number): Promise<VoteData> {
    return (await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/polls/${pollId}/votes`)).data;
  },
  async getVoteOfUser(guildId: string, pollId: number, externalAccountId: string): Promise<VoteData> {
    const votingData = await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/polls/${pollId}/votes/${externalAccountId}`);
    return votingData.data;
  },
  async setVoteForUser(guildId: string, pollId: number, externalAccountId: string, votes: number[]) {
    const votingData = await axios.post(`${hazelCommunityUrl}/discord/servers/${guildId}/polls/${pollId}/votes/${externalAccountId}`, votes);
    return votingData.data;
  },
  async createGiveaway(guildId: string, giveawayObject: Giveaway) {
    const newGiveawayPromise = await axios.post(`${hazelCommunityUrl}/discord/servers/${guildId}/giveaways`, giveawayObject);
    this.clearCacheEntry(guildId);
    return newGiveawayPromise.data;
  },
  async updateGiveaway(guildId: string, giveawayId: number, discordGiveawayPartial: GiveawayPartial): Promise<Giveaway> {
    const discordGiveawayPromise = await axios.patch(`${hazelCommunityUrl}/discord/servers/${guildId}/giveaways/${giveawayId}`, discordGiveawayPartial);
    return discordGiveawayPromise.data;
  },
  async getGiveaways(guildId: string): Promise<Giveaway[]> {
    const giveaways = await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/giveaways`);
    return giveaways.data;
  },
  async getGiveaway(guildId: string, giveawayId: number): Promise<Giveaway> {
    const giveaway = await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/giveaways/${giveawayId}`);
    return giveaway.data;
  },
  async deleteGiveaway(guildId: string, giveawayId: number) {
    await axios.delete(`${hazelCommunityUrl}/discord/servers/${guildId}/giveaways/${giveawayId}`);
  },
  async getParticipationForGiveaway(guildId: string, giveawayId: number): Promise<ParticipationData> {
    const giveawayParticipation = await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/giveaways/${giveawayId}/participation`);
    return giveawayParticipation.data;
  },
  async getParticipationOfUser(guildId: string, giveawayId: number, externalAccountId: string): Promise<ParticipationData> {
    const giveawayParticipation = await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/giveaways/${giveawayId}/participation/${externalAccountId}`);
    return giveawayParticipation.data;
  },
  async participateAsUser(guildId: string, giveawayId: number, externalAccountId: string): Promise<ParticipationData> {
    const giveawayParticipation = await axios.put(`${hazelCommunityUrl}/discord/servers/${guildId}/giveaways/${giveawayId}/participation/${externalAccountId}`);
    return giveawayParticipation.data;
  },
  async removeParticipationAsUser(guildId: string, giveawayId: number, externalAccountId: string) {
    await axios.delete(`${hazelCommunityUrl}/discord/servers/${guildId}/giveaways/${giveawayId}/participation/${externalAccountId}`);
  },
  async getWinnerList(guildId: string, giveawayId: number): Promise<WinnerList | null> {
    try {
      const giveawayWinners = await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/giveaways/${giveawayId}/winners`);
      return giveawayWinners.data;
    } catch (error) {
      return null;
    }
  },
  async drawWinners(guildId: string, giveawayId: number): Promise<WinnerList> {
    const giveawayWinners = await axios.post(`${hazelCommunityUrl}/discord/servers/${guildId}/giveaways/${giveawayId}/winners`);
    return giveawayWinners.data;
  },
  async getGiveawayTokenMetadata(guildId: string, giveawayId: number): Promise<TokenMetadata> {
    const giveawayTokenMetadata = await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/giveaways/${giveawayId}/tokenmetadata`);
    return giveawayTokenMetadata.data;
  },
  async getPremiumInfo(guildId: string): Promise<DiscordServerPremiumInfo> {
    const premiumInfo = await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/premium`);
    return premiumInfo.data;
  },
  async getCurrentPayment(guildId: string): Promise<IncomingDiscordPayment | null> {
    try {
      const paymentInfo = await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/payment`);
      return paymentInfo.data;
    } catch (error) {
      return null;
    }
  },
  async requestIncomingPayment(guildId: string, refillAmount: number): Promise<IncomingDiscordPayment> {
    const paymentInfo = await axios.post(`${hazelCommunityUrl}/discord/servers/${guildId}/payment`, {
      refillAmount,
    });
    return paymentInfo.data;
  },
  async cancelIncomingPayment(guildId: string) {
    await axios.delete(`${hazelCommunityUrl}/discord/servers/${guildId}/payment`);
  },
  async getAllDiscordServers(): Promise<DiscordServer[]> {
    const cachedDiscordServer = this.cache.get('allservers') as DiscordServer[];
    if (cachedDiscordServer !== undefined) {
      return cachedDiscordServer;
    }
    const discordServer = await axios.get(`${hazelCommunityUrl}/discord/servers`);
    this.cache.set('allservers', discordServer.data);
    return discordServer.data;
  },
  async updateMemberActivity(activity: ActivityMap) {
    await axios.post(`${hazelCommunityUrl}/discord/activity`, activity);
  },
  async listPollsToBeAnnounced(): Promise<DiscordPollUpdate[]> {
    const pollsToBeAnnouncedPromise = await axios.get(`${hazelCommunityUrl}/discord/polls/announcements`);
    return pollsToBeAnnouncedPromise.data;
  },
  async listPollResultUpdates(): Promise<DiscordPollUpdate[]> {
    const pollsResultUpdatesPromise = await axios.get(`${hazelCommunityUrl}/discord/polls/resultupdates`);
    return pollsResultUpdatesPromise.data;
  },
  async listGiveawaysToBeAnnounced(): Promise<DiscordGiveawayUpdate[]> {
    const giveawaysToBeAnnouncedPromise = await axios.get(`${hazelCommunityUrl}/discord/giveaways/announcements`);
    return giveawaysToBeAnnouncedPromise.data;
  },
  async listGiveawayResultUpdates(): Promise<DiscordGiveawayUpdate[]> {
    const giveawaysResultUpdatesPromise = await axios.get(`${hazelCommunityUrl}/discord/giveaways/resultupdates`);
    return giveawaysResultUpdatesPromise.data;
  },
  async listChannelsForEpochClockUpdate(): Promise<DiscordWidgetUpdate[]> {
    const widgetUpdatesPromise = await axios.get(`${hazelCommunityUrl}/discord/widgets/epochclock`);
    return widgetUpdatesPromise.data;
  },
  async listChannelsForRoleCounterUpdate(): Promise<DiscordRoleCounterUpdate[]> {
    const widgetUpdatesPromise = await axios.get(`${hazelCommunityUrl}/discord/widgets/rolecounter`);
    return widgetUpdatesPromise.data;
  },
  async listChannelsForMintCountUpdate(): Promise<DiscordMintCounterUpdate[]> {
    const widgetUpdatesPromise = await axios.get(`${hazelCommunityUrl}/discord/widgets/mintcounter`);
    return widgetUpdatesPromise.data;
  },
  async regenerateAccessToken(guildId: string): Promise<string> {
    const accessTokenPromise = await axios.post(`${hazelCommunityUrl}/discord/servers/${guildId}/accesstoken`);
    return accessTokenPromise.data;
  },
  async deleteAccessToken(guildId: string) {
    await axios.delete(`${hazelCommunityUrl}/discord/servers/${guildId}/accesstoken`);
  },
  clearCacheEntry(guildId: string) {
    this.cache.del(`${guildId}`);
  },
  async makeDiscordServerObject(discordServer: DiscordServer | object): Promise<DiscordServer> {
    const basicThumbnail = await globalsettings.getGlobalSetting('BASIC_EDITION_THUMBNAIL');
    const adText = await globalsettings.getGlobalSetting('ADVERTISEMENT_TEXT');
    const adLogo = await globalsettings.getGlobalSetting('ADVERTISEMENT_LOGO');
    const discordServerObject: any = discordServer;
    discordServerObject.getBotLanguage = function getBotLanguage() {
      const useLocale = this.settings?.BOT_LANGUAGE?.length ? this.settings.BOT_LANGUAGE : 'en';
      return useLocale;
    };
    discordServerObject.getBasicEditionThumbnail = function getBasicEditionThumbnail() {
      return (basicThumbnail && !this.premium ? basicThumbnail : 'https://www.hazelnet.io/logo192.png');
    };
    discordServerObject.getAdvertisement = function getAdvertisement() {
      return { text: adText, logo: adLogo };
    };
    discordServerObject.formatNumber = function formatNumber(number: number) {
      return Intl.NumberFormat('en-US').format(number);
    };
    return discordServerObject;
  },
};
