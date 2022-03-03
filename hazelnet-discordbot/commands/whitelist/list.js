const i18n = require('i18n');
const embedBuilder = require('../../utility/embedbuilder');
const whitelistUtil = require('../../utility/whitelist');

module.exports = {
  async execute(interaction) {
    const includeAddressInList = interaction.options.getBoolean('includeaddress') ?? false;
    await interaction.deferReply({ ephemeral: true });
    try {
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const useLocale = discordServer.getBotLanguage();
      const externalAccount = await interaction.client.services.externalaccounts.getExternalDiscordAccount(interaction.user.id);
      const signups = await whitelistUtil.getExistingSignups(externalAccount, discordServer, interaction);
      const whitelistFieldsPromise = discordServer.whitelists.map(async (whitelist) => {
        const detailsPhrase = whitelistUtil.getDetailsText(discordServer, whitelist);
        const existingSignup = signups.find((signup) => signup?.whitelistId === whitelist.id);
        const qualifyText = await whitelistUtil.getQualifyText(interaction, discordServer, whitelist, existingSignup?.signup, includeAddressInList);
        return {
          name: whitelist.displayName,
          value: `${detailsPhrase}${qualifyText}`,
        };
      });
      const whitelistFields = await Promise.all(whitelistFieldsPromise);
      if (!whitelistFields.length) {
        whitelistFields.push({ name: i18n.__({ phrase: 'whitelist.list.noWhitelistsTitle', locale: useLocale }), value: i18n.__({ phrase: 'whitelist.list.noWhitelistsDetail', locale: useLocale }) });
      }
      const embed = embedBuilder.buildForUserWithAd(discordServer, i18n.__({ phrase: 'whitelist.list.messageTitle', locale: useLocale }), i18n.__({ phrase: 'whitelist.list.purpose', locale: useLocale }), 'whitelist-list', whitelistFields);
      await interaction.editReply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting official whitelists. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
};
