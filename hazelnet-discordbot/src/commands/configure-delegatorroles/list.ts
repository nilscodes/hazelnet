import i18n from 'i18n';
import { BotSubcommand } from "../../utility/commandtypes";
import embedBuilder from '../../utility/embedbuilder';

export default <BotSubcommand> {
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const delegatorRoles = await interaction.client.services.discordserver.listDelegatorRoles(interaction.guild!.id);
      const stakepools = await interaction.client.services.discordserver.listStakepools(interaction.guild!.id);;
      const locale = discordServer.getBotLanguage();
      const delegatorRoleFields = delegatorRoles.map((delegatorRole) => {
        // TODO: Share Code across delegator role modules
        let fieldHeader = 'configure.delegatorroles.list.stakepoolNameInofficial';
        const officialStakepool = stakepools.find((stakepool) => stakepool.poolHash === delegatorRole.poolHash);
        if (!delegatorRole.poolHash) {
          fieldHeader = 'configure.delegatorroles.list.stakepoolNameAny';
        } else if (officialStakepool) {
          fieldHeader = 'configure.delegatorroles.list.stakepoolNameOfficial';
        }
        const maxInfo = delegatorRole.maximumStake ? i18n.__({ phrase: 'configure.delegatorroles.list.maxInfo', locale }, { maximumStake: delegatorRole.maximumStake / 1000000 } as any) : '';
        return {
          name: i18n.__({ phrase: fieldHeader, locale }, { delegatorRole, officialStakepool } as any),
          value: i18n.__({ phrase: 'configure.delegatorroles.list.delegatorRoleDetails', locale }, { delegatorRole, minimumStake: delegatorRole.minimumStake / 1000000, maxInfo } as any),
        };
      });
      if (!delegatorRoleFields.length) {
        delegatorRoleFields.push({ name: i18n.__({ phrase: 'configure.delegatorroles.list.noDelegatorRolesTitle', locale }), value: i18n.__({ phrase: 'configure.delegatorroles.list.noDelegatorRolesDetail', locale }) });
      }
      if (!discordServer.premium && delegatorRoles.length > 1) {
        const lowestDelegatorRoleId = Math.min(...delegatorRoles.map((delegatorRole) => +delegatorRole.id));
        const lowestIdDelegatorRole = delegatorRoles.find((delegatorRole) => delegatorRole.id === lowestDelegatorRoleId);
        delegatorRoleFields.unshift({
          name: i18n.__({ phrase: 'generic.blackEditionWarning', locale }),
          value: i18n.__({ phrase: 'configure.delegatorroles.list.noPremium', locale }, { delegatorRole: lowestIdDelegatorRole } as any),
        });
      }
      const embed = embedBuilder.buildForAdmin(discordServer, '/configure-delegatorroles list', i18n.__({ phrase: 'configure.delegatorroles.list.purpose', locale }), 'configure-delegatorroles-list', delegatorRoleFields);
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting auto-role-assignment for stakepool delegators. Please contact your bot admin via https://www.vibrantnet.io.' });
    }
  },
};
