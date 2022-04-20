const i18n = require('i18n');
const {
  MessageActionRow, MessageSelectMenu,
} = require('discord.js');
const embedBuilder = require('../../utility/embedbuilder');

module.exports = {
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      const maxDetailedRolesOnOnePage = 5;
      const maxForDropdown = 25;
      let tokenRoleMessage = 'configure.tokenroles.list.tokenRoleDetails';
      if (discordServer.tokenRoles.length > maxForDropdown) {
        tokenRoleMessage = 'configure.tokenroles.list.tokenRoleDetailsShortCommand';
      } else if (discordServer.tokenRoles.length > maxDetailedRolesOnOnePage) {
        tokenRoleMessage = 'configure.tokenroles.list.tokenRoleDetailsShortSelect';
      }

      const tokenRoleFields = discordServer.tokenRoles.map((tokenRole) => {
        const officialProject = discordServer.tokenPolicies.find((tokenPolicy) => tokenPolicy.policyId === tokenRole.policyId);
        const policyIdShort = `${tokenRole.policyId.substr(0, 10)}…`;
        const fingerprintInfo = tokenRole.assetFingerprint ? i18n.__({ phrase: 'configure.tokenroles.list.fingerprintInfo', locale }, { tokenRole }) : '';
        const maximumInfo = tokenRole.maximumTokenQuantity ? i18n.__({ phrase: 'configure.tokenroles.list.maximumInfo', locale }, { tokenRole }) : '';
        return {
          name: i18n.__({ phrase: (officialProject ? 'configure.tokenroles.list.tokenRoleNameOfficial' : 'configure.tokenroles.list.tokenRoleNameInofficial'), locale }, { tokenRole, officialProject, policyIdShort }),
          value: i18n.__({ phrase: tokenRoleMessage, locale }, { tokenRole, fingerprintInfo, maximumInfo }),
        };
      });
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
      const components = this.createDetailsDropdown(discordServer, maxDetailedRolesOnOnePage, maxForDropdown);
      await interaction.editReply({ embeds: [embed], components, ephemeral: true });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting auto-role-assignment for token owners. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
  createDetailsDropdown(discordServer, maxDetailedRolesOnOnePage, maxForDropdown) {
    if (discordServer.tokenRoles.length > maxDetailedRolesOnOnePage && discordServer.tokenRoles.length <= maxForDropdown) {
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
        const officialProject = discordServer.tokenPolicies.find((tokenPolicy) => tokenPolicy.policyId === tokenRoleToShow.policyId);
        const policyIdShort = `${tokenRoleToShow.policyId.substr(0, 10)}…`;
        const fingerprintInfo = tokenRoleToShow.assetFingerprint ? i18n.__({ phrase: 'configure.tokenroles.list.fingerprintInfo', locale }, { tokenRoleToShow }) : '';
        const maximumInfo = tokenRoleToShow.maximumTokenQuantity ? i18n.__({ phrase: 'configure.tokenroles.list.maximumInfo', locale }, { tokenRoleToShow }) : '';
        const tokenRoleFields = [{
          name: i18n.__({ phrase: (officialProject ? 'configure.tokenroles.list.tokenRoleNameOfficial' : 'configure.tokenroles.list.tokenRoleNameInofficial'), locale }, { tokenRole: tokenRoleToShow, officialProject, policyIdShort }),
          value: i18n.__({ phrase: 'configure.tokenroles.list.tokenRoleDetails', locale }, { tokenRole: tokenRoleToShow, fingerprintInfo, maximumInfo }),
        }];
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
