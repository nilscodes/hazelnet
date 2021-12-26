const i18n = require('i18n');
const embedBuilder = require('../../utility/embedbuilder');

module.exports = {
  async execute(interaction) {
    const poolHash = interaction.options.getString('pool-id');
    try {
      await interaction.deferReply({ ephemeral: true });
      const newPoolPromise = await interaction.client.services.discordserver.addStakepool(interaction.guild.id, poolHash);
      const newPoolData = newPoolPromise.data;
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const useLocale = discordServer.getBotLanguage();
      const embed = embedBuilder.buildForAdmin(discordServer, '/configure-pool add', i18n.__({ phrase: 'configure.pool.add.success', locale: useLocale }), [
        {
          name: `${newPoolData.info?.name} (${newPoolData.info?.ticker})`,
          value: i18n.__({ phrase: 'info.stakepoolDetails', locale: useLocale }, newPoolData.info),
        },
      ]);
      await interaction.editReply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while adding official stakepool to your server. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
};
