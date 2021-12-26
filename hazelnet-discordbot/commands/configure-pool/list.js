const i18n = require('i18n');
const embedBuilder = require('../../utility/embedbuilder');

module.exports = {
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const useLocale = discordServer.getBotLanguage();
      const stakepoolFields = discordServer.stakepools.map((stakepool) => ({
        name: `${stakepool.info?.name} (${stakepool.info?.ticker})`,
        value: i18n.__({ phrase: 'info.stakepoolDetails', locale: useLocale }, stakepool.info),
      }));
      if (!stakepoolFields.length) {
        stakepoolFields.push({ name: i18n.__({ phrase: 'configure.pool.list.noPoolName', locale: useLocale }), value: i18n.__({ phrase: 'configure.pool.list.noPools', locale: useLocale }) });
      }
      const embed = embedBuilder.buildForAdmin(discordServer, '/configure-pool list', i18n.__({ phrase: 'configure.pool.list.purpose', locale: useLocale }), stakepoolFields);
      await interaction.editReply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting official pool list. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
};
