const i18n = require('i18n');
const embedBuilder = require('../../utility/embedbuilder');
const whitelistUtil = require('../../utility/whitelist');

module.exports = {
  async execute(interaction) {
    const whitelistName = interaction.options.getString('whitelist-name');
    const whitelistDisplayName = interaction.options.getString('whitelist-displayname');
    const requiredRole = interaction.options.getRole('required-role');
    const maxUsers = interaction.options.getInteger('max-users');
    const signupAfter = interaction.options.getString('signup-start');
    const signupUntil = interaction.options.getString('signup-end');

    try {
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const useLocale = discordServer.getBotLanguage();

      if (signupAfter && new Date(signupAfter).toISOString().replace('.000', '') !== signupAfter) {
        await interaction.reply({ content: i18n.__({ phrase: 'errors.invalidIsoDateFormat', locale: useLocale }), ephemeral: true }, { parameter: 'signup-start' });
        return;
      }
      if (signupUntil && new Date(signupUntil).toISOString().replace('.000', '') !== signupUntil) {
        await interaction.reply({ content: i18n.__({ phrase: 'errors.invalidIsoDateFormat', locale: useLocale }), ephemeral: true }, { parameter: 'signup-end' });
        return;
      }

      await interaction.deferReply({ ephemeral: true });
      const newWhitelistPromise = await interaction.client.services.discordserver.createWhitelist(interaction.guild.id, whitelistName, whitelistDisplayName, signupAfter, signupUntil, maxUsers, requiredRole.id);
      const whitelist = newWhitelistPromise.data;

      const detailsPhrase = whitelistUtil.getDetailsText(discordServer, whitelist);
      const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist add', i18n.__({ phrase: 'configure.whitelist.add.success', locale: useLocale }), [
        {
          name: i18n.__({ phrase: 'configure.whitelist.list.adminName', locale: useLocale }, { whitelist }),
          value: detailsPhrase,
        },
      ]);
      await interaction.editReply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while adding whitelist to your server. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
};
