import i18n from 'i18n';
import { BotSubcommand } from '../../utility/commandtypes';
import embedBuilder from '../../utility/embedbuilder';

export default <BotSubcommand> {
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id) ;
      const stakepools = await interaction.client.services.discordserver.listStakepools(interaction.guild!.id);;
      const locale = discordServer.getBotLanguage();
      const infoMessageType = stakepools.length > 6 ? 'info.stakepoolDetailsShort' : 'info.stakepoolDetails';
      const stakepoolFields = stakepools.map((stakepool) => ({
        name: `${stakepool.info?.name} (${stakepool.info?.ticker})`,
        value: i18n.__({ phrase: infoMessageType, locale }, stakepool.info),
      }));
      if (!stakepoolFields.length) {
        stakepoolFields.push({ name: i18n.__({ phrase: 'configure.stakepool.list.noPoolName', locale }), value: i18n.__({ phrase: 'configure.stakepool.list.noPools', locale }) });
      }
      const embed = embedBuilder.buildForAdmin(discordServer, '/configure-stakepool list', i18n.__({ phrase: 'configure.stakepool.list.purpose', locale }), 'configure-stakepool-list', stakepoolFields);
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting official pool list. Please contact your bot admin via https://www.hazelnet.io.' });
    }
  },
};
