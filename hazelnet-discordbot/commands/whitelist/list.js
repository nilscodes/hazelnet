const i18n = require('i18n');
const {
  MessageActionRow, MessageButton,
} = require('discord.js');
const embedBuilder = require('../../utility/embedbuilder');
const whitelistUtil = require('../../utility/whitelist');

module.exports = {
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    try {
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
      const signups = (await whitelistUtil.getExistingSignups(externalAccount, discordServer, interaction)).filter((signup) => signup !== undefined);
      const whitelistFields = await this.getWhitelists(discordServer, interaction, signups, false);
      const components = [];
      if (signups.length) {
        components.push(
          new MessageActionRow()
            .addComponents(
              new MessageButton()
                .setCustomId('whitelist/list/withaddress')
                .setLabel(i18n.__({ phrase: 'whitelist.list.showWithAddresses', locale }))
                .setStyle('PRIMARY'),
            ),
        );
      }
      if (!whitelistFields.length) {
        whitelistFields.push({ name: i18n.__({ phrase: 'whitelist.list.noWhitelistsTitle', locale }), value: i18n.__({ phrase: 'whitelist.list.noWhitelistsDetail', locale }) });
      }
      const embed = embedBuilder.buildForUserWithAd(externalAccount, discordServer, i18n.__({ phrase: 'whitelist.list.messageTitle', locale }), i18n.__({ phrase: 'whitelist.list.purpose', locale }), 'whitelist-list', whitelistFields);
      await interaction.editReply({ components, embeds: [embed], ephemeral: true });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting official whitelists. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
  async getWhitelists(discordServer, interaction, signups, includeAddresses) {
    const whitelistFieldsPromise = discordServer.whitelists.map(async (whitelist) => {
      const detailsPhrase = whitelistUtil.getDetailsText(discordServer, whitelist);
      const existingSignup = signups.find((signup) => signup?.whitelistId === whitelist.id);
      const qualifyText = await whitelistUtil.getQualifyText(interaction, discordServer, whitelist, existingSignup?.signup, includeAddresses);
      return {
        name: whitelist.displayName,
        value: `${detailsPhrase}${qualifyText}`,
      };
    });
    const whitelistFields = await Promise.all(whitelistFieldsPromise);
    return whitelistFields;
  },
  async executeButton(interaction) {
    if (interaction.customId === 'whitelist/list/withaddress') {
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
      const signups = await whitelistUtil.getExistingSignups(externalAccount, discordServer, interaction);
      const whitelistFields = await this.getWhitelists(discordServer, interaction, signups, true);
      const embed = embedBuilder.buildForUserWithAd(externalAccount, discordServer, i18n.__({ phrase: 'whitelist.list.messageTitle', locale }), i18n.__({ phrase: 'whitelist.list.purpose', locale }), 'whitelist-list', whitelistFields);
      await interaction.update({ components: [], embeds: [embed], ephemeral: true });
    }
  },
};
