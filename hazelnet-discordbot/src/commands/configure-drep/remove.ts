import i18n from 'i18n';
import { BotSubcommand } from '../../utility/commandtypes';
import embedBuilder from '../../utility/embedbuilder';

export default <BotSubcommand> {
  async execute(interaction) {
    const dRepHash = interaction.options.getString('drep-id');
    try {
      await interaction.deferReply({ ephemeral: true });

      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id) ;
      const dReps = await interaction.client.services.discordserver.listDReps(interaction.guild!.id);;
      const locale = discordServer.getBotLanguage();
      const dRepToRemove = dReps.find((dRep) => dRep.dRepHash === dRepHash);
      if (dRepToRemove) {
        await interaction.client.services.discordserver.deleteDRep(interaction.guild!.id, dRepToRemove.dRepHash);
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-drep remove', i18n.__({ phrase: 'configure.drep.remove.success', locale }), 'configure-drep-remove', [
          {
            name: `${dRepToRemove.info?.name || i18n.__({ phrase: 'configure.drep.list.dRepNameEmpty', locale })}`,
            value: i18n.__({ phrase: 'info.dRepDetails', locale }, dRepToRemove.info),
          },
        ]);
        await interaction.editReply({ embeds: [embed] });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-drep remove', i18n.__({ phrase: 'configure.drep.remove.errorNotFound', locale }, { dRepHash } as any), 'configure-drep-remove');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while removing official dRep from your server. Please contact your bot admin via https://www.vibrantnet.io.' });
    }
  },
};
