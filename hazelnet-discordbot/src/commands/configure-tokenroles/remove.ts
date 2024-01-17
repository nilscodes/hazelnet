import i18n from 'i18n';
import { BotSubcommand } from '../../utility/commandtypes';
import tokenroles from '../../utility/tokenroles';
import embedBuilder from '../../utility/embedbuilder';

export default <BotSubcommand> {
  async execute(interaction) {
    const tokenRoleIdToRemove = interaction.options.getInteger('token-role-id', true);
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const tokenRoles = await interaction.client.services.discordserver.listTokenOwnershipRoles(interaction.guild!.id);
      const tokenPolicies = await interaction.client.services.discordserver.listTokenPolicies(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      const tokenRoleToRemove = tokenRoles.find((tokenRole) => tokenRole.id === tokenRoleIdToRemove);
      if (tokenRoleToRemove) {
        await interaction.client.services.discordserver.deleteTokenRole(interaction.guild!.id, tokenRoleToRemove.id);
        const tokenRoleFields = tokenroles.getTokenRoleDetailsFields(tokenRoleToRemove, tokenPolicies, locale, true);
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles remove', i18n.__({ phrase: 'configure.tokenroles.remove.success', locale }), 'configure-tokenroles-remove', tokenRoleFields);
        await interaction.editReply({ embeds: [embed] });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles remove', i18n.__({ phrase: 'configure.tokenroles.remove.errorNotFound', locale }, { tokenRoleId: tokenRoleIdToRemove } as any), 'configure-tokenroles-remove');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: `Error while removing auto-role assignment for role with ID ${tokenRoleIdToRemove} from your server. Please contact your bot admin via https://www.vibrantnet.io.` });
    }
  },
};
