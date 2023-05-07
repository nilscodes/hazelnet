import { BotSubcommand } from "../../utility/commandtypes";
import i18n from 'i18n';
import { DelegatorRole, Stakepool } from '@vibrantnet/core';
import embedBuilder from '../../utility/embedbuilder';

export default <BotSubcommand> {
  async execute(interaction) {
    const delegatorRoleIdToRemove = interaction.options.getInteger('delegator-role-id');
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const delegatorRoles = await interaction.client.services.discordserver.listDelegatorRoles(interaction.guild!.id) as DelegatorRole[];
      const stakepools = await interaction.client.services.discordserver.listStakepools(interaction.guild!.id);;
      const useLocale = discordServer.getBotLanguage();
      const delegatorRoleToRemove = delegatorRoles.find((delegatorRole) => delegatorRole.id === delegatorRoleIdToRemove);
      if (delegatorRoleToRemove) {
        await interaction.client.services.discordserver.deleteDelegatorRole(interaction.guild!.id, delegatorRoleToRemove.id);
        let fieldHeader = 'configure.delegatorroles.list.stakepoolNameInofficial';
        const officialStakepool = stakepools.find((stakepool) => stakepool.poolHash === delegatorRoleToRemove.poolHash);
        if (!delegatorRoleToRemove.poolHash) {
          fieldHeader = 'configure.delegatorroles.list.stakepoolNameAny';
        } else if (officialStakepool) {
          fieldHeader = 'configure.delegatorroles.list.stakepoolNameOfficial';
        }
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-delegatorroles remove', i18n.__({ phrase: 'configure.delegatorroles.remove.success', locale: useLocale }), 'configure-delegatorroles-remove', [
          {
            name: i18n.__({ phrase: fieldHeader, locale: useLocale }, { delegatorRole: delegatorRoleToRemove, officialStakepool } as any),
            value: i18n.__({ phrase: 'configure.delegatorroles.list.delegatorRoleDetails', locale: useLocale }, { delegatorRole: delegatorRoleToRemove, minimumStake: delegatorRoleToRemove.minimumStake / 1000000 } as any),
          },
        ]);
        await interaction.editReply({ embeds: [embed] });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-delegatorroles remove', i18n.__({ phrase: 'configure.delegatorroles.remove.errorNotFound', locale: useLocale }, { delegatorRoleId: delegatorRoleIdToRemove } as any), 'configure-delegatorroles-remove');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: `Error while removing auto-role assignment for role with ID ${delegatorRoleIdToRemove} from your server. Please contact your bot admin via https://www.hazelnet.io.` });
    }
  },
};
