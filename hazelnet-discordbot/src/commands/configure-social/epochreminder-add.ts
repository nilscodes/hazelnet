import NodeCache from 'node-cache';
import i18n from 'i18n';
import {
  ChannelType,
  GuildChannel,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageActionRowComponentBuilder,
} from 'discord.js';

import { ReminderPartial, ReminderType } from '@vibrantnet/core';
import { BotSubcommand } from '../../utility/commandtypes';
import embedBuilder from '../../utility/embedbuilder';
import discordpermissions from '../../utility/discordpermissions';
import reminders from '../../utility/reminders';

interface EpochreminderAddCommand extends BotSubcommand {
  cache: NodeCache
}

export default <EpochreminderAddCommand> {
  cache: new NodeCache({ stdTTL: 900 }),
  async execute(interaction) {
    const type = interaction.options.getString('type', true) as ReminderType;
    const minutesOffset = interaction.options.getInteger('time-offset', true);
    const reminderChannel = interaction.options.getChannel('channel', true);
    const title = interaction.options.getString('title', true);
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      if (reminderChannel
        && (reminderChannel.type === ChannelType.GuildText || reminderChannel.type === ChannelType.GuildAnnouncement)) {
        const guildChannel = reminderChannel as GuildChannel;
        const reminderChannelPermissions = guildChannel.permissionsFor(interaction.client.application!.id);
        if (reminderChannelPermissions) {
          if (discordpermissions.hasBasicEmbedSendPermissions(reminderChannelPermissions)) {
            const embed = embedBuilder.buildForAdmin(discordServer, '/configure-social epochreminder add', i18n.__({ phrase: 'configure.social.epochreminder.add.purpose', locale }, { channel: reminderChannel.id }), 'configure-social-epochreminder-add');
            await interaction.editReply({ embeds: [embed] });

            const collector = interaction.channel!.createMessageCollector({
              filter: (message) => message.author.id === interaction.user.id,
              time: 5 * 60000,
              dispose: true,
              max: 1,
            });

            collector.on('end', async (collected) => {
              if (collected.size > 0) {
                const reminderText = collected.at(0)!.content;
                this.cache.set(`${interaction.guild!.id}-${interaction.user.id}`, {
                  type,
                  secondsOffset: minutesOffset * 60,
                  title,
                  reminderText,
                  reminderChannel: reminderChannel.id,
                });

                const components = [
                  new ActionRowBuilder()
                    .addComponents(
                      new ButtonBuilder()
                        .setCustomId('configure-social/epochreminder-add/confirm')
                        .setLabel(i18n.__({ phrase: 'configure.social.epochreminder.add.publish', locale }))
                        .setStyle(ButtonStyle.Primary),
                    ),
                ] as ActionRowBuilder<MessageActionRowComponentBuilder>[];

                const userEmbed = embedBuilder.buildForUser(discordServer, title, reminderText);
                await interaction.followUp({ components, embeds: [userEmbed], ephemeral: true });
              }
            });
          } else {
            const embedAdmin = embedBuilder.buildForAdmin(discordServer, '/configure-social epochreminder add', i18n.__({ phrase: 'configure.social.epochreminder.add.errorNoSendPermissions', locale }, { channel: reminderChannel.id }), 'configure-social-epochreminder-add');
            await interaction.editReply({ embeds: [embedAdmin], components: [] });
          }
        }
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-social epochreminder add', i18n.__({ phrase: 'configure.social.epochreminder.add.errorWrongChannelType', locale }), 'configure-social-epochreminder-add');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while adding reminder to your server. Please contact your bot admin via https://www.hazelnet.io.' });
    }
  },
  async executeButton(interaction) {
    if (interaction.customId === 'configure-social/epochreminder-add/confirm') {
      await interaction.deferUpdate();
      const guild = interaction.guild!;
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(guild.id);
      const locale = discordServer.getBotLanguage();
      const reminder = this.cache.take(`${guild.id}-${interaction.user.id}`) as ReminderPartial;
      const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
      reminder.creator = externalAccount.id;
      const newReminder = await interaction.client.services.reminders.addReminder(interaction.guild!.id, reminder);
      const reminderFields = reminders.getReminderDetailsFields(newReminder, locale);
      const embedAdmin = embedBuilder.buildForAdmin(discordServer, '/configure-social epochreminder add', i18n.__({ phrase: 'configure.social.epochreminder.add.success', locale }, { reminder: newReminder } as any), 'configure-social-epochreminder-add', reminderFields);
      await interaction.editReply({ embeds: [embedAdmin], components: [] });
    }
  },
};
