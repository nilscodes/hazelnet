const NodeCache = require('node-cache');
const i18n = require('i18n');
const {
  MessageActionRow, MessageButton,
} = require('discord.js');
const embedBuilder = require('../../utility/embedbuilder');

module.exports = {
  cache: new NodeCache({ stdTTL: 900 }),
  async execute(interaction) {
    const role = interaction.options.getRole('role');
    const minimumStakeAda = interaction.options.getInteger('minimum-stake');
    const poolHash = interaction.options.getString('pool-id');
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const useLocale = discordServer.getBotLanguage();
      if (minimumStakeAda > 0) {
        const guild = await interaction.client.guilds.fetch(interaction.guild.id);
        const allUsers = await guild.members.fetch();
        const usersWithRole = allUsers.filter((member) => member?.roles.cache.some((memberRole) => memberRole.id === role.id)); // Can't use role.members.size since not all members might be cached
        if (usersWithRole.size === 0) {
          const embed = await this.createDelegatorRole(interaction, discordServer, poolHash, minimumStakeAda, role.id);
          await interaction.editReply({ embeds: [embed], ephemeral: true });
        } else {
          // Register add data in cache, as we cannot send it along with the button data.
          this.cache.set(`${interaction.guild.id}-${interaction.user.id}`, {
            poolHash,
            minimumStakeAda,
            roleId: role.id,
          });

          const components = [new MessageActionRow()
            .addComponents(
              new MessageButton()
                .setCustomId('configure-delegatorroles/add/confirm')
                .setLabel(i18n.__({ phrase: 'configure.delegatorroles.add.confirmRole', locale: useLocale }))
                .setStyle('PRIMARY'),
              new MessageButton()
                .setCustomId('configure-delegatorroles/add/cancel')
                .setLabel(i18n.__({ phrase: 'generic.cancel', locale: useLocale }))
                .setStyle('SECONDARY'),
            )];

          const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'configure.delegatorroles.add.roleInUseWarning', locale: useLocale }), i18n.__({ phrase: 'configure.delegatorroles.add.roleInUseDetails', locale: useLocale }, { roleId: role.id, memberCount: usersWithRole.size }));
          await interaction.editReply({ components, embeds: [embed], ephemeral: true });
        }
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-delegatorroles add', i18n.__({ phrase: 'configure.delegatorroles.add.errorMinimumStake', locale: useLocale }));
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while adding delegator role to your server. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
  async createDelegatorRole(interaction, discordServer, poolHash, minimumStakeAda, roleId) {
    const useLocale = discordServer.getBotLanguage();
    const newDelegatorRolePromise = await interaction.client.services.discordserver.createDelegatorRole(interaction.guild.id, poolHash, minimumStakeAda, roleId);
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
    return embed;
  },
  async executeButton(interaction) {
    const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
    const roleToAdd = this.cache.take(`${interaction.guild.id}-${interaction.user.id}`);
    if (interaction.customId === 'configure-delegatorroles/add/confirm') {
      this.confirm(interaction, discordServer, roleToAdd);
    } else if (interaction.customId === 'configure-delegatorroles/add/cancel') {
      this.cancel(interaction, discordServer, roleToAdd);
    }
  },
  async confirm(interaction, discordServer, roleToAdd) {
    const embed = await this.createDelegatorRole(interaction, discordServer, roleToAdd.poolHash, roleToAdd.minimumStakeAda, roleToAdd.roleId);
    await interaction.update({ embeds: [embed], components: [] });
  },
  async cancel(interaction, discordServer, roleToAdd) {
    const useLocale = discordServer.getBotLanguage();
    const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'generic.cancel', locale: useLocale }), i18n.__({ phrase: 'configure.delegatorroles.add.canceled', locale: useLocale }, roleToAdd));
    await interaction.update({ embeds: [embed], components: [] });
  },
};
