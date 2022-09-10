const i18n = require('i18n');
const {
  MessageActionRow, MessageSelectMenu,
} = require('discord.js');
const embedBuilder = require('../../utility/embedbuilder');
const tokenroles = require('../../utility/tokenroles');

module.exports = {
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      const maxDetailedRolesOnOnePage = 5;
      const maxForDropdown = 25;
      let customTokenRoleMessage = false;
      if (discordServer.tokenRoles.length > maxForDropdown) {
        customTokenRoleMessage = 'configure.tokenroles.list.tokenRoleDetailsShortCommand';
      } else if (discordServer.tokenRoles.length > maxDetailedRolesOnOnePage) {
        customTokenRoleMessage = 'configure.tokenroles.list.tokenRoleDetailsShortSelect';
      }

      const tokenRoleFields = discordServer.tokenRoles.map((tokenRole) => tokenroles.getTokenRoleDetailsText(tokenRole, discordServer, locale, false, customTokenRoleMessage));
      if (!tokenRoleFields.length) {
        tokenRoleFields.push({ name: i18n.__({ phrase: 'configure.tokenroles.list.noTokenRolesTitle', locale }), value: i18n.__({ phrase: 'configure.tokenroles.list.noTokenRolesDetail', locale }) });
      }
      if (!discordServer.premium && discordServer.tokenRoles.length > 1) {
        const lowestTokenRoleId = Math.min(...discordServer.tokenRoles.map((tokenRole) => +tokenRole.id));
        const lowestIdTokenRole = discordServer.tokenRoles.find((tokenRole) => tokenRole.id === lowestTokenRoleId);
        tokenRoleFields.unshift({
          name: i18n.__({ phrase: 'generic.blackEditionWarning', locale }),
          value: i18n.__({ phrase: 'configure.tokenroles.list.noPremium', locale }, { tokenRole: lowestIdTokenRole }),
        });
      }
      const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles list', i18n.__({ phrase: 'configure.tokenroles.list.purpose', locale }), 'configure-tokenroles-list', tokenRoleFields);
      const components = this.createDetailsDropdown(discordServer, maxForDropdown);
      await interaction.editReply({ embeds: [embed], components, ephemeral: true });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting auto-role-assignment for token owners. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
  createDetailsDropdown(discordServer, maxForDropdown) {
    if (discordServer.tokenRoles.length > 0 && discordServer.tokenRoles.length <= maxForDropdown) {
      const locale = discordServer.getBotLanguage();
      return [new MessageActionRow()
        .addComponents(
          new MessageSelectMenu()
            .setCustomId('configure-tokenroles/list/details')
            .setPlaceholder(i18n.__({ phrase: 'configure.tokenroles.list.chooseDetails', locale }))
            .addOptions(discordServer.tokenRoles.map((tokenRole) => ({
              label: i18n.__({ phrase: 'configure.tokenroles.list.chooseText', locale }, { tokenRole }),
              value: `token-role-id-${tokenRole.id}`,
            }))),
        ),
      ];
    }
    return undefined;
  },
  async executeSelectMenu(interaction) {
    try {
      await interaction.deferUpdate({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      const tokenRoleId = +interaction.values[0].replace('token-role-id-', '');
      const tokenRoleToShow = discordServer.tokenRoles.find((tokenRole) => tokenRole.id === tokenRoleId);
      if (tokenRoleToShow) {
        const tokenRoleFields = [tokenroles.getTokenRoleDetailsText(tokenRoleToShow, discordServer, locale, true)];
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles list', i18n.__({ phrase: 'configure.tokenroles.list.detailsPurpose', locale }), 'configure-tokenroles-list', tokenRoleFields);
        await interaction.followUp({ embeds: [embed], ephemeral: true });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles list', i18n.__({ phrase: 'configure.tokenroles.list.errorNotFound', locale }, { tokenRoleId }), 'configure-tokenroles-list');
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ components: [], ephemeral: true });
      await interaction.followUp({ content: 'Error while showing token role details. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
};
