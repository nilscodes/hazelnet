import i18n from 'i18n';
import { BotSubcommand } from '../../utility/commandtypes';
import embedBuilder from '../../utility/embedbuilder';

export default <BotSubcommand> {
  async execute(interaction) {
    const dRepHash = interaction.options.getString('drep-id', true);
    try {
      await interaction.deferReply({ ephemeral: true });
      const newDRepData = await interaction.client.services.discordserver.addDRep(interaction.guild!.id, dRepHash);
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      const embed = embedBuilder.buildForAdmin(discordServer, '/configure-drep add', i18n.__({ phrase: 'configure.drep.add.success', locale }), 'configure-drep-add', [
        {
          name: `${newDRepData.info?.name || i18n.__({ phrase: 'configure.drep.list.dRepNameEmpty', locale })}`,
          value: i18n.__({ phrase: 'info.dRepDetails', locale }, newDRepData.info),
        },
      ]);
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while adding official dRep to your server. Please contact your bot admin via https://www.vibrantnet.io.' });
    }
  },
};
