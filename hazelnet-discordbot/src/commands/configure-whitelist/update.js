const i18n = require('i18n');
const embedBuilder = require('../../utility/embedbuilder');
const whitelistUtil = require('../../utility/whitelist');

module.exports = {
  async execute(interaction) {
    const whitelistNameToUpdate = interaction.options.getString('whitelist-name');
    const whitelistDisplayName = interaction.options.getString('whitelist-displayname');
    const maxUsers = interaction.options.getInteger('max-users');
    const signupAfter = interaction.options.getString('signup-start');
    const signupUntil = interaction.options.getString('signup-end');
    const launchDate = interaction.options.getString('launch-date');
    const logoUrl = interaction.options.getString('logo-url');
    const awardedRole = interaction.options.getRole('awarded-role');

    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const whitelists = await interaction.client.services.discordserver.listWhitelists(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      if (discordServer.premium) {
        const whitelistToClose = whitelists.find((whitelist) => whitelist.name === whitelistNameToUpdate);
        if (whitelistToClose) {
          const errorEmbed = whitelistUtil.getWhitelistErrorEmbed(discordServer, '/configure-whitelist update', 'configure-whitelist-update', signupAfter, signupUntil, launchDate, logoUrl);
          if (errorEmbed) {
            await interaction.editReply({ embeds: [errorEmbed], ephemeral: true });
            return;
          }

          const whitelist = await interaction.client.services.discordserver.updateWhitelist(interaction.guild.id, whitelistToClose.id, {
            displayName: whitelistDisplayName,
            signupAfter,
            signupUntil,
            maxUsers,
            launchDate,
            logoUrl,
            awardedRole: awardedRole?.id,
          });

          const detailsPhrase = whitelistUtil.getDetailsText(discordServer, whitelist);
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist update', i18n.__({ phrase: 'configure.whitelist.update.success', locale }, { whitelist }), 'configure-whitelist-update', [
            {
              name: i18n.__({ phrase: 'configure.whitelist.list.adminName', locale }, { whitelist }),
              value: detailsPhrase,
            },
          ], whitelist.logoUrl);
          await interaction.editReply({ embeds: [embed], ephemeral: true });
        } else {
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist update', i18n.__({ phrase: 'configure.whitelist.update.notFound', locale }, { whitelistName: whitelistNameToUpdate }), 'configure-whitelist-update');
          await interaction.editReply({ embeds: [embed], ephemeral: true });
        }
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist update', i18n.__({ phrase: 'configure.whitelist.add.noPremium', locale }), 'configure-whitelist-update');
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while adding whitelist to your server. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
};
