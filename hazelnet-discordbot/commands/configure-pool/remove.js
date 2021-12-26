const i18n = require('i18n');
const embedBuilder = require('../../utility/embedbuilder');

module.exports = {
  async execute(interaction) {
    const stakepoolHash = interaction.options.getString('pool-id');
    try {
      await interaction.deferReply({ ephemeral: true });

      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const useLocale = discordServer.getBotLanguage();
      const stakepoolToRemove = discordServer.stakepools.find((stakepool) => stakepool.poolHash === stakepoolHash);
      if (stakepoolToRemove) {
        await interaction.client.services.discordserver.deleteStakepool(interaction.guild.id, stakepoolToRemove.poolHash);
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-pool remove', i18n.__({ phrase: 'configure.pool.remove.success', locale: useLocale }), [
          {
            name: `${stakepoolToRemove.info?.name} (${stakepoolToRemove.info?.ticker})`,
            value: i18n.__({ phrase: 'info.stakepoolDetails', locale: useLocale }, stakepoolToRemove.info),
          },
        ]);
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-pool remove', i18n.__({ phrase: 'configure.pool.remove.errorNotFound', locale: useLocale }, { stakepoolHash }));
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while removing official stakepool from your server. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
};
