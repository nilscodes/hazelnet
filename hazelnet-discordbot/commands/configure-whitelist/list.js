const i18n = require('i18n');
const embedBuilder = require('../../utility/embedbuilder');
const whitelistUtil = require('../../utility/whitelist');

module.exports = {
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      const whitelistFields = discordServer.whitelists.map((whitelist) => {
        const detailsPhrase = whitelistUtil.getDetailsText(discordServer, whitelist);
        return {
          name: i18n.__({ phrase: 'configure.whitelist.list.adminName', locale }, { whitelist }),
          value: detailsPhrase,
        };
      });
      if (!whitelistFields.length) {
        whitelistFields.push({
          name: i18n.__({ phrase: 'whitelist.list.noWhitelistsTitle', locale }),
          value: i18n.__({ phrase: 'whitelist.list.noWhitelistsDetail', locale }),
        });
      }
      if (!discordServer.premium && discordServer.whitelists.length) {
        whitelistFields.unshift({
          name: i18n.__({ phrase: 'generic.blackEditionWarning', locale }),
          value: i18n.__({ phrase: 'configure.whitelist.list.noPremium', locale }),
        });
      }

      const sharedWhitelists = await interaction.client.services.discordserver.getSharedWhitelists(interaction.guild.id);
      if (sharedWhitelists.length) {
        whitelistFields.push({
          name: i18n.__({ phrase: 'configure.whitelist.list.sharedWhitelists', locale }),
          value: `${i18n.__({ phrase: 'configure.whitelist.list.sharedWhitelistsDetail', locale })}\n\n${sharedWhitelists.map((sharedWhitelist) => i18n.__({ phrase: 'configure.whitelist.list.sharedWhitelistsEntry', locale }, sharedWhitelist)).join('\n')}`,
        });
      }

      const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist list', i18n.__({ phrase: 'configure.whitelist.list.purpose', locale }), 'configure-whitelist-list', whitelistFields);
      await interaction.editReply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting auto-role-assignment for delegators. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
};
