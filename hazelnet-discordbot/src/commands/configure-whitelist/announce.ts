import i18n from 'i18n';
import { BotSubcommand } from '../../utility/commandtypes';
import {
  ChannelType,
  ActionRowBuilder,
  PermissionsBitField,
  GuildTextBasedChannel,
  MessageActionRowComponentBuilder,
  SelectMenuBuilder,
} from 'discord.js';
import { Whitelist } from '../../utility/sharedtypes';
import whitelistUtil from '../../utility/whitelist';
const embedBuilder = require('../../utility/embedbuilder');

export default <BotSubcommand> {
  async execute(interaction) {
    const announceChannel = interaction.options.getChannel('channel', true) as GuildTextBasedChannel;
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const whitelists = await interaction.client.services.discordserver.listWhitelists(interaction.guild!.id) as Whitelist[];
      const locale = discordServer.getBotLanguage();
      if (announceChannel.type === ChannelType.GuildText || announceChannel.type === ChannelType.GuildAnnouncement) {
        const announceChannelPermissions = announceChannel.permissionsFor(interaction.client.application!.id);
        if (announceChannelPermissions && announceChannelPermissions.has(PermissionsBitField.Flags.SendMessages) && announceChannelPermissions.has(PermissionsBitField.Flags.ViewChannel) && announceChannelPermissions.has(PermissionsBitField.Flags.EmbedLinks)) {
          const whitelistOptions = whitelists
            .filter((whitelist) => !whitelist.closed)
            .map((whitelist) => ({ label: whitelist.displayName, value: `${announceChannel.id}-${whitelist.id}` }));
          if (whitelistOptions.length) {
            const components = [new ActionRowBuilder<MessageActionRowComponentBuilder>()
              .addComponents(
                new SelectMenuBuilder()
                  .setCustomId('configure-whitelist/announce/publish')
                  .setPlaceholder(i18n.__({ phrase: 'whitelist.unregister.chooseWhitelist', locale }))
                  .addOptions(whitelistOptions),
              )];

            const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist announce', i18n.__({ phrase: 'configure.whitelist.announce.purpose', locale }), 'configure-whitelist-announce');
            await interaction.editReply({ components, embeds: [embed] });
          } else {
            const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist announce', i18n.__({ phrase: 'configure.whitelist.announce.noWhitelistsDetail', locale }), 'configure-whitelist-announce');
            await interaction.editReply({ embeds: [embed] });
          }
        } else {
          const embedAdmin = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist announce', i18n.__({ phrase: 'configure.whitelist.announce.errorNoSendPermissions', locale }, { channel: announceChannel.id }), 'configure-whitelist-announce');
          await interaction.editReply({ embeds: [embedAdmin], components: [] });
        }
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist announce', i18n.__({ phrase: 'configure.whitelist.announce.errorWrongChannelType', locale }), 'configure-whitelist-announce');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting whitelist list to announce. Please contact your bot admin via https://www.hazelnet.io.' });
    }
  },
  async executeSelectMenu(interaction) {
    if (interaction.customId === 'configure-whitelist/announce/publish') {
      await interaction.deferUpdate();
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const whitelists = await interaction.client.services.discordserver.listWhitelists(interaction.guild!.id) as Whitelist[];
      const locale = discordServer.getBotLanguage();
      const [announceChannelId, whitelistId] = interaction.values[0].split('-');
      const whitelistToAnnounce = whitelists.find((whitelist) => whitelist.id === +whitelistId);
      if (whitelistToAnnounce) {
        const detailsPhrase = whitelistUtil.getDetailsText(discordServer, whitelistToAnnounce, true);
        const detailFields = [
          {
            name: whitelistToAnnounce.displayName,
            value: detailsPhrase,
          },
        ];
        const components = whitelistUtil.getSignupComponents(discordServer, whitelistToAnnounce);
        try {
          const announceChannel = await interaction.guild!.channels.fetch(announceChannelId) as GuildTextBasedChannel;
          const successText = i18n.__({ phrase: `configure.whitelist.announce.${whitelistToAnnounce.type === 'CARDANO_ADDRESS' ? 'publicSuccess' : 'publicSuccessNoAddress'}`, locale });
          const embedPublic = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'configure.whitelist.announce.publicSuccessTitle', locale }), successText, 'whitelist-register', detailFields, whitelistToAnnounce.logoUrl);
          await announceChannel.send({ embeds: [embedPublic], components });
          const embedAdmin = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist announce', i18n.__({ phrase: 'configure.whitelist.announce.success', locale }, { channel: announceChannelId }), 'configure-whitelist-announce');
          await interaction.editReply({ embeds: [embedAdmin], components: [] });
        } catch (sendError) {
          interaction.client.logger.info(sendError);
          const embedAdmin = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist announce', i18n.__({ phrase: 'configure.whitelist.announce.errorNoSendPermissions', locale }, { channel: announceChannelId }), 'configure-whitelist-announce');
          await interaction.editReply({ embeds: [embedAdmin], components: [] });
        }
      }
    }
  },
};
