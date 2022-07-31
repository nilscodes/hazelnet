const i18n = require('i18n');
const embedBuilder = require('../../utility/embedbuilder');
const whitelistUtil = require('../../utility/whitelist');

module.exports = {
  async execute(interaction) {
    const whitelistName = interaction.options.getString('whitelist-name');
    const whitelistDisplayName = interaction.options.getString('whitelist-displayname');
    const whitelistType = interaction.options.getString('type');
    const requiredRole = interaction.options.getRole('required-role');
    const maxUsers = interaction.options.getInteger('max-users');
    const signupAfter = interaction.options.getString('signup-start');
    const signupUntil = interaction.options.getString('signup-end');
    const launchDate = interaction.options.getString('launch-date');
    const logoUrl = interaction.options.getString('logo-url');

    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      if (discordServer.premium) {
        const whitelistWithNameExists = discordServer.whitelists.some((whitelist) => whitelist.name === whitelistName);
        if (!whitelistWithNameExists) {
          if (whitelistUtil.isValidName(whitelistName)) {
            const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);

            const errorEmbed = whitelistUtil.getWhitelistErrorEmbed(discordServer, '/configure-whitelist add', 'configure-whitelist-add', signupAfter, signupUntil, launchDate, logoUrl);
            if (errorEmbed) {
              await interaction.editReply({ embeds: [errorEmbed], ephemeral: true });
              return;
            }

            const newWhitelistPromise = await interaction.client.services.discordserver.createWhitelist(
              interaction.guild.id,
              externalAccount.id,
              whitelistName,
              whitelistDisplayName,
              whitelistType,
              signupAfter,
              signupUntil,
              maxUsers,
              requiredRole.id,
              launchDate,
              logoUrl,
            );
            const whitelist = newWhitelistPromise.data;

            const detailsPhrase = whitelistUtil.getDetailsText(discordServer, whitelist);
            const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist add', i18n.__({ phrase: 'configure.whitelist.add.success', locale }), 'configure-whitelist-add', [
              {
                name: i18n.__({ phrase: 'configure.whitelist.list.adminName', locale }, { whitelist }),
                value: detailsPhrase,
              },
            ], whitelist.logoUrl);
            await interaction.editReply({ embeds: [embed], ephemeral: true });
          } else {
            const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist add', i18n.__({ phrase: 'configure.whitelist.add.invalidName', locale }, { whitelistName }), 'configure-whitelist-add');
            await interaction.editReply({ embeds: [embed], ephemeral: true });
          }
        } else {
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist add', i18n.__({ phrase: 'configure.whitelist.add.alreadyExists', locale }, { whitelistName }), 'configure-whitelist-add');
          await interaction.editReply({ embeds: [embed], ephemeral: true });
        }
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist add', i18n.__({ phrase: 'configure.whitelist.add.noPremium', locale }), 'configure-whitelist-add');
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while adding whitelist to your server. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
};
