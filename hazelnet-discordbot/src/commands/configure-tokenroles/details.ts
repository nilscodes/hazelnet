import i18n from 'i18n';
import { BotSubcommand } from '../../utility/commandtypes';
import tokenroles from '../../utility/tokenroles';
import embedBuilder from '../../utility/embedbuilder';

export default <BotSubcommand> {
  async execute(interaction) {
    const tokenRoleId = interaction.options.getInteger('token-role-id');
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      const tokenRoles = await interaction.client.services.discordserver.listTokenOwnershipRoles(interaction.guild!.id);
      const tokenPolicies = await interaction.client.services.discordserver.listTokenPolicies(interaction.guild!.id);
      const tokenRoleToShow = tokenRoles.find((tokenRole) => tokenRole.id === tokenRoleId);
      if (tokenRoleToShow) {
        const embed = embedBuilder.buildForAdmin(
          discordServer,
          '/configure-tokenroles details',
          i18n.__({ phrase: 'configure.tokenroles.details.purpose', locale }),
          'configure-tokenroles-details',
          tokenroles.getTokenRoleDetailsFields(tokenRoleToShow, tokenPolicies, locale, true),
        );
        await interaction.editReply({ embeds: [embed] });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles details', i18n.__({ phrase: 'configure.tokenroles.list.errorNotFound', locale }, { tokenRoleId } as any), 'configure-tokenroles-details');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: `Error while showing details of auto-role assignment for role with ID ${tokenRoleId} from your server. Please contact your bot admin via https://www.hazelnet.io.` });
    }
  },
};
