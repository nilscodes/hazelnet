import i18n from 'i18n';
import { BotSubcommand } from '../../utility/commandtypes';
import whitelistUtil from '../../utility/whitelist';
import embedBuilder from '../../utility/embedbuilder';

export default <BotSubcommand> {
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const whitelists = await interaction.client.services.discordserver.listWhitelists(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      const whitelistFields = whitelists.map((whitelist) => {
        const detailsPhrase = whitelistUtil.getDetailsText(discordServer, whitelist);
        return {
          name: i18n.__({ phrase: 'configure.whitelist.list.adminName', locale }, { whitelist } as any),
          value: detailsPhrase,
        };
      });
      if (!whitelistFields.length) {
        whitelistFields.push({
          name: i18n.__({ phrase: 'whitelist.list.noWhitelistsTitle', locale }),
          value: i18n.__({ phrase: 'whitelist.list.noWhitelistsDetail', locale }),
        });
      }
      if (!discordServer.premium && whitelists.length) {
        whitelistFields.unshift({
          name: i18n.__({ phrase: 'generic.blackEditionWarning', locale }),
          value: i18n.__({ phrase: 'configure.whitelist.list.noPremium', locale }),
        });
      }

      const sharedWhitelists = await interaction.client.services.discordserver.getSharedWhitelists(interaction.guild!.id, false);
      if (sharedWhitelists.length) {
        whitelistFields.push({
          name: i18n.__({ phrase: 'configure.whitelist.list.sharedWhitelists', locale }),
          value: `${i18n.__({ phrase: 'configure.whitelist.list.sharedWhitelistsDetail', locale })}\n\n${sharedWhitelists.map((sharedWhitelist) => i18n.__({ phrase: 'configure.whitelist.list.sharedWhitelistsEntry', locale }, sharedWhitelist as any)).join('\n')}`,
        });
      }

      const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist list', i18n.__({ phrase: 'configure.whitelist.list.purpose', locale }), 'configure-whitelist-list', whitelistFields);
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting auto-role-assignment for delegators. Please contact your bot admin via https://www.hazelnet.io.' });
    }
  },
};
