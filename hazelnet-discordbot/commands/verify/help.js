const i18n = require('i18n');
const embedBuilder = require('../../utility/embedbuilder');

module.exports = {
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    try {
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const useLocale = discordServer.getBotLanguage();
      const helpTexts = [];

      helpTexts.push(`${i18n.__({ phrase: 'help.generalCommands.verify', locale: useLocale })}\n`);
      helpTexts.push('❔ **/verify help**');
      helpTexts.push(`${i18n.__({ phrase: 'help.generalCommands.verify-help', locale: useLocale })}\n`);
      helpTexts.push('✅ **/verify add**');
      helpTexts.push(`${i18n.__({ phrase: 'help.generalCommands.verify-add', locale: useLocale })}\n`);
      helpTexts.push('⚡ **/verify link**');
      helpTexts.push(`${i18n.__({ phrase: 'help.generalCommands.verify-link', locale: useLocale })}\n`);
      helpTexts.push('📃 **/verify list**');
      helpTexts.push(`${i18n.__({ phrase: 'help.generalCommands.verify-list', locale: useLocale })}\n`);
      helpTexts.push('🗑️ **/verify remove**');
      helpTexts.push(`${i18n.__({ phrase: 'help.generalCommands.verify-remove', locale: useLocale })}\n`);
      helpTexts.push('🔌 **/verify unlink**');
      helpTexts.push(`${i18n.__({ phrase: 'help.generalCommands.verify-unlink', locale: useLocale })}\n`);

      const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'verify.help.messageTitle', locale: useLocale }), helpTexts.join('\n'));
      await interaction.editReply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting your verification help.', ephemeral: true });
    }
  },
};
