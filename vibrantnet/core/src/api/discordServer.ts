import axios from 'axios';
import { BaseCacheApi } from './baseCache';
import { DiscordServer } from '../types/discordServer';
import { DiscordServerPartial } from '../types/discordServerPartial';
import { DiscordMemberPartial } from '../types/discordMemberPartial';
import { DiscordServerMember } from '../types/discordServerMember';
import { DiscordRoleAssignment } from '../types/roles/discordRoleAssignment';
import { TokenPolicy } from '../types/cardano/tokenPolicy';
import { Stakepool } from '../types/cardano/stakepool';
import { DelegatorRole } from '../types/roles/delegatorRole';
import { TokenOwnershipRole } from '../types/roles/tokenOwnershipRole';
import { Whitelist } from '../types/whitelist/whitelist';
import { TokenOwnershipRolePartial } from '../types/roles/tokenOwnershipRolePartial';
import { TokenStakingType } from '../types/cardano/tokenStakingType';
import { TokenOwnershipAggregationType } from '../types/roles/tokenOwnershipAggregationType';
import { TokenRoleAssetInfo } from '../types/cardano/tokenRoleAssetInfo';
import { AttributeOperatorType } from '../types/filter/attributeOperatorType';
import { Poll } from '../types/poll/poll';
import { DiscordRequiredRole } from '../types/discordRequiredRole';
import { WhitelistType } from '../types/whitelist/whitelistType';
import { MetadataFilter } from '../types/filter/metadataFilter';
import { WhitelistPartial } from '../types/whitelist/whitelistPartial';
import { SharedWhitelist } from '../types/whitelist/sharedWhitelist';
import { WhitelistSignupContainer } from '../types/whitelist/whitelistSignupContainer';
import { SharedWhitelistSignup } from '../types/whitelist/sharedWhitelistSignup';
import { MarketplaceChannel } from '../types/marketplace/marketplaceChannel';
import { Marketplace } from '../types/marketplace/marketplace';
import { DiscordMarketplaceChannelType } from '../types/discordMarketplaceChannelType';
import { TokenMetadata } from '../types/cardano/tokenMetadata';
import { VoteData } from '../types/poll/voteData';
import { GiveawayPartial } from '../types/giveaway/giveawayPartial';
import { Giveaway } from '../types/giveaway/giveaway';
import { ParticipationData } from '../types/giveaway/participationData';
import { WinnerList } from '../types/giveaway/winnerList';
import { DiscordServerPremiumInfo } from '../types/premium/discordServerPremiumInfo';
import { IncomingDiscordPayment } from '../types/premium/incomingDiscordPayment';
import { ActivityMap } from '../types/activityMap';
import { DiscordPollUpdate } from '../types/poll/discordPollUpdate';
import { DiscordGiveawayUpdate } from '../types/giveaway/discordGiveawayUpdate';
import { DiscordWidgetUpdate } from '../types/discordWidgetUpdate';
import { DiscordRoleCounterUpdate } from '../types/discordRoleCounterUpdate';
import { DiscordMintCounterUpdate } from '../types/cardano/discordMintCounterUpdate';
import { GlobalSettingsApi } from './globalSettings';
import { PollPartial } from '../types/poll/pollPartial';
import { BlockchainType } from '../types/blockchainType';

export class DiscordServerApi extends BaseCacheApi {
  globalsettings: GlobalSettingsApi;

  constructor(apiUrl: string) {
    super(apiUrl);
    this.globalsettings = new GlobalSettingsApi(apiUrl);
  }

  async registerDiscordServer(guildId: string, guildName: string, guildOwner: string, guildMemberCount: number) {
    return axios.post(`${this.apiUrl}/discord/servers`, {
      guildId,
      guildName,
      guildOwner,
      guildMemberCount,
    });
  }

  async getDiscordServer(guildId: string): Promise<DiscordServer> {
    const cachedDiscordServer = this.cache.get(`${guildId}`) as DiscordServer;
    if (cachedDiscordServer !== undefined) {
      return cachedDiscordServer;
    }
    const discordServer = await axios.get(`${this.apiUrl}/discord/servers/${guildId}`);
    const discordServerObject = this.makeDiscordServerObject(discordServer.data);
    this.cache.set(`${guildId}`, discordServerObject);
    return discordServerObject;
  }

  async getDiscordServerByInternalId(serverId: number): Promise<DiscordServer> {
    const discordServer = await axios.get(`${this.apiUrl}/discord/servers/${serverId}?byId=true`);
    const discordServerObject = await this.makeDiscordServerObject(discordServer.data);
    this.cache.set(`${discordServerObject.guildId}`, discordServerObject);
    return discordServerObject;
  }

  async updateDiscordServer(guildId: string, discordServerPartial: DiscordServerPartial): Promise<DiscordServer> {
    const discordServerPromise = await axios.patch(`${this.apiUrl}/discord/servers/${guildId}`, discordServerPartial);
    const discordServerObject = this.makeDiscordServerObject(discordServerPromise.data);
    this.cache.set(`${guildId}`, discordServerObject);
    return discordServerObject;
  }

  async listExternalAccounts(guildId: string): Promise<DiscordServerMember[]> {
    const membersPromise = await axios.get(`${this.apiUrl}/discord/servers/${guildId}/members`);
    return membersPromise.data;
  }

  async connectExternalAccount(guildId: string, externalAccountId: string) {
    await axios.post(`${this.apiUrl}/discord/servers/${guildId}/members`, {
      externalAccountId,
    });
    this.clearCacheEntry(guildId);
  }

  async getExternalAccountOnDiscord(guildId: string, externalAccountId: string): Promise<DiscordServerMember | null> {
    try {
      const memberPromise = await axios.get(`${this.apiUrl}/discord/servers/${guildId}/members/${externalAccountId}`);
      return memberPromise.data;
    } catch (error) {
      return null;
    }
  }

  async updateExternalAccountOnDiscord(guildId: string, externalAccountId: string, discordMemberPartial: DiscordMemberPartial): Promise<DiscordServerMember> {
    const memberPromise = await axios.patch(`${this.apiUrl}/discord/servers/${guildId}/members/${externalAccountId}`, discordMemberPartial);
    return memberPromise.data;
  }

  async disconnectExternalAccount(guildId: string, externalAccountId: string, skipRoleUpdates: boolean) {
    await axios.delete(`${this.apiUrl}/discord/servers/${guildId}/members/${externalAccountId}?skipRoleUpdates=${!!skipRoleUpdates}`);
    this.clearCacheEntry(guildId);
  }

  async getEligibleTokenRolesOfUser(guildId: string, externalAccountId: string): Promise<DiscordRoleAssignment[]> {
    const memberPromise = await axios.get(`${this.apiUrl}/discord/servers/${guildId}/members/${externalAccountId}/roleassignments/tokenroles`);
    return memberPromise.data;
  }

  async getEligibleDelegatorRolesOfUser(guildId: string, externalAccountId: string): Promise<DiscordRoleAssignment[]> {
    const memberPromise = await axios.get(`${this.apiUrl}/discord/servers/${guildId}/members/${externalAccountId}/roleassignments/delegatorroles`);
    return memberPromise.data;
  }

  async queueTokenRoleAssignments(guildId: string, externalAccountId: string) {
    await axios.post(`${this.apiUrl}/discord/servers/${guildId}/members/${externalAccountId}/roleassignments/tokenroles`);
  }

  async queueDelegatorRoleAssignments(guildId: string, externalAccountId: string) {
    await axios.post(`${this.apiUrl}/discord/servers/${guildId}/members/${externalAccountId}/roleassignments/delegatorroles`);
  }

  async updateDiscordServerSetting(guildId: string, settingName: string, settingValue: string) {
    await axios.put(`${this.apiUrl}/discord/servers/${guildId}/settings/${settingName}`, {
      name: settingName,
      value: `${settingValue}`,
    });
    this.clearCacheEntry(guildId);
  }

  async deleteDiscordServerSetting(guildId: string, settingName: string) {
    await axios.delete(`${this.apiUrl}/discord/servers/${guildId}/settings/${settingName}`);
    this.clearCacheEntry(guildId);
  }

  async deleteStakepool(guildId: string, poolToRemove: string) {
    await axios.delete(`${this.apiUrl}/discord/servers/${guildId}/stakepools/${poolToRemove}`);
  }

  async deleteTokenPolicy(guildId: string, policyToRemove: string) {
    await axios.delete(`${this.apiUrl}/discord/servers/${guildId}/tokenpolicies/${policyToRemove}`);
  }

  async deleteTokenRole(guildId: string, tokenRoleIdToRemove: number) {
    await axios.delete(`${this.apiUrl}/discord/servers/${guildId}/tokenroles/${tokenRoleIdToRemove}`);
  }

  async deleteDelegatorRole(guildId: string, delegatorRoleIdToRemove: number) {
    await axios.delete(`${this.apiUrl}/discord/servers/${guildId}/delegatorroles/${delegatorRoleIdToRemove}`);
  }

  async deleteWhitelist(guildId: string, whitelistIdToRemove: number) {
    await axios.delete(`${this.apiUrl}/discord/servers/${guildId}/whitelists/${whitelistIdToRemove}`);
  }

  async listTokenPolicies(guildId: string): Promise<TokenPolicy[]> {
    return (await axios.get(`${this.apiUrl}/discord/servers/${guildId}/tokenpolicies`)).data;
  }

  async listStakepools(guildId: string): Promise<Stakepool[]> {
    return (await axios.get(`${this.apiUrl}/discord/servers/${guildId}/stakepools`)).data;
  }

  async listDelegatorRoles(guildId: string): Promise<DelegatorRole[]> {
    return (await axios.get(`${this.apiUrl}/discord/servers/${guildId}/delegatorroles`)).data;
  }

  async listTokenOwnershipRoles(guildId: string): Promise<TokenOwnershipRole[]> {
    return (await axios.get(`${this.apiUrl}/discord/servers/${guildId}/tokenroles`)).data;
  }

  async listWhitelists(guildId: string): Promise<Whitelist[]> {
    return (await axios.get(`${this.apiUrl}/discord/servers/${guildId}/whitelists`)).data;
  }

  async addStakepool(guildId: string, poolHash: string): Promise<any> {
    return axios.post(`${this.apiUrl}/discord/servers/${guildId}/stakepools`, {
      poolHash,
    });
  }

  async addTokenPolicy(guildId: string, policyId: string, projectName: string): Promise<any> {
    return axios.post(`${this.apiUrl}/discord/servers/${guildId}/tokenpolicies`, {
      policyId,
      projectName,
    });
  }

  async createTokenRole(guildId: string, policyId: string, minimumTokenQuantity: string, maximumTokenQuantity: string | null, discordRoleId: string, assetFingerprint: string | null): Promise<any> {
    return axios.post(`${this.apiUrl}/discord/servers/${guildId}/tokenroles`, {
      minimumTokenQuantity,
      maximumTokenQuantity,
      roleId: discordRoleId,
      acceptedAssets: [{
        policyId,
        assetFingerprint,
      }],
    });
  }

  async updateTokenRole(
    guildId: string,
    tokenRoleId: number,
    acceptedAssets: TokenRoleAssetInfo[] | null,
    minimumTokenQuantity?: string | null,
    maximumTokenQuantity?: string | null,
    discordRoleId?: string,
    aggregationType?: TokenOwnershipAggregationType | null,
    stakingType?: TokenStakingType | null,
  ): Promise<TokenOwnershipRole> {
    return (await axios.patch(`${this.apiUrl}/discord/servers/${guildId}/tokenroles/${tokenRoleId}`, {
      acceptedAssets,
      minimumTokenQuantity,
      maximumTokenQuantity,
      roleId: discordRoleId,
      aggregationType,
      stakingType,
    } as TokenOwnershipRolePartial)).data;
  }

  async addTokenRoleMetadataFilter(guildId: string, tokenRoleId: number, attributeName: string, operator: AttributeOperatorType, attributeValue: string, tokenWeight?: number): Promise<MetadataFilter> {
    return (await axios.post(`${this.apiUrl}/discord/servers/${guildId}/tokenroles/${tokenRoleId}/metadatafilters`, {
      attributeName,
      operator,
      attributeValue,
      tokenWeight,
    })).data;
  }

  async deleteTokenRoleMetadataFilter(guildId: string, tokenRoleId: number, filterIdToRemove: number) {
    axios.delete(`${this.apiUrl}/discord/servers/${guildId}/tokenroles/${tokenRoleId}/metadatafilters/${filterIdToRemove}`);
  }

  async createDelegatorRole(guildId: string, poolHash: string | null, minimumStake: number, maximumStake: number | null, discordRoleId: string): Promise<any> {
    return axios.post(`${this.apiUrl}/discord/servers/${guildId}/delegatorroles`, {
      poolHash,
      minimumStake,
      maximumStake,
      roleId: discordRoleId,
    });
  }

  async createPoll(guildId: string, pollObject: Poll): Promise<Poll> {
    return (await axios.post(`${this.apiUrl}/discord/servers/${guildId}/polls`, pollObject)).data;
  }

  async updatePoll(guildId: string, pollId: number, discordPollPartial: PollPartial): Promise<Poll> {
    const discordPollPromise = await axios.patch(`${this.apiUrl}/discord/servers/${guildId}/polls/${pollId}`, discordPollPartial);
    return discordPollPromise.data;
  }

  async createWhitelist(
    guildId: string,
    creator: string,
    name: string,
    displayName: string,
    type: WhitelistType,
    signupAfter: string | null,
    signupUntil: string | null,
    maxUsers: number | null,
    requiredRoles: DiscordRequiredRole[],
    blockchains: BlockchainType[],
    awardedRole: string | undefined,
    launchDate: string | null,
    logoUrl: string | null,
  ): Promise<Whitelist> {
    return (await axios.post(`${this.apiUrl}/discord/servers/${guildId}/whitelists`, {
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
      blockchains,
    })).data;
  }

  async updateWhitelist(guildId: string, whitelistId: number, whitelistPartial: WhitelistPartial): Promise<Whitelist> {
    return (await axios.patch(`${this.apiUrl}/discord/servers/${guildId}/whitelists/${whitelistId}`, whitelistPartial)).data;
  }

  async getSharedWhitelists(guildId: string, withSignups: boolean): Promise<SharedWhitelist[]> {
    return (await axios.get(`${this.apiUrl}/discord/servers/${guildId}/whitelists/shared?withSignups=${withSignups ? 'true' : 'false'}`)).data;
  }

  async getWhitelistSignupsForExternalAccount(guildId: string, whitelistId: number, externalAccountId: string): Promise<WhitelistSignupContainer> {
    const registrationPromise = await axios.get(`${this.apiUrl}/discord/servers/${guildId}/whitelists/${whitelistId}/signups/${externalAccountId}`);
    return {
      whitelistId,
      signup: registrationPromise.data,
    };
  }

  async registerForWhitelist(guildId: string, whitelistId: number, externalAccountId: string, address: string | null) {
    return axios.post(`${this.apiUrl}/discord/servers/${guildId}/whitelists/${whitelistId}/signups`, {
      externalAccountId,
      address,
    });
  }

  async getWhitelistSignups(guildId: string, whitelistId: number): Promise<SharedWhitelistSignup[]> {
    return (await axios.get(`${this.apiUrl}/discord/servers/${guildId}/whitelists/${whitelistId}/signups`)).data;
  }

  async unregisterFromWhitelist(guildId: string, whitelistId: number, externalAccountId: string) {
    await axios.delete(`${this.apiUrl}/discord/servers/${guildId}/whitelists/${whitelistId}/signups/${externalAccountId}`);
  }

  async listMarketplaceChannels(guildId: string): Promise<MarketplaceChannel[]> {
    return (await axios.get(`${this.apiUrl}/discord/servers/${guildId}/marketplaces/channels`)).data;
  }

  async createMarketplaceChannel(
    guildId: string,
    creator: string,
    type: DiscordMarketplaceChannelType,
    channelId: string,
    policyId: string,
    marketplaces: Marketplace[],
    minimumValue?: number | null,
    maximumValue?: number | null,
    highlightAttributeName?: string | null,
    highlightAttributeDisplayName?: string | null,
  ): Promise<MarketplaceChannel> {
    return (await axios.post(`${this.apiUrl}/discord/servers/${guildId}/marketplaces/channels`, {
      creator,
      type,
      channelId,
      policyId,
      marketplaces,
      minimumValue,
      maximumValue,
      highlightAttributeName,
      highlightAttributeDisplayName,
    })).data;
  }

  async deleteMarketplaceChannel(guildId: string, marketplaceChannelId: number) {
    await axios.delete(`${this.apiUrl}/discord/servers/${guildId}/marketplaces/channels/${marketplaceChannelId}`);
  }

  async addMarketplaceChannelMetadataFilter(guildId: string, marketplaceChannelId: number, attributeName: string, operator: AttributeOperatorType, attributeValue: string): Promise<MetadataFilter> {
    return (await axios.post(`${this.apiUrl}/discord/servers/${guildId}/marketplaces/channels/${marketplaceChannelId}/metadatafilters`, {
      attributeName,
      operator,
      attributeValue,
    })).data;
  }

  async deleteMarketplaceChannelMetadataFilter(guildId: string, marketplaceChannelId: number, filterIdToRemove: number) {
    await axios.delete(`${this.apiUrl}/discord/servers/${guildId}/marketplaces/channels/${marketplaceChannelId}/metadatafilters/${filterIdToRemove}`);
  }

  async getCurrentDelegatorRoleAssignments(guildId: string): Promise<DiscordRoleAssignment[]> {
    return (await axios.get(`${this.apiUrl}/discord/servers/${guildId}/roleassignments/delegatorroles`)).data;
  }

  async getCurrentTokenRoleAssignments(guildId: string): Promise<DiscordRoleAssignment[]> {
    return (await axios.get(`${this.apiUrl}/discord/servers/${guildId}/roleassignments/tokenroles`)).data;
  }

  async getCurrentWhitelistRoleAssignments(guildId: string): Promise<DiscordRoleAssignment[]> {
    return (await axios.get(`${this.apiUrl}/discord/servers/${guildId}/roleassignments/whitelistroles`)).data;
  }

  async getPolls(guildId: string): Promise<Poll[]> {
    return (await axios.get(`${this.apiUrl}/discord/servers/${guildId}/polls`)).data;
  }

  async getPoll(guildId: string, pollId: number): Promise<Poll> {
    return (await axios.get(`${this.apiUrl}/discord/servers/${guildId}/polls/${pollId}`)).data;
  }

  async deletePoll(guildId: string, pollId: number) {
    await axios.delete(`${this.apiUrl}/discord/servers/${guildId}/polls/${pollId}`);
  }

  async getPollTokenMetadata(guildId: string, pollId: number): Promise<TokenMetadata> {
    return (await axios.get(`${this.apiUrl}/discord/servers/${guildId}/polls/${pollId}/tokenmetadata`)).data;
  }

  async getPollResults(guildId: string, pollId: number): Promise<VoteData> {
    return (await axios.get(`${this.apiUrl}/discord/servers/${guildId}/polls/${pollId}/votes`)).data;
  }

  async getVoteOfUser(guildId: string, pollId: number, externalAccountId: string): Promise<VoteData> {
    const votingData = await axios.get(`${this.apiUrl}/discord/servers/${guildId}/polls/${pollId}/votes/${externalAccountId}`);
    return votingData.data;
  }

  async setVoteForUser(guildId: string, pollId: number, externalAccountId: string, votes: number[]) {
    const votingData = await axios.post(`${this.apiUrl}/discord/servers/${guildId}/polls/${pollId}/votes/${externalAccountId}`, votes);
    return votingData.data;
  }

  async createGiveaway(guildId: string, giveawayObject: Giveaway) {
    const newGiveawayPromise = await axios.post(`${this.apiUrl}/discord/servers/${guildId}/giveaways`, giveawayObject);
    this.clearCacheEntry(guildId);
    return newGiveawayPromise.data;
  }

  async updateGiveaway(guildId: string, giveawayId: number, discordGiveawayPartial: GiveawayPartial): Promise<Giveaway> {
    const discordGiveawayPromise = await axios.patch(`${this.apiUrl}/discord/servers/${guildId}/giveaways/${giveawayId}`, discordGiveawayPartial);
    return discordGiveawayPromise.data;
  }

  async getGiveaways(guildId: string): Promise<Giveaway[]> {
    const giveaways = await axios.get(`${this.apiUrl}/discord/servers/${guildId}/giveaways`);
    return giveaways.data;
  }

  async getGiveaway(guildId: string, giveawayId: number): Promise<Giveaway> {
    const giveaway = await axios.get(`${this.apiUrl}/discord/servers/${guildId}/giveaways/${giveawayId}`);
    return giveaway.data;
  }

  async deleteGiveaway(guildId: string, giveawayId: number) {
    await axios.delete(`${this.apiUrl}/discord/servers/${guildId}/giveaways/${giveawayId}`);
  }

  async getParticipationForGiveaway(guildId: string, giveawayId: number): Promise<ParticipationData> {
    const giveawayParticipation = await axios.get(`${this.apiUrl}/discord/servers/${guildId}/giveaways/${giveawayId}/participation`);
    return giveawayParticipation.data;
  }

  async getParticipationOfUser(guildId: string, giveawayId: number, externalAccountId: string): Promise<ParticipationData> {
    const giveawayParticipation = await axios.get(`${this.apiUrl}/discord/servers/${guildId}/giveaways/${giveawayId}/participation/${externalAccountId}`);
    return giveawayParticipation.data;
  }

  async participateAsUser(guildId: string, giveawayId: number, externalAccountId: string): Promise<ParticipationData> {
    const giveawayParticipation = await axios.put(`${this.apiUrl}/discord/servers/${guildId}/giveaways/${giveawayId}/participation/${externalAccountId}`);
    return giveawayParticipation.data;
  }

  async removeParticipationAsUser(guildId: string, giveawayId: number, externalAccountId: string) {
    await axios.delete(`${this.apiUrl}/discord/servers/${guildId}/giveaways/${giveawayId}/participation/${externalAccountId}`);
  }

  async getWinnerList(guildId: string, giveawayId: number): Promise<WinnerList | null> {
    try {
      const giveawayWinners = await axios.get(`${this.apiUrl}/discord/servers/${guildId}/giveaways/${giveawayId}/winners`);
      return giveawayWinners.data;
    } catch (error) {
      return null;
    }
  }

  async drawWinners(guildId: string, giveawayId: number): Promise<WinnerList> {
    const giveawayWinners = await axios.post(`${this.apiUrl}/discord/servers/${guildId}/giveaways/${giveawayId}/winners`);
    return giveawayWinners.data;
  }

  async getGiveawayTokenMetadata(guildId: string, giveawayId: number): Promise<TokenMetadata> {
    const giveawayTokenMetadata = await axios.get(`${this.apiUrl}/discord/servers/${guildId}/giveaways/${giveawayId}/tokenmetadata`);
    return giveawayTokenMetadata.data;
  }

  async getPremiumInfo(guildId: string): Promise<DiscordServerPremiumInfo> {
    const premiumInfo = await axios.get(`${this.apiUrl}/discord/servers/${guildId}/premium`);
    return premiumInfo.data;
  }

  async getCurrentPayment(guildId: string): Promise<IncomingDiscordPayment | null> {
    try {
      const paymentInfo = await axios.get(`${this.apiUrl}/discord/servers/${guildId}/payment`);
      return paymentInfo.data;
    } catch (error) {
      return null;
    }
  }

  async requestIncomingPayment(guildId: string, refillAmount: number): Promise<IncomingDiscordPayment> {
    const paymentInfo = await axios.post(`${this.apiUrl}/discord/servers/${guildId}/payment`, {
      refillAmount,
    });
    return paymentInfo.data;
  }

  async cancelIncomingPayment(guildId: string) {
    await axios.delete(`${this.apiUrl}/discord/servers/${guildId}/payment`);
  }

  async getAllDiscordServers(): Promise<DiscordServer[]> {
    const cachedDiscordServer = this.cache.get('allservers') as DiscordServer[];
    if (cachedDiscordServer !== undefined) {
      return cachedDiscordServer;
    }
    const discordServer = await axios.get(`${this.apiUrl}/discord/servers`);
    this.cache.set('allservers', discordServer.data);
    return discordServer.data;
  }

  async updateMemberActivity(activity: ActivityMap) {
    await axios.post(`${this.apiUrl}/discord/activity`, activity);
  }

  async listPollsToBeAnnounced(): Promise<DiscordPollUpdate[]> {
    const pollsToBeAnnouncedPromise = await axios.get(`${this.apiUrl}/discord/polls/announcements`);
    return pollsToBeAnnouncedPromise.data;
  }

  async listPollResultUpdates(): Promise<DiscordPollUpdate[]> {
    const pollsResultUpdatesPromise = await axios.get(`${this.apiUrl}/discord/polls/resultupdates`);
    return pollsResultUpdatesPromise.data;
  }

  async listGiveawaysToBeAnnounced(): Promise<DiscordGiveawayUpdate[]> {
    const giveawaysToBeAnnouncedPromise = await axios.get(`${this.apiUrl}/discord/giveaways/announcements`);
    return giveawaysToBeAnnouncedPromise.data;
  }

  async listGiveawayResultUpdates(): Promise<DiscordGiveawayUpdate[]> {
    const giveawaysResultUpdatesPromise = await axios.get(`${this.apiUrl}/discord/giveaways/resultupdates`);
    return giveawaysResultUpdatesPromise.data;
  }

  async listChannelsForEpochClockUpdate(): Promise<DiscordWidgetUpdate[]> {
    const widgetUpdatesPromise = await axios.get(`${this.apiUrl}/discord/widgets/epochclock`);
    return widgetUpdatesPromise.data;
  }

  async listChannelsForRoleCounterUpdate(): Promise<DiscordRoleCounterUpdate[]> {
    const widgetUpdatesPromise = await axios.get(`${this.apiUrl}/discord/widgets/rolecounter`);
    return widgetUpdatesPromise.data;
  }

  async listChannelsForMintCountUpdate(): Promise<DiscordMintCounterUpdate[]> {
    const widgetUpdatesPromise = await axios.get(`${this.apiUrl}/discord/widgets/mintcounter`);
    return widgetUpdatesPromise.data;
  }

  async regenerateAccessToken(guildId: string): Promise<string> {
    const accessTokenPromise = await axios.post(`${this.apiUrl}/discord/servers/${guildId}/accesstoken`);
    return accessTokenPromise.data;
  }

  async deleteAccessToken(guildId: string) {
    await axios.delete(`${this.apiUrl}/discord/servers/${guildId}/accesstoken`);
  }

  clearCacheEntry(guildId: string) {
    this.cache.del(`${guildId}`);
  }

  async makeDiscordServerObject(discordServer: DiscordServer | object): Promise<DiscordServer> {
    const basicThumbnail = await this.globalsettings.getGlobalSetting('BASIC_EDITION_THUMBNAIL');
    const adText = await this.globalsettings.getGlobalSetting('ADVERTISEMENT_TEXT');
    const adLogo = await this.globalsettings.getGlobalSetting('ADVERTISEMENT_LOGO');
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
  }
}
