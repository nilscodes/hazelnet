const i18n = require('i18n');
const embedBuilder = require('../../utility/embedbuilder');

module.exports = {
  async execute(interaction) {
    const role = interaction.options.getRole('role');
    const minimumStakeAda = interaction.options.getInteger('minimum-stake');
    const poolHash = interaction.options.getString('pool-id');
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const useLocale = discordServer.getBotLanguage();
      const newDelegatorRolePromise = await interaction.client.services.discordserver.createDelegatorRole(interaction.guild.id, poolHash, minimumStakeAda, role.id);
      const newDelegatorRole = newDelegatorRolePromise.data;

      let fieldHeader = 'configure.delegatorroles.list.stakepoolNameInofficial';
      const officialStakepool = discordServer.stakepools.find((stakepool) => stakepool.poolHash === newDelegatorRole.poolHash);
      if (!newDelegatorRole.poolHash) {
        fieldHeader = 'configure.delegatorroles.list.stakepoolNameAny';
      } else if (officialStakepool) {
        fieldHeader = 'configure.delegatorroles.list.stakepoolNameOfficial';
      }
      const embed = embedBuilder.buildForAdmin(discordServer, '/configure-delegatorroles add', i18n.__({ phrase: 'configure.delegatorroles.add.success', locale: useLocale }), [
        {
          name: i18n.__({ phrase: fieldHeader, locale: useLocale }, { delegatorRole: newDelegatorRole, officialStakepool }),
          value: i18n.__({ phrase: 'configure.delegatorroles.list.delegatorRoleDetails', locale: useLocale }, { delegatorRole: newDelegatorRole, minimumStake: newDelegatorRole.minimumStake / 1000000 }),
        },
      ]);
      await interaction.editReply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while adding delegator role to your server. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
};
