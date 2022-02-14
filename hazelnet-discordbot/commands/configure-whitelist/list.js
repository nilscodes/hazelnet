const i18n = require('i18n');
const embedBuilder = require('../../utility/embedbuilder');
const whitelistUtil = require('../../utility/whitelist');

module.exports = {
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const useLocale = discordServer.getBotLanguage();
      const whitelistFields = discordServer.whitelists.map((whitelist) => {
        const detailsPhrase = whitelistUtil.getDetailsText(discordServer, whitelist);
        return {
          name: i18n.__({ phrase: 'configure.whitelist.list.adminName', locale: useLocale }, { whitelist }),
          value: detailsPhrase,
        };
      });
      if (!whitelistFields.length) {
        whitelistFields.push({ name: i18n.__({ phrase: 'whitelist.list.noWhitelistsTitle', locale: useLocale }), value: i18n.__({ phrase: 'whitelist.list.noWhitelistsDetail', locale: useLocale }) });
      }
      const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist list', i18n.__({ phrase: 'configure.whitelist.list.purpose', locale: useLocale }), 'configure-whitelist-list', whitelistFields);
      await interaction.editReply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting auto-role-assignment for delegators. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
};
