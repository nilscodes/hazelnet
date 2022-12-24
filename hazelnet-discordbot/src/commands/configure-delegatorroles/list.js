const i18n = require('i18n');
const embedBuilder = require('../../utility/embedbuilder');

module.exports = {
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const delegatorRoles = await interaction.client.services.discordserver.listDelegatorRoles(interaction.guild.id);
      const stakepools = await interaction.client.services.discordserver.listStakepools(interaction.guild.id);
      const useLocale = discordServer.getBotLanguage();
      const delegatorRoleFields = delegatorRoles.map((delegatorRole) => {
        // TODO: Share Code across delegator role modules
        let fieldHeader = 'configure.delegatorroles.list.stakepoolNameInofficial';
        const officialStakepool = stakepools.find((stakepool) => stakepool.poolHash === delegatorRole.poolHash);
        if (!delegatorRole.poolHash) {
          fieldHeader = 'configure.delegatorroles.list.stakepoolNameAny';
        } else if (officialStakepool) {
          fieldHeader = 'configure.delegatorroles.list.stakepoolNameOfficial';
        }
        return {
          name: i18n.__({ phrase: fieldHeader, locale: useLocale }, { delegatorRole, officialStakepool }),
          value: i18n.__({ phrase: 'configure.delegatorroles.list.delegatorRoleDetails', locale: useLocale }, { delegatorRole, minimumStake: delegatorRole.minimumStake / 1000000 }),
        };
      });
      if (!delegatorRoleFields.length) {
        delegatorRoleFields.push({ name: i18n.__({ phrase: 'configure.delegatorroles.list.noDelegatorRolesTitle', locale: useLocale }), value: i18n.__({ phrase: 'configure.delegatorroles.list.noDelegatorRolesDetail', locale: useLocale }) });
      }
      if (!discordServer.premium && delegatorRoles.length > 1) {
        const lowestDelegatorRoleId = Math.min(...delegatorRoles.map((delegatorRole) => +delegatorRole.id));
        const lowestIdDelegatorRole = delegatorRoles.find((delegatorRole) => delegatorRole.id === lowestDelegatorRoleId);
        delegatorRoleFields.unshift({
          name: i18n.__({ phrase: 'generic.blackEditionWarning', locale: useLocale }),
          value: i18n.__({ phrase: 'configure.delegatorroles.list.noPremium', locale: useLocale }, { delegatorRole: lowestIdDelegatorRole }),
        });
      }
      const embed = embedBuilder.buildForAdmin(discordServer, '/configure-delegatorroles list', i18n.__({ phrase: 'configure.delegatorroles.list.purpose', locale: useLocale }), 'configure-delegatorroles-list', delegatorRoleFields);
      await interaction.editReply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting auto-role-assignment for delegators. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
};
