const NodeCache = require('node-cache');
const i18n = require('i18n');
const {
  MessageActionRow, MessageButton,
} = require('discord.js');
const embedBuilder = require('../../utility/embedbuilder');
const tokenroles = require('../../utility/tokenroles');

module.exports = {
  cache: new NodeCache({ stdTTL: 900 }),
  async execute(interaction) {
    const tokenRoleId = interaction.options.getInteger('token-role-id');
    const role = interaction.options.getRole('role');
    const minimumTokenQuantity = interaction.options.getString('count');
    const maximumTokenQuantity = interaction.options.getString('max-count');
    const aggregationType = interaction.options.getString('aggregation-type');
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();

      if (minimumTokenQuantity === null || parseInt(minimumTokenQuantity, 10) > 0) {
        if (maximumTokenQuantity === null || parseInt(maximumTokenQuantity, 10) === 0 || (parseInt(maximumTokenQuantity, 10) > 0 && parseInt(maximumTokenQuantity, 10) >= minimumTokenQuantity)) {
          let usersWithRole = null;
          if (role !== null) {
            const guild = await interaction.client.guilds.fetch(interaction.guild.id);
            const allUsers = await guild.members.fetch();
            usersWithRole = allUsers.filter((member) => member?.roles.cache.some((memberRole) => memberRole.id === role.id)); // Can't use role.members.size since not all members might be cached
          }
          if (usersWithRole === null || usersWithRole.size === 0) {
            const embed = await this.updateTokenRole(interaction, discordServer, tokenRoleId, minimumTokenQuantity, maximumTokenQuantity, role?.id, aggregationType);
            await interaction.editReply({ embeds: [embed], ephemeral: true });
          } else {
            // Register add data in cache, as we cannot send it along with the button data.
            this.cache.set(`${interaction.guild.id}-${interaction.user.id}`, {
              tokenRoleId,
              minimumTokenQuantity,
              maximumTokenQuantity,
              roleId: role?.id,
              aggregationType,
            });

            const components = [new MessageActionRow()
              .addComponents(
                new MessageButton()
                  .setCustomId('configure-tokenroles/update/confirm')
                  .setLabel(i18n.__({ phrase: 'configure.tokenroles.add.confirmRole', locale }))
                  .setStyle('PRIMARY'),
                new MessageButton()
                  .setCustomId('configure-tokenroles/update/cancel')
                  .setLabel(i18n.__({ phrase: 'generic.cancel', locale }))
                  .setStyle('SECONDARY'),
              )];

            const embed = embedBuilder.buildForAdmin(discordServer, i18n.__({ phrase: 'configure.tokenroles.add.roleInUseWarning', locale }), i18n.__({ phrase: 'configure.tokenroles.add.roleInUseDetails', locale }, { roleId: role.id, memberCount: usersWithRole.size }), 'configure-tokenroles-update');
            await interaction.editReply({ components, embeds: [embed], ephemeral: true });
          }
        } else {
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles update', i18n.__({ phrase: 'configure.tokenroles.add.errorMaximumTokens', locale }), 'configure-tokenroles-update');
          await interaction.editReply({ embeds: [embed], ephemeral: true });
        }
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles update', i18n.__({ phrase: 'configure.tokenroles.add.errorMinimumTokens', locale }), 'configure-tokenroles-update');
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while adding automatic token-role assignment to your server. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
  async updateTokenRole(interaction, discordServer, tokenRoleId, minimumTokenQuantity, maximumTokenQuantity, roleId, aggregationType) {
    const locale = discordServer.getBotLanguage();
    const tokenRole = await interaction.client.services.discordserver.updateTokenRole(interaction.guild.id, tokenRoleId, null, minimumTokenQuantity, maximumTokenQuantity, roleId, aggregationType);

    const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles update', i18n.__({ phrase: 'configure.tokenroles.update.success', locale }), 'configure-tokenroles-update', [
      tokenroles.getTokenRoleDetailsText(tokenRole, discordServer, locale),
    ]);
    return embed;
  },
  async executeButton(interaction) {
    const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
    const roleToUpdate = this.cache.take(`${interaction.guild.id}-${interaction.user.id}`);
    if (roleToUpdate) {
      if (interaction.customId === 'configure-tokenroles/update/confirm') {
        this.confirm(interaction, discordServer, roleToUpdate);
      } else if (interaction.customId === 'configure-tokenroles/update/cancel') {
        this.cancel(interaction, discordServer, roleToUpdate);
      }
    } else {
      interaction.client.logger.warn(`User ${interaction.user.id} tried to add a token role for guild ${interaction.guild.id}, but the role add cache was empty.`);
    }
  },
  async confirm(interaction, discordServer, roleToUpdate) {
    const embed = await this.updateTokenRole(interaction, discordServer, roleToUpdate.tokenRoleId, roleToUpdate.minimumTokenQuantity, roleToUpdate.maximumTokenQuantity, roleToUpdate.roleId, roleToUpdate.aggregationType);
    await interaction.update({ embeds: [embed], components: [] });
  },
  async cancel(interaction, discordServer, roleToUpdate) {
    const locale = discordServer.getBotLanguage();
    const embed = embedBuilder.buildForAdmin(discordServer, i18n.__({ phrase: 'generic.cancel', locale }), i18n.__({ phrase: 'configure.tokenroles.update.canceled', locale }, roleToUpdate), 'configure-tokenroles-update');
    await interaction.update({ embeds: [embed], components: [] });
  },
};
