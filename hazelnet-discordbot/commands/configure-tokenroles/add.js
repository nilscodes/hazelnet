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
    const minimumTokenQuantity = interaction.options.getString('count');
    const policyId = interaction.options.getString('policy-id');
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const useLocale = discordServer.getBotLanguage();
      if (parseInt(minimumTokenQuantity, 10) > 0) {
        const guild = await interaction.client.guilds.fetch(interaction.guild.id);
        const allUsers = await guild.members.fetch();
        const usersWithRole = allUsers.filter((member) => member?.roles.cache.some((memberRole) => memberRole.id === role.id)); // Can't use role.members.size since not all members might be cached
        if (usersWithRole.size === 0) {
          const embed = await this.createTokenRole(interaction, discordServer, policyId, minimumTokenQuantity, role.id);
          await interaction.editReply({ embeds: [embed], ephemeral: true });
        } else {
          // Register add data in cache, as we cannot send it along with the button data.
          this.cache.set(`${interaction.guild.id}-${interaction.user.id}`, {
            policyId,
            minimumTokenQuantity,
            roleId: role.id,
          });

          const components = [new MessageActionRow()
            .addComponents(
              new MessageButton()
                .setCustomId('configure-tokenroles/add/confirm')
                .setLabel(i18n.__({ phrase: 'configure.tokenroles.add.confirmRole', locale: useLocale }))
                .setStyle('PRIMARY'),
              new MessageButton()
                .setCustomId('configure-tokenroles/add/cancel')
                .setLabel(i18n.__({ phrase: 'generic.cancel', locale: useLocale }))
                .setStyle('SECONDARY'),
            )];

          const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'configure.tokenroles.add.roleInUseWarning', locale: useLocale }), i18n.__({ phrase: 'configure.tokenroles.add.roleInUseDetails', locale: useLocale }, { roleId: role.id, memberCount: usersWithRole.size }));
          await interaction.editReply({ components, embeds: [embed], ephemeral: true });
        }
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles add', i18n.__({ phrase: 'configure.tokenroles.add.errorMinimumTokens', locale: useLocale }));
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while adding automatic token-role assignment to your server. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
  async createTokenRole(interaction, discordServer, policyId, minimumTokenQuantity, roleId) {
    const useLocale = discordServer.getBotLanguage();
    const newTokenRolePromise = await interaction.client.services.discordserver.createTokenRole(interaction.guild.id, policyId, minimumTokenQuantity, roleId);
    const newTokenRole = newTokenRolePromise.data;

    const officialProject = discordServer.tokenPolicies.find((tokenPolicy) => tokenPolicy.policyId === newTokenRole.policyId);
    const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles add', i18n.__({ phrase: 'configure.tokenroles.add.success', locale: useLocale }), [
      {
        name: i18n.__({ phrase: (officialProject ? 'configure.tokenroles.list.tokenRoleNameOfficial' : 'configure.tokenroles.list.tokenRoleNameInofficial'), locale: useLocale }, { tokenRole: newTokenRole, officialProject }),
        value: i18n.__({ phrase: 'configure.tokenroles.list.tokenRoleDetails', locale: useLocale }, { tokenRole: newTokenRole }),
      },
    ]);
    return embed;
  },
  async executeButton(interaction) {
    const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
    const roleToAdd = this.cache.take(`${interaction.guild.id}-${interaction.user.id}`);
    if (interaction.customId === 'configure-tokenroles/add/confirm') {
      this.confirm(interaction, discordServer, roleToAdd);
    } else if (interaction.customId === 'configure-tokenroles/add/cancel') {
      this.cancel(interaction, discordServer, roleToAdd);
    }
  },
  async confirm(interaction, discordServer, roleToAdd) {
    const embed = await this.createTokenRole(interaction, discordServer, roleToAdd.policyId, roleToAdd.minimumTokenQuantity, roleToAdd.roleId);
    await interaction.update({ embeds: [embed], components: [] });
  },
  async cancel(interaction, discordServer, roleToAdd) {
    const useLocale = discordServer.getBotLanguage();
    const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'generic.cancel', locale: useLocale }), i18n.__({ phrase: 'configure.tokenroles.add.canceled', locale: useLocale }, roleToAdd));
    await interaction.update({ embeds: [embed], components: [] });
  },
};
