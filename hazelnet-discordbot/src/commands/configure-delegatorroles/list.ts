import i18n from 'i18n';
import { BotSubcommand } from "../../utility/commandtypes";
import embedBuilder from '../../utility/embedbuilder';

export default <BotSubcommand> {
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const dRepDelegatorRoles = await interaction.client.services.discordserver.listDRepDelegatorRoles(interaction.guild!.id);
      const dReps = await interaction.client.services.discordserver.listDReps(interaction.guild!.id);;
      const locale = discordServer.getBotLanguage();
      const dRepDelegatorRoleFields = dRepDelegatorRoles.map((dRepDelegatorRole) => {
        // TODO: Share Code across delegator role modules
        let fieldHeader = 'configure.delegatorroles.list.stakepoolNameInofficial';
        const officialDRep = dReps.find((dRep) => dRep.dRepHash === dRepDelegatorRole.dRepHash);
        if (!dRepDelegatorRole.dRepHash) {
          fieldHeader = 'configure.delegatorroles.list.stakepoolNameAny';
        } else if (officialDRep) {
          fieldHeader = 'configure.delegatorroles.list.stakepoolNameOfficial';
        }
        const maxInfo = dRepDelegatorRole.maximumStake ? i18n.__({ phrase: 'configure.delegatorroles.list.maxInfo', locale }, { maximumStake: dRepDelegatorRole.maximumStake / 1000000 } as any) : '';
        return {
          name: i18n.__({ phrase: fieldHeader, locale }, { delegatorRole: dRepDelegatorRole, officialStakepool: officialDRep } as any),
          value: i18n.__({ phrase: 'configure.delegatorroles.list.delegatorRoleDetails', locale }, { delegatorRole: dRepDelegatorRole, minimumStake: dRepDelegatorRole.minimumStake / 1000000, maxInfo } as any),
        };
      });
      if (!dRepDelegatorRoleFields.length) {
        dRepDelegatorRoleFields.push({ name: i18n.__({ phrase: 'configure.delegatorroles.list.noDelegatorRolesTitle', locale }), value: i18n.__({ phrase: 'configure.delegatorroles.list.noDelegatorRolesDetail', locale }) });
      }
      if (!discordServer.premium && dRepDelegatorRoles.length > 1) {
        const lowestDelegatorRoleId = Math.min(...dRepDelegatorRoles.map((delegatorRole) => +delegatorRole.id));
        const lowestIdDelegatorRole = dRepDelegatorRoles.find((delegatorRole) => delegatorRole.id === lowestDelegatorRoleId);
        dRepDelegatorRoleFields.unshift({
          name: i18n.__({ phrase: 'generic.blackEditionWarning', locale }),
          value: i18n.__({ phrase: 'configure.delegatorroles.list.noPremium', locale }, { delegatorRole: lowestIdDelegatorRole } as any),
        });
      }
      const embed = embedBuilder.buildForAdmin(discordServer, '/configure-delegatorroles list', i18n.__({ phrase: 'configure.delegatorroles.list.purpose', locale }), 'configure-delegatorroles-list', dRepDelegatorRoleFields);
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting auto-role-assignment for stakepool delegators. Please contact your bot admin via https://www.vibrantnet.io.' });
    }
  },
};
