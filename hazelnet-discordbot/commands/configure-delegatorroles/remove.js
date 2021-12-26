const i18n = require('i18n');
const embedBuilder = require('../../utility/embedbuilder');

module.exports = {
  async execute(interaction) {
    const delegatorRoleIdToRemove = interaction.options.getInteger('delegator-role-id');
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const useLocale = discordServer.getBotLanguage();
      const delegatorRoleToRemove = discordServer.delegatorRoles.find((delegatorRole) => delegatorRole.id === delegatorRoleIdToRemove);
      if (delegatorRoleToRemove) {
        await interaction.client.services.discordserver.deleteDelegatorRole(interaction.guild.id, delegatorRoleToRemove.id);
        let fieldHeader = 'configure.delegatorroles.list.stakepoolNameInofficial';
        const officialStakepool = discordServer.stakepools.find((stakepool) => stakepool.poolHash === delegatorRoleToRemove.poolHash);
        if (!delegatorRoleToRemove.poolHash) {
          fieldHeader = 'configure.delegatorroles.list.stakepoolNameAny';
        } else if (officialStakepool) {
          fieldHeader = 'configure.delegatorroles.list.stakepoolNameOfficial';
        }
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-delegatorroles remove', i18n.__({ phrase: 'configure.delegatorroles.remove.success', locale: useLocale }), [
          {
            name: i18n.__({ phrase: fieldHeader, locale: useLocale }, { delegatorRole: delegatorRoleToRemove, officialStakepool }),
            value: i18n.__({ phrase: 'configure.delegatorroles.list.delegatorRoleDetails', locale: useLocale }, { delegatorRole: delegatorRoleToRemove, minimumStake: delegatorRoleToRemove.minimumStake / 1000000 }),
          },
        ]);
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-delegatorroles remove', i18n.__({ phrase: 'configure.delegatorroles.remove.errorNotFound', locale: useLocale }, { delegatorRoleId: delegatorRoleIdToRemove }));
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: `Error while removing auto-role assignment for role with ID ${delegatorRoleIdToRemove} from your server. Please contact your bot admin via https://www.hazelnet.io.`, ephemeral: true });
    }
  },
};
