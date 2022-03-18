const NodeCache = require('node-cache');
const { SlashCommandBuilder } = require('@discordjs/builders');
const i18n = require('i18n');
const {
  MessageActionRow, MessageButton,
} = require('discord.js');
const embedBuilder = require('../utility/embedbuilder');
const CommandTranslations = require('../utility/commandtranslations');

module.exports = {
  cache: new NodeCache({ stdTTL: 900 }),
  getCommandData(locale) {
    const ci18n = new CommandTranslations('premium', locale);
    return new SlashCommandBuilder()
      .setName('premium')
      .setDescription(ci18n.description())
      .setDefaultPermission(false);
  },
  commandTags: ['premium'],
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const useLocale = discordServer.getBotLanguage();
      const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
      const discordMemberInfo = await interaction.client.services.discordserver.getExternalAccountOnDiscord(interaction.guild.id, externalAccount.id);

      const { embed, components } = this.showPremiumEmbed(externalAccount, discordMemberInfo, useLocale, discordServer);
      await interaction.editReply({ embeds: [embed], components, ephemeral: true });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting information on claimable items. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
  showPremiumEmbed(externalAccount, discordMemberInfo, locale, discordServer) {
    const premiumFields = [{
      name: i18n.__({ phrase: 'premium.premiumStatus', locale }),
      value: i18n.__({ phrase: (externalAccount.premium ? 'premium.premiumStatusYes' : 'premium.premiumStatusNo'), locale }),
    }];
    let components = [];
    if (externalAccount.premium) {
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
    const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'premium.messageTitle', locale }), i18n.__({ phrase: 'premium.purpose', locale }), 'premium', premiumFields);
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

      const { embed, components } = this.showPremiumEmbed(externalAccount, discordMemberInfo, useLocale, discordServer);
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
