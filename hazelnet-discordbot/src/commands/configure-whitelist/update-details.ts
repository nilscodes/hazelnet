import i18n from 'i18n';
import { BotSubcommand } from '../../utility/commandtypes';
import whitelistUtil from '../../utility/whitelist';
import embedBuilder from '../../utility/embedbuilder';

export default <BotSubcommand> {
  async execute(interaction) {
    const whitelistNameToUpdate = interaction.options.getString('whitelist-name', true);
    const whitelistDisplayName = interaction.options.getString('whitelist-displayname');
    const maxUsers = interaction.options.getInteger('max-users');
    const signupAfter = interaction.options.getString('signup-start');
    const signupUntil = interaction.options.getString('signup-end');
    const launchDate = interaction.options.getString('launch-date');
    const logoUrl = interaction.options.getString('logo-url');
    const awardedRole = interaction.options.getRole('awarded-role');

    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const whitelists = await interaction.client.services.discordserver.listWhitelists(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      if (discordServer.premium) {
        const whitelistToClose = whitelists.find((whitelist) => whitelist.name === whitelistNameToUpdate);
        if (whitelistToClose) {
          const errorEmbed = whitelistUtil.getWhitelistErrorEmbed(discordServer, '/configure-whitelist update details', 'configure-whitelist-update-details', signupAfter, signupUntil, launchDate, logoUrl);
          if (errorEmbed) {
            await interaction.editReply({ embeds: [errorEmbed] });
            return;
          }

          const whitelist = await interaction.client.services.discordserver.updateWhitelist(interaction.guild!.id, whitelistToClose.id, {
            displayName: whitelistDisplayName,
            signupAfter,
            signupUntil,
            maxUsers,
            launchDate,
            logoUrl,
            awardedRole: awardedRole?.id,
          });

          const detailsPhrase = whitelistUtil.getDetailsText(discordServer, whitelist);
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist update details', i18n.__({ phrase: 'configure.whitelist.update.details.success', locale }, { whitelist } as any), 'configure-whitelist-update-details', [
            {
              name: i18n.__({ phrase: 'configure.whitelist.list.adminName', locale }, { whitelist } as any),
              value: detailsPhrase,
            },
          ], whitelist.logoUrl);
          await interaction.editReply({ embeds: [embed] });
        } else {
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist update details', i18n.__({ phrase: 'configure.whitelist.update.details.notFound', locale }, { whitelistName: whitelistNameToUpdate } as any), 'configure-whitelist-update-details');
          await interaction.editReply({ embeds: [embed] });
        }
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist update details', i18n.__({ phrase: 'configure.whitelist.add.noPremium', locale }), 'configure-whitelist-update-details');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while updating whitelist details on your server. Please contact your bot admin via https://www.vibrantnet.io.' });
    }
  },
};
