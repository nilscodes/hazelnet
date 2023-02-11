import i18n from 'i18n';
import { BotSubcommand } from '../../utility/commandtypes';
import embedBuilder from '../../utility/embedbuilder';

export default <BotSubcommand> {
  async execute(interaction) {
    const poolHash = interaction.options.getString('pool-id', true);
    try {
      await interaction.deferReply({ ephemeral: true });
      const newPoolPromise = await interaction.client.services.discordserver.addStakepool(interaction.guild!.id, poolHash);
      const newPoolData = newPoolPromise.data;
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      const embed = embedBuilder.buildForAdmin(discordServer, '/configure-stakepool add', i18n.__({ phrase: 'configure.stakepool.add.success', locale }), 'configure-stakepool-add', [
        {
          name: `${newPoolData.info?.name} (${newPoolData.info?.ticker})`,
          value: i18n.__({ phrase: 'info.stakepoolDetails', locale }, newPoolData.info),
        },
      ]);
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while adding official stakepool to your server. Please contact your bot admin via https://www.hazelnet.io.' });
    }
  },
};
