import i18n from 'i18n';
import { BotSubcommand } from '../../utility/commandtypes';
import { Whitelist } from '../../utility/sharedtypes';
import whitelistUtil from '../../utility/whitelist';
const embedBuilder = require('../../utility/embedbuilder');

export default <BotSubcommand> {
  async execute(interaction) {
    const whitelistName = interaction.options.getString('whitelist-name', true);
    const whitelistDisplayName = interaction.options.getString('whitelist-displayname', true);
    const whitelistType = interaction.options.getString('type', true);
    const requiredRole = interaction.options.getRole('required-role');
    const awardedRole = interaction.options.getRole('awarded-role');
    const maxUsers = interaction.options.getInteger('max-users');
    const signupAfter = interaction.options.getString('signup-start');
    const signupUntil = interaction.options.getString('signup-end');
    const launchDate = interaction.options.getString('launch-date');
    const logoUrl = interaction.options.getString('logo-url');

    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const whitelists = await interaction.client.services.discordserver.listWhitelists(interaction.guild!.id) as Whitelist[];
      const locale = discordServer.getBotLanguage();
      if (discordServer.premium) {
        const whitelistWithNameExists = whitelists.some((whitelist) => whitelist.name === whitelistName);
        if (!whitelistWithNameExists) {
          if (whitelistUtil.isValidName(whitelistName)) {
            const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);

            const errorEmbed = whitelistUtil.getWhitelistErrorEmbed(discordServer, '/configure-whitelist add', 'configure-whitelist-add', signupAfter, signupUntil, launchDate, logoUrl);
            if (errorEmbed) {
              await interaction.editReply({ embeds: [errorEmbed] });
              return;
            }
            const requiredRoles = [];
            if (requiredRole) {
              requiredRoles.push({ roleId: requiredRole.id });
            }

            const newWhitelistPromise = await interaction.client.services.discordserver.createWhitelist(
              interaction.guild!.id,
              externalAccount.id,
              whitelistName,
              whitelistDisplayName,
              whitelistType,
              signupAfter,
              signupUntil,
              maxUsers,
              requiredRoles,
              awardedRole?.id,
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
            await interaction.editReply({ embeds: [embed] });
          } else {
            const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist add', i18n.__({ phrase: 'configure.whitelist.add.invalidName', locale }, { whitelistName } as any), 'configure-whitelist-add');
            await interaction.editReply({ embeds: [embed] });
          }
        } else {
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist add', i18n.__({ phrase: 'configure.whitelist.add.alreadyExists', locale }, { whitelistName } as any), 'configure-whitelist-add');
          await interaction.editReply({ embeds: [embed] });
        }
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist add', i18n.__({ phrase: 'configure.whitelist.add.noPremium', locale }), 'configure-whitelist-add');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while adding whitelist to your server. Please contact your bot admin via https://www.hazelnet.io.' });
    }
  },
};
