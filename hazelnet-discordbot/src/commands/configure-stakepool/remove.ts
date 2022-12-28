import i18n from 'i18n';
import { DiscordServer, Stakepool } from '../../utility/sharedtypes';
import { BotSubcommand } from '../../utility/commandtypes';
const embedBuilder = require('../../utility/embedbuilder');

export default <BotSubcommand> {
  async execute(interaction) {
    const stakepoolHash = interaction.options.getString('pool-id');
    try {
      await interaction.deferReply({ ephemeral: true });

      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id) as DiscordServer;
      const stakepools = await interaction.client.services.discordserver.listStakepools(interaction.guild!.id) as Stakepool[];
      const locale = discordServer.getBotLanguage();
      const stakepoolToRemove = stakepools.find((stakepool) => stakepool.poolHash === stakepoolHash);
      if (stakepoolToRemove) {
        await interaction.client.services.discordserver.deleteStakepool(interaction.guild!.id, stakepoolToRemove.poolHash);
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-stakepool remove', i18n.__({ phrase: 'configure.stakepool.remove.success', locale }), 'configure-stakepool-remove', [
          {
            name: `${stakepoolToRemove.info?.name} (${stakepoolToRemove.info?.ticker})`,
            value: i18n.__({ phrase: 'info.stakepoolDetails', locale }, stakepoolToRemove.info),
          },
        ]);
        await interaction.editReply({ embeds: [embed] });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-stakepool remove', i18n.__({ phrase: 'configure.stakepool.remove.errorNotFound', locale }, { stakepoolHash } as any), 'configure-stakepool-remove');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while removing official stakepool from your server. Please contact your bot admin via https://www.hazelnet.io.' });
    }
  },
};
