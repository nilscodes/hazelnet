import i18n from 'i18n';
import { BotSubcommand } from "../../utility/commandtypes";
import embedBuilder from '../../utility/embedbuilder';

export default <BotSubcommand> {
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const delegatorRoles = await interaction.client.services.discordserver.listDRepDelegatorRoles(interaction.guild!.id);
      const dReps = await interaction.client.services.discordserver.listDReps(interaction.guild!.id);;
      const locale = discordServer.getBotLanguage();
      const delegatorRoleFields = delegatorRoles.map((delegatorRole) => {
        // TODO: Share Code across delegator role modules
        let fieldHeader = 'configure.drepdelegatorroles.list.dRepNameInofficial';
        const officialDRep = dReps.find((dRep) => dRep.dRepHash === delegatorRole.dRepHash);
        if (!delegatorRole.dRepHash) {
          fieldHeader = 'configure.drepdelegatorroles.list.dRepNameAny';
        } else if (officialDRep) {
          fieldHeader = 'configure.drepdelegatorroles.list.dRepNameOfficial';
        }
        const maxInfo = delegatorRole.maximumStake ? i18n.__({ phrase: 'configure.drepdelegatorroles.list.maxInfo', locale }, { maximumStake: delegatorRole.maximumStake / 1000000 } as any) : '';
        return {
          name: i18n.__({ phrase: fieldHeader, locale }, { delegatorRole, officialDRep } as any),
          value: i18n.__({ phrase: 'configure.drepdelegatorroles.list.delegatorRoleDetails', locale }, { delegatorRole, minimumStake: delegatorRole.minimumStake / 1000000, maxInfo } as any),
        };
      });
      if (!delegatorRoleFields.length) {
        delegatorRoleFields.push({ name: i18n.__({ phrase: 'configure.drepdelegatorroles.list.noDelegatorRolesTitle', locale }), value: i18n.__({ phrase: 'configure.drepdelegatorroles.list.noDelegatorRolesDetail', locale }) });
      }
      if (!discordServer.premium && delegatorRoles.length > 1) {
        const lowestDelegatorRoleId = Math.min(...delegatorRoles.map((delegatorRole) => +delegatorRole.id));
        const lowestIdDelegatorRole = delegatorRoles.find((delegatorRole) => delegatorRole.id === lowestDelegatorRoleId);
        delegatorRoleFields.unshift({
          name: i18n.__({ phrase: 'generic.blackEditionWarning', locale }),
          value: i18n.__({ phrase: 'configure.drepdelegatorroles.list.noPremium', locale }, { delegatorRole: lowestIdDelegatorRole } as any),
        });
      }
      const embed = embedBuilder.buildForAdmin(discordServer, '/configure-drepdelegatorroles list', i18n.__({ phrase: 'configure.drepdelegatorroles.list.purpose', locale }), 'configure-drepdelegatorroles-list', delegatorRoleFields);
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting auto-role-assignment for dRep delegators. Please contact your bot admin via https://www.vibrantnet.io.' });
    }
  },
};
