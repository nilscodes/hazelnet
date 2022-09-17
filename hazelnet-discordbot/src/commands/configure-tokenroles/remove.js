const i18n = require('i18n');
const embedBuilder = require('../../utility/embedbuilder');
const tokenroles = require('../../utility/tokenroles');

module.exports = {
  async execute(interaction) {
    const tokenRoleIdToRemove = interaction.options.getInteger('token-role-id');
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      const tokenRoleToRemove = discordServer.tokenRoles.find((tokenRole) => tokenRole.id === tokenRoleIdToRemove);
      if (tokenRoleToRemove) {
        await interaction.client.services.discordserver.deleteTokenRole(interaction.guild.id, tokenRoleToRemove.id);
        const tokenRoleFields = tokenroles.getTokenRoleDetailsFields(tokenRoleToRemove, discordServer, locale, true);
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles remove', i18n.__({ phrase: 'configure.tokenroles.remove.success', locale }), 'configure-tokenroles-remove', tokenRoleFields);
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles remove', i18n.__({ phrase: 'configure.tokenroles.remove.errorNotFound', locale }, { tokenRoleId: tokenRoleIdToRemove }), 'configure-tokenroles-remove');
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: `Error while removing auto-role assignment for role with ID ${tokenRoleIdToRemove} from your server. Please contact your bot admin via https://www.hazelnet.io.`, ephemeral: true });
    }
  },
};
