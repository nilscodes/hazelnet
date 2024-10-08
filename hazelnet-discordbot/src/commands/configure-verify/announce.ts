import NodeCache from 'node-cache';
import i18n from 'i18n';
import {
  ChannelType,
  GuildChannel,
  GuildTextBasedChannel,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageActionRowComponentBuilder,
} from 'discord.js';
import { BotSubcommand } from '../../utility/commandtypes';
import embedBuilder from '../../utility/embedbuilder';
import discordpermissions from '../../utility/discordpermissions';

interface VerifyAnnounceCommand extends BotSubcommand {
  cache: NodeCache
  getVerifyComponents(locale: string): ActionRowBuilder<MessageActionRowComponentBuilder>[]
}

export default <VerifyAnnounceCommand> {
  cache: new NodeCache({ stdTTL: 900 }),
  async execute(interaction) {
    const announceChannel = interaction.options.getChannel('channel', true);
    const welcomeText = interaction.options.getString('welcome-text');
    const logoUrl = interaction.options.getString('logo-url');
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      if (announceChannel
        && (announceChannel.type === ChannelType.GuildText || announceChannel.type === ChannelType.GuildAnnouncement)) {
        const guildChannel = announceChannel as GuildChannel;
        const announceChannelPermissions = guildChannel.permissionsFor(interaction.client.application!.id);
        if (discordpermissions.hasBasicEmbedSendPermissions(announceChannelPermissions)) {
          const welcomeTextToUse = welcomeText?.substring(0, 1000) ?? i18n.__({ phrase: 'configure.verify.announce.publicSuccess', locale });
          this.cache.set(`${interaction.guild!.id}-${interaction.user.id}`, {
            announceChannelId: announceChannel.id,
            welcomeText: welcomeTextToUse,
            logoUrl,
          });

          const components = [
            new ActionRowBuilder<MessageActionRowComponentBuilder>()
              .addComponents(
                new ButtonBuilder()
                  .setCustomId('configure-verify/announce/confirm')
                  .setLabel(i18n.__({ phrase: 'configure.verify.announce.publish', locale }))
                  .setStyle(ButtonStyle.Primary),
              ),
          ];

          const welcomeFields = [{
            name: i18n.__({ phrase: 'configure.verify.announce.publicSuccessTitle', locale }),
            value: welcomeTextToUse,
          }];

          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-verify announce', i18n.__({ phrase: 'configure.verify.announce.purpose', locale }, { channel: announceChannel.id }), 'configure-verify-announce', welcomeFields, logoUrl);
          await interaction.editReply({ components, embeds: [embed] });
        } else {
          const embedAdmin = embedBuilder.buildForAdmin(discordServer, '/configure-verify announce', i18n.__({ phrase: 'configure.verify.announce.errorNoSendPermissions', locale }, { channel: announceChannel.id }), 'configure-verify-announce');
          await interaction.editReply({ embeds: [embedAdmin], components: [] });
        }
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-verify announce', i18n.__({ phrase: 'configure.verify.announce.errorWrongChannelType', locale }), 'configure-verify-announce');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting verify widget announcement ready. Please contact your bot admin via https://www.vibrantnet.io.' });
    }
  },
  async executeButton(interaction) {
    if (interaction.customId === 'configure-verify/announce/confirm') {
      await interaction.deferUpdate();
      const guild = interaction.guild!;
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(guild.id);
      const locale = discordServer.getBotLanguage();
      const { announceChannelId, welcomeText, logoUrl } = this.cache.take(`${guild.id}-${interaction.user.id}`) as any;
      const announceChannel = await guild.channels.fetch(announceChannelId) as GuildTextBasedChannel;
      if (announceChannel) {
        const components = this.getVerifyComponents(locale);
        const embedPublic = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'configure.verify.announce.publicSuccessTitle', locale }), welcomeText, 'verify', [], logoUrl);
        await announceChannel.send({ embeds: [embedPublic], components });
        const embedAdmin = embedBuilder.buildForAdmin(discordServer, '/configure-verify announce', i18n.__({ phrase: 'configure.verify.announce.success', locale }, { channel: announceChannelId }), 'configure-verify-announce');
        await interaction.editReply({ embeds: [embedAdmin], components: [] });
      }
    }
  },
  getVerifyComponents(locale) {
    return [
      new ActionRowBuilder<MessageActionRowComponentBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('verify/add/widgetverify')
            .setLabel(i18n.__({ phrase: 'verify.add.verifyButton', locale }))
            .setStyle(ButtonStyle.Primary),
        ),
    ];
  },
};
