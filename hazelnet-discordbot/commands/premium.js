const { SlashCommandBuilder } = require('@discordjs/builders');
const i18n = require('i18n');
const {
  MessageActionRow, MessageButton,
} = require('discord.js');
const embedBuilder = require('../utility/embedbuilder');
const commandbase = require('../utility/commandbase');
const CommandTranslations = require('../utility/commandtranslations');

module.exports = {
  getCommandData(locale) {
    const ci18n = new CommandTranslations('premium', locale);
    return new SlashCommandBuilder()
      .setName('premium')
      .setDescription(ci18n.description());
  },
  commandTags: ['premium'],
  augmentPermissions: commandbase.augmentPermissionsUser,
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const useLocale = discordServer.getBotLanguage();
      const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
      const discordMemberInfo = await interaction.client.services.discordserver.getExternalAccountOnDiscord(interaction.guild.id, externalAccount.id);
      const premiumInfo = await interaction.client.services.externalaccounts.getPremiumInfoForExternalAccount(externalAccount.id);
      const stakeLink = await interaction.client.services.globalsettings.getGlobalSetting('STAKE_LINK') ?? 'https://www.hazelnet.io/stakepool';
      const giveawayInfo = await this.getGiveawayInfo(interaction);

      // Running the /premium command can turn on premium mode for a user prior to the daily run. If that happens, we want to clear the local cache in the discord bot
      if (!externalAccount.premium && premiumInfo.premium) {
        await interaction.client.services.externalaccounts.clearExternalDiscordAccountCache(interaction.user.id);
      }

      const { embed, components } = this.showPremiumEmbed(externalAccount, discordMemberInfo, premiumInfo, useLocale, discordServer, stakeLink, giveawayInfo);
      await interaction.editReply({ embeds: [embed], components, ephemeral: true });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting information on claimable items. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
  async getGiveawayInfo(interaction) {
    const giveawayImage = await interaction.client.services.globalsettings.getGlobalSetting('PREMIUM_GIVEAWAY_IMAGE');
    const giveawayText = await interaction.client.services.globalsettings.getGlobalSetting('PREMIUM_GIVEAWAY_TEXT');
    return {
      image: giveawayImage,
      text: giveawayText,
    };
  },
  showPremiumEmbed(externalAccount, discordMemberInfo, premiumInfo, locale, discordServer, stakeLink, giveawayInfo) {
    const stakedAda = discordServer.formatNumber(Math.floor(premiumInfo.stakeAmount / 1000000));
    const premiumFields = [{
      name: i18n.__({ phrase: 'premium.premiumStatus', locale }),
      value: i18n.__({ phrase: (premiumInfo.premium ? 'premium.premiumStatusYes' : 'premium.premiumStatusNo'), locale }, { ...premiumInfo, stakeAmount: stakedAda, stakeLink }),
    }];
    let components = [];
    if (premiumInfo.premium) {
      let serverSupport = i18n.__({ phrase: 'premium.serverSupportNo', locale });
      const pledgedServerCount = premiumInfo.discordServers.length;
      if (pledgedServerCount) {
        const stakeAmountPerServer = discordServer.formatNumber(Math.floor(premiumInfo.stakeAmount / pledgedServerCount / 1000000));
        serverSupport = i18n.__({ phrase: 'premium.serverSupportYes', locale }, { stakeAmountPerServer }) + premiumInfo.discordServers.map((serverName) => i18n.__({ phrase: 'premium.serverSupportEntry', locale }, { serverName })).join('\n');
      }
      premiumFields.push({
        name: i18n.__({ phrase: 'premium.serverSupport', locale }),
        value: serverSupport,
      });
      if (discordMemberInfo) {
        components = [new MessageActionRow()
          .addComponents(
            new MessageButton()
              .setCustomId(`premium/${discordMemberInfo.premiumSupport ? 'disable' : 'enable'}`)
              .setLabel(i18n.__({ phrase: (discordMemberInfo.premiumSupport ? 'premium.pledgeButtonNo' : 'premium.pledgeButtonYes'), locale }, discordServer))
              .setStyle(discordMemberInfo.premiumSupport ? 'DANGER' : 'PRIMARY'),
          ),
        ];
      }
    }
    premiumFields.push({
      name: i18n.__({ phrase: 'premium.benefits', locale }),
      value: i18n.__({ phrase: 'premium.benefitsDetails', locale }),
    });
    let giveawayImage = null;
    if (giveawayInfo.image && giveawayInfo.text) {
      giveawayImage = giveawayInfo.image;
      premiumFields.push({
        name: i18n.__({ phrase: 'premium.giveaway', locale }),
        value: giveawayInfo.text,
      });
    }
    const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'premium.messageTitle', locale }), i18n.__({ phrase: 'premium.purpose', locale }), 'premium', premiumFields, giveawayImage);
    return { components, embed };
  },
  async executeButton(interaction) {
    if (interaction.customId === 'premium/disable' || interaction.customId === 'premium/enable') {
      await interaction.deferUpdate();
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const useLocale = discordServer.getBotLanguage();
      const premiumSupport = (interaction.customId === 'premium/enable');
      const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
      const discordMemberInfo = await interaction.client.services.discordserver.updateExternalAccountOnDiscord(interaction.guild.id, externalAccount.id, { premiumSupport });
      const premiumInfo = await interaction.client.services.externalaccounts.getPremiumInfoForExternalAccount(externalAccount.id);
      const stakeLink = await interaction.client.services.globalsettings.getGlobalSetting('STAKE_LINK') ?? 'https://www.hazelnet.io/stakepool';
      const giveawayInfo = await this.getGiveawayInfo(interaction);

      const { embed, components } = this.showPremiumEmbed(externalAccount, discordMemberInfo, premiumInfo, useLocale, discordServer, stakeLink, giveawayInfo);
      await interaction.editReply({ embeds: [embed], components, ephemeral: true });
    }
  },
  async executeSelectMenu(interaction) {
    if (interaction.customId) {
      switch (interaction.customId) {
        case 'claim/start': {
          break;
        }
        default:
          break;
      }
    }
  },
};
