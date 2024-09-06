import i18n from 'i18n';
import { BotSubcommand } from '../../utility/commandtypes';
import embedBuilder from '../../utility/embedbuilder';

export default <BotSubcommand> {
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id) ;
      const dReps = await interaction.client.services.discordserver.listDReps(interaction.guild!.id);;
      const locale = discordServer.getBotLanguage();
      const infoMessageType = dReps.length > 6 ? 'info.dRepDetailsShort' : 'info.dRepDetails';
      const dRepFields = dReps.map((dRep) => ({
        name: `${dRep.info?.name || i18n.__({ phrase: 'configure.drep.list.dRepNameEmpty', locale })}`,
        value: i18n.__({ phrase: infoMessageType, locale }, dRep.info),
      }));
      if (!dRepFields.length) {
        dRepFields.push({ name: i18n.__({ phrase: 'configure.drep.list.noDRepName', locale }), value: i18n.__({ phrase: 'configure.drep.list.noDReps', locale }) });
      }
      const embed = embedBuilder.buildForAdmin(discordServer, '/configure-drep list', i18n.__({ phrase: 'configure.drep.list.purpose', locale }), 'configure-drep-list', dRepFields);
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting official dRep list. Please contact your bot admin via https://www.vibrantnet.io.' });
    }
  },
};
