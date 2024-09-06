import i18n from 'i18n';
import { BotSubcommand } from "../../utility/commandtypes";
import embedBuilder from '../../utility/embedbuilder';

export default <BotSubcommand> {
  async execute(interaction) {
    const delegatorRoleIdToRemove = interaction.options.getInteger('delegator-role-id');
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const delegatorRoles = await interaction.client.services.discordserver.listDRepDelegatorRoles(interaction.guild!.id);
      const dReps = await interaction.client.services.discordserver.listDReps(interaction.guild!.id);;
      const locale = discordServer.getBotLanguage();
      const delegatorRoleToRemove = delegatorRoles.find((delegatorRole) => delegatorRole.id === delegatorRoleIdToRemove);
      if (delegatorRoleToRemove) {
        await interaction.client.services.discordserver.deleteDRepDelegatorRole(interaction.guild!.id, delegatorRoleToRemove.id);
        let fieldHeader = 'configure.drepdelegatorroles.list.dRepNameInofficial';
        const officialDRep = dReps.find((dRep) => dRep.dRepHash === delegatorRoleToRemove.dRepHash);
        if (!delegatorRoleToRemove.dRepHash) {
          fieldHeader = 'configure.drepdelegatorroles.list.dRepNameAny';
        } else if (officialDRep) {
          fieldHeader = 'configure.drepdelegatorroles.list.dRepNameOfficial';
        }
        const maxInfo = delegatorRoleToRemove.maximumStake ? i18n.__({ phrase: 'configure.drepdelegatorroles.list.maxInfo', locale }, { maximumStake: delegatorRoleToRemove.maximumStake / 1000000 } as any) : '';
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-drepdelegatorroles remove', i18n.__({ phrase: 'configure.drepdelegatorroles.remove.success', locale }), 'configure-drepdelegatorroles-remove', [
          {
            name: i18n.__({ phrase: fieldHeader, locale }, { delegatorRole: delegatorRoleToRemove, officialDRep } as any),
            value: i18n.__({ phrase: 'configure.drepdelegatorroles.list.delegatorRoleDetails', locale }, { delegatorRole: delegatorRoleToRemove, minimumStake: delegatorRoleToRemove.minimumStake / 1000000, maxInfo } as any),
          },
        ]);
        await interaction.editReply({ embeds: [embed] });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-drepdelegatorroles remove', i18n.__({ phrase: 'configure.drepdelegatorroles.remove.errorNotFound', locale }, { delegatorRoleId: delegatorRoleIdToRemove } as any), 'configure-drepdelegatorroles-remove');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: `Error while removing auto-role assignment for dRep delegator role with ID ${delegatorRoleIdToRemove} from your server. Please contact your bot admin via https://www.vibrantnet.io.` });
    }
  },
};
