const NodeCache = require('node-cache');
const axios = require('axios');
const globalsettings = require('./globalsettings');

const hazelCommunityUrl = process.env.HAZELNET_COMMUNITY_URL;

module.exports = {
  cache: new NodeCache({ stdTTL: 600 }),
  async registerDiscordServer(guildId, guildName, guildOwner, guildMemberCount) {
    return axios.post(`${hazelCommunityUrl}/discord/servers`, {
      guildId,
      guildName,
      guildOwner,
      guildMemberCount,
    });
  },
  async getDiscordServer(guildId) {
    const cachedDiscordServer = this.cache.get(`${guildId}`);
    if (cachedDiscordServer !== undefined) {
      return cachedDiscordServer;
    }
    const discordServer = await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}`);
    const discordServerObject = this.makeDiscordServerObject(discordServer.data);
    this.cache.set(`${guildId}`, discordServerObject);
    return discordServerObject;
  },
  async getDiscordServerByInternalId(serverId) {
    const discordServer = await axios.get(`${hazelCommunityUrl}/discord/servers/${serverId}?byId=true`);
    const discordServerObject = this.makeDiscordServerObject(discordServer.data);
    this.cache.set(`${discordServerObject.id}`, discordServerObject);
    return discordServerObject;
  },
  async updateDiscordServer(guildId, discordServerPartial) {
    const discordServerPromise = await axios.patch(`${hazelCommunityUrl}/discord/servers/${guildId}`, discordServerPartial);
    const discordServerObject = this.makeDiscordServerObject(discordServerPromise.data);
    this.cache.set(`${guildId}`, discordServerObject);
    return discordServerObject;
  },
  async listExternalAccounts(guildId) {
    const membersPromise = await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/members`);
    return membersPromise.data;
  },
  async connectExternalAccount(guildId, externalAccountId) {
    await axios.post(`${hazelCommunityUrl}/discord/servers/${guildId}/members`, {
      externalAccountId,
    });
    this.clearCacheEntry(guildId);
  },
  async getExternalAccountOnDiscord(guildId, externalAccountId) {
    try {
      const memberPromise = await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/members/${externalAccountId}`);
      return memberPromise.data;
    } catch (error) {
      return null;
    }
  },
  async updateExternalAccountOnDiscord(guildId, externalAccountId, discordMemberPartial) {
    const memberPromise = await axios.patch(`${hazelCommunityUrl}/discord/servers/${guildId}/members/${externalAccountId}`, discordMemberPartial);
    return memberPromise.data;
  },
  async disconnectExternalAccount(guildId, externalAccountId, skipRoleUpdates) {
    await axios.delete(`${hazelCommunityUrl}/discord/servers/${guildId}/members/${externalAccountId}?skipRoleUpdates=${!!skipRoleUpdates}`);
    this.clearCacheEntry(guildId);
  },
  async getEligibleTokenRolesOfUser(guildId, externalAccountId) {
    const memberPromise = await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/members/${externalAccountId}/roleassignments/tokenroles`);
    return memberPromise.data;
  },
  async getEligibleDelegatorRolesOfUser(guildId, externalAccountId) {
    const memberPromise = await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/members/${externalAccountId}/roleassignments/delegatorroles`);
    return memberPromise.data;
  },
  async queueTokenRoleAssignments(guildId, externalAccountId) {
    await axios.post(`${hazelCommunityUrl}/discord/servers/${guildId}/members/${externalAccountId}/roleassignments/tokenroles`);
  },
  async queueDelegatorRoleAssignments(guildId, externalAccountId) {
    await axios.post(`${hazelCommunityUrl}/discord/servers/${guildId}/members/${externalAccountId}/roleassignments/delegatorroles`);
  },
  async updateDiscordServerSetting(guildId, settingName, settingValue) {
    await axios.put(`${hazelCommunityUrl}/discord/servers/${guildId}/settings/${settingName}`, {
      name: settingName,
      value: `${settingValue}`,
    });
    this.clearCacheEntry(guildId);
  },
  async deleteDiscordServerSetting(guildId, settingName) {
    await axios.delete(`${hazelCommunityUrl}/discord/servers/${guildId}/settings/${settingName}`);
    this.clearCacheEntry(guildId);
  },
  async deleteStakepool(guildId, poolToRemove) {
    await axios.delete(`${hazelCommunityUrl}/discord/servers/${guildId}/stakepools/${poolToRemove}`);
    this.clearCacheEntry(guildId);
  },
  async deleteTokenPolicy(guildId, policyToRemove) {
    await axios.delete(`${hazelCommunityUrl}/discord/servers/${guildId}/tokenpolicies/${policyToRemove}`);
    this.clearCacheEntry(guildId);
  },
  async deleteTokenRole(guildId, tokenRoleIdToRemove) {
    await axios.delete(`${hazelCommunityUrl}/discord/servers/${guildId}/tokenroles/${tokenRoleIdToRemove}`);
    this.clearCacheEntry(guildId);
  },
  async deleteDelegatorRole(guildId, delegatorRoleIdToRemove) {
    await axios.delete(`${hazelCommunityUrl}/discord/servers/${guildId}/delegatorroles/${delegatorRoleIdToRemove}`);
    this.clearCacheEntry(guildId);
  },
  async deleteWhitelist(guildId, whitelistIdToRemove) {
    await axios.delete(`${hazelCommunityUrl}/discord/servers/${guildId}/whitelists/${whitelistIdToRemove}`);
    this.clearCacheEntry(guildId);
  },
  async addStakepool(guildId, poolHash) {
    const newPoolPromise = axios.post(`${hazelCommunityUrl}/discord/servers/${guildId}/stakepools`, {
      poolHash,
    });
    this.clearCacheEntry(guildId);
    return newPoolPromise;
  },
  async addTokenPolicy(guildId, policyId, projectName) {
    const newPolicyPromise = await axios.post(`${hazelCommunityUrl}/discord/servers/${guildId}/tokenpolicies`, {
      policyId,
      projectName,
    });
    this.clearCacheEntry(guildId);
    return newPolicyPromise;
  },
  async createTokenRole(guildId, policyId, minimumTokenQuantity, maximumTokenQuantity, discordRoleId, assetFingerprint) {
    const newTokenRolePromise = await axios.post(`${hazelCommunityUrl}/discord/servers/${guildId}/tokenroles`, {
      minimumTokenQuantity,
      maximumTokenQuantity,
      roleId: discordRoleId,
      acceptedAssets: [{
        policyId,
        assetFingerprint,
      }],
    });
    this.clearCacheEntry(guildId);
    return newTokenRolePromise;
  },
  async updateTokenRole(guildId, tokenRoleId, acceptedAssets, minimumTokenQuantity, maximumTokenQuantity, discordRoleId, aggregationType, stakingType) {
    const updatedTokenRolePromise = await axios.patch(`${hazelCommunityUrl}/discord/servers/${guildId}/tokenroles/${tokenRoleId}`, {
      acceptedAssets,
      minimumTokenQuantity,
      maximumTokenQuantity,
      roleId: discordRoleId,
      aggregationType,
      stakingType,
    });
    this.clearCacheEntry(guildId);
    return updatedTokenRolePromise.data;
  },
  async addTokenRoleMetadataFilter(guildId, tokenRoleId, attributeName, operator, attributeValue) {
    const newMetadataFilterPromise = await axios.post(`${hazelCommunityUrl}/discord/servers/${guildId}/tokenroles/${tokenRoleId}/metadatafilters`, {
      attributeName,
      operator,
      attributeValue,
    });
    this.clearCacheEntry(guildId);
    return newMetadataFilterPromise.data;
  },
  async deleteTokenRoleMetadataFilter(guildId, tokenRoleId, filterIdToRemove) {
    await axios.delete(`${hazelCommunityUrl}/discord/servers/${guildId}/tokenroles/${tokenRoleId}/metadatafilters/${filterIdToRemove}`);
    this.clearCacheEntry(guildId);
  },
  async createDelegatorRole(guildId, poolHash, minimumStakeAda, discordRoleId) {
    const newDelegatorRolePromise = await axios.post(`${hazelCommunityUrl}/discord/servers/${guildId}/delegatorroles`, {
      poolHash,
      minimumStake: minimumStakeAda * 1000000,
      roleId: discordRoleId,
    });
    this.clearCacheEntry(guildId);
    return newDelegatorRolePromise;
  },
  async createPoll(guildId, pollObject) {
    const newPollPromise = await axios.post(`${hazelCommunityUrl}/discord/servers/${guildId}/polls`, pollObject);
    this.clearCacheEntry(guildId);
    return newPollPromise.data;
  },
  async updatePoll(guildId, pollId, discordPollPartial) {
    const discordPollPromise = await axios.patch(`${hazelCommunityUrl}/discord/servers/${guildId}/polls/${pollId}`, discordPollPartial);
    return discordPollPromise.data;
  },
  async createWhitelist(guildId, creator, name, displayName, type, signupAfter, signupUntil, maxUsers, requiredRoleId, launchDate, logoUrl) {
    const newWhitelistPromise = await axios.post(`${hazelCommunityUrl}/discord/servers/${guildId}/whitelists`, {
      creator,
      displayName,
      name,
      type,
      signupAfter,
      signupUntil,
      maxUsers,
      requiredRoleId,
      launchDate,
      logoUrl,
    });
    this.clearCacheEntry(guildId);
    return newWhitelistPromise;
  },
  async updateWhitelist(guildId, whitelistId, whitelistPartial) {
    const newWhitelistPromise = await axios.patch(`${hazelCommunityUrl}/discord/servers/${guildId}/whitelists/${whitelistId}`, whitelistPartial);
    this.clearCacheEntry(guildId);
    return newWhitelistPromise.data;
  },
  async getSharedWhitelists(guildId, withSignups) {
    const sharedWhitelistsPromise = await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/whitelists/shared?withSignups=${withSignups ? 'true' : 'false'}`);
    return sharedWhitelistsPromise.data;
  },
  async getWhitelistSignupsForExternalAccount(guildId, whitelistId, externalAccountId) {
    const registrationPromise = await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/whitelists/${whitelistId}/signups/${externalAccountId}`);
    return {
      whitelistId,
      signup: registrationPromise.data,
    };
  },
  async registerForWhitelist(guildId, whitelistId, externalAccountId, address) {
    const newWhitelistSignupPromise = await axios.post(`${hazelCommunityUrl}/discord/servers/${guildId}/whitelists/${whitelistId}/signups`, {
      externalAccountId,
      address,
    });
    this.clearCacheEntry(guildId);
    return newWhitelistSignupPromise;
  },
  async getWhitelistSignups(guildId, whitelistId) {
    const signupsListPromise = await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/whitelists/${whitelistId}/signups`);
    return signupsListPromise.data;
  },
  async unregisterFromWhitelist(guildId, whitelistId, externalAccountId) {
    await axios.delete(`${hazelCommunityUrl}/discord/servers/${guildId}/whitelists/${whitelistId}/signups/${externalAccountId}`);
    this.clearCacheEntry(guildId);
  },
  async listMarketplaceChannels(guildId) {
    const marketplaceChannelListPromise = await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/marketplaces/channels`);
    return marketplaceChannelListPromise.data;
  },
  async createMarketplaceChannel(guildId, creator, type, channelId, policyId, marketplace, minimumValue, maximumValue, highlightAttributeName, highlightAttributeDisplayName) {
    const newMarketplaceChannelPromise = await axios.post(`${hazelCommunityUrl}/discord/servers/${guildId}/marketplaces/channels`, {
      creator,
      type,
      channelId,
      policyId,
      marketplaces: [marketplace],
      minimumValue,
      maximumValue,
      highlightAttributeName,
      highlightAttributeDisplayName,
    });
    return newMarketplaceChannelPromise.data;
  },
  async deleteMarketplaceChannel(guildId, marketplaceChannelId) {
    await axios.delete(`${hazelCommunityUrl}/discord/servers/${guildId}/marketplaces/channels/${marketplaceChannelId}`);
  },
  async addMarketplaceChannelMetadataFilter(guildId, marketplaceChannelId, attributeName, operator, attributeValue) {
    const newMetadataFilterPromise = await axios.post(`${hazelCommunityUrl}/discord/servers/${guildId}/marketplaces/channels/${marketplaceChannelId}/metadatafilters`, {
      attributeName,
      operator,
      attributeValue,
    });
    return newMetadataFilterPromise.data;
  },
  async deleteMarketplaceChannelMetadataFilter(guildId, marketplaceChannelId, filterIdToRemove) {
    await axios.delete(`${hazelCommunityUrl}/discord/servers/${guildId}/marketplaces/channels/${marketplaceChannelId}/metadatafilters/${filterIdToRemove}`);
  },
  async getCurrentDelegatorRoleAssignments(guildId) {
    const roleAssignments = await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/roleassignments/delegatorroles`);
    return roleAssignments.data;
  },
  async getCurrentTokenRoleAssignments(guildId) {
    const roleAssignments = await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/roleassignments/tokenroles`);
    return roleAssignments.data;
  },
  async getPolls(guildId) {
    const polls = await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/polls`);
    return polls.data;
  },
  async getPoll(guildId, pollId) {
    const poll = await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/polls/${pollId}`);
    return poll.data;
  },
  async deletePoll(guildId, pollId) {
    await axios.delete(`${hazelCommunityUrl}/discord/servers/${guildId}/polls/${pollId}`);
  },
  async getPollTokenMetadata(guildId, pollId) {
    const pollTokenMetadata = await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/polls/${pollId}/tokenmetadata`);
    return pollTokenMetadata.data;
  },
  async getPollResults(guildId, pollId) {
    const pollResults = await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/polls/${pollId}/votes`);
    return pollResults.data;
  },
  async getVoteOfUser(guildId, pollId, externalAccountId) {
    const votingData = await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/polls/${pollId}/votes/${externalAccountId}`);
    return votingData.data;
  },
  async setVoteForUser(guildId, pollId, externalAccountId, votes) {
    const votingData = await axios.post(`${hazelCommunityUrl}/discord/servers/${guildId}/polls/${pollId}/votes/${externalAccountId}`, votes);
    return votingData.data;
  },
  async createGiveaway(guildId, giveawayObject) {
    const newGiveawayPromise = await axios.post(`${hazelCommunityUrl}/discord/servers/${guildId}/giveaways`, giveawayObject);
    this.clearCacheEntry(guildId);
    return newGiveawayPromise.data;
  },
  async updateGiveaway(guildId, giveawayId, discordGiveawayPartial) {
    const discordGiveawayPromise = await axios.patch(`${hazelCommunityUrl}/discord/servers/${guildId}/giveaways/${giveawayId}`, discordGiveawayPartial);
    return discordGiveawayPromise.data;
  },
  async getGiveaways(guildId) {
    const giveaways = await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/giveaways`);
    return giveaways.data;
  },
  async getGiveaway(guildId, giveawayId) {
    const giveaway = await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/giveaways/${giveawayId}`);
    return giveaway.data;
  },
  async deleteGiveaway(guildId, giveawayId) {
    await axios.delete(`${hazelCommunityUrl}/discord/servers/${guildId}/giveaways/${giveawayId}`);
  },
  async getParticipationForGiveaway(guildId, giveawayId) {
    const giveawayParticipation = await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/giveaways/${giveawayId}/participation`);
    return giveawayParticipation.data;
  },
  async getParticipationOfUser(guildId, giveawayId, externalAccountId) {
    const giveawayParticipation = await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/giveaways/${giveawayId}/participation/${externalAccountId}`);
    return giveawayParticipation.data;
  },
  async participateAsUser(guildId, giveawayId, externalAccountId) {
    const giveawayParticipation = await axios.put(`${hazelCommunityUrl}/discord/servers/${guildId}/giveaways/${giveawayId}/participation/${externalAccountId}`);
    return giveawayParticipation.data;
  },
  async removeParticipationAsUser(guildId, giveawayId, externalAccountId) {
    await axios.delete(`${hazelCommunityUrl}/discord/servers/${guildId}/giveaways/${giveawayId}/participation/${externalAccountId}`);
  },
  async getWinnerList(guildId, giveawayId) {
    try {
      const giveawayWinners = await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/giveaways/${giveawayId}/winners`);
      return giveawayWinners.data;
    } catch (error) {
      return null;
    }
  },
  async drawWinners(guildId, giveawayId) {
    const giveawayWinners = await axios.post(`${hazelCommunityUrl}/discord/servers/${guildId}/giveaways/${giveawayId}/winners`);
    return giveawayWinners.data;
  },
  async getGiveawayTokenMetadata(guildId, giveawayId) {
    const giveawayTokenMetadata = await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/giveaways/${giveawayId}/tokenmetadata`);
    return giveawayTokenMetadata.data;
  },
  async getPremiumInfo(guildId) {
    const premiumInfo = await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/premium`);
    return premiumInfo.data;
  },
  async getCurrentPayment(guildId) {
    try {
      const paymentInfo = await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/payment`);
      return paymentInfo.data;
    } catch (error) {
      return null;
    }
  },
  async requestIncomingPayment(guildId, refillAmount) {
    const paymentInfo = await axios.post(`${hazelCommunityUrl}/discord/servers/${guildId}/payment`, {
      refillAmount,
    });
    return paymentInfo.data;
  },
  async cancelIncomingPayment(guildId) {
    await axios.delete(`${hazelCommunityUrl}/discord/servers/${guildId}/payment`);
  },
  async getAllDiscordServers() {
    const cachedDiscordServer = this.cache.get('allservers');
    if (cachedDiscordServer !== undefined) {
      return cachedDiscordServer;
    }
    const discordServer = await axios.get(`${hazelCommunityUrl}/discord/servers`);
    this.cache.set('allservers', discordServer.data);
    return discordServer.data;
  },
  async listPollsToBeAnnounced() {
    const pollsToBeAnnouncedPromise = await axios.get(`${hazelCommunityUrl}/discord/polls/announcements`);
    return pollsToBeAnnouncedPromise.data;
  },
  async listPollResultUpdates() {
    const pollsResultUpdatesPromise = await axios.get(`${hazelCommunityUrl}/discord/polls/resultupdates`);
    return pollsResultUpdatesPromise.data;
  },
  async listGiveawaysToBeAnnounced() {
    const giveawaysToBeAnnouncedPromise = await axios.get(`${hazelCommunityUrl}/discord/giveaways/announcements`);
    return giveawaysToBeAnnouncedPromise.data;
  },
  async listGiveawayResultUpdates() {
    const giveawaysResultUpdatesPromise = await axios.get(`${hazelCommunityUrl}/discord/giveaways/resultupdates`);
    return giveawaysResultUpdatesPromise.data;
  },
  async listChannelsForEpochClockUpdate() {
    const widgetUpdatesPromise = await axios.get(`${hazelCommunityUrl}/discord/widgets/epochclock`);
    return widgetUpdatesPromise.data;
  },
  async regenerateAccessToken(guildId) {
    const roleAssignments = await axios.post(`${hazelCommunityUrl}/discord/servers/${guildId}/accesstoken`);
    return roleAssignments.data;
  },
  async deleteAccessToken(guildId) {
    await axios.delete(`${hazelCommunityUrl}/discord/servers/${guildId}/accesstoken`);
  },
  clearCacheEntry(guildId) {
    this.cache.del(`${guildId}`);
  },
  async makeDiscordServerObject(discordServer) {
    const basicThumbnail = await globalsettings.getGlobalSetting('BASIC_EDITION_THUMBNAIL');
    const adText = await globalsettings.getGlobalSetting('ADVERTISEMENT_TEXT');
    const adLogo = await globalsettings.getGlobalSetting('ADVERTISEMENT_LOGO');
    const discordServerObject = discordServer;
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
    discordServerObject.formatNumber = function formatNumber(number) {
      return Intl.NumberFormat('en-US').format(number);
    };
    return discordServerObject;
  },
};
