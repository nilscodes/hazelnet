import i18n from 'i18n';
import { ActionRowBuilder, MessageActionRowComponentBuilder, StringSelectMenuBuilder } from 'discord.js';
import { Reminder } from '@vibrantnet/core';
import { BotSubcommand } from '../../utility/commandtypes';
import embedBuilder from '../../utility/embedbuilder';
import reminderUtil from '../../utility/reminders';

interface ConfigureRemindersRemoveCommand extends BotSubcommand {
  createDetailsDropdown(tokenRoles: Reminder[], locale: string): ActionRowBuilder<MessageActionRowComponentBuilder>[]
}

export default <ConfigureRemindersRemoveCommand> {
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const reminders = await interaction.client.services.reminders.listReminders(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      const reminderFields = reminders.map((reminder) => {
        const offset = reminderUtil.formatDuration(reminder.secondsOffset);
        return {
          name: i18n.__({ phrase: 'configure.social.epochreminder.list.reminderSelection', locale }, { reminderTitle: reminder.title, reminderId: `${reminder.id}` }),
          value: i18n.__({ phrase: `configure.social.epochreminder.add.reminderType_${reminder.type}`, locale }, { offset, channel: reminder.reminderChannel }),
        };
      });
      const CHUNK_SIZE = 15;
      if (!reminderFields.length) {
        reminderFields.push({ name: i18n.__({ phrase: 'configure.social.epochreminder.list.noRemindersName', locale }), value: i18n.__({ phrase: 'configure.social.epochreminder.list.noReminders', locale }) });
      }
      const firstFields = reminderFields.splice(0, CHUNK_SIZE);
      const components = this.createDetailsDropdown(reminders.splice(0, CHUNK_SIZE), discordServer.getBotLanguage());
      let embed = embedBuilder.buildForAdmin(discordServer, '/configure-social epochreminder remove', i18n.__({ phrase: 'configure.social.epochreminder.remove.purpose', locale }), 'configure-social-epochreminder-remove', firstFields);
      await interaction.editReply({ embeds: [embed], components });
      while (reminderFields.length) {
        const additionalReminders = reminderFields.splice(0, CHUNK_SIZE);
        this.createDetailsDropdown(reminders.splice(0, CHUNK_SIZE), discordServer.getBotLanguage());
        embed = embedBuilder.buildForAdmin(discordServer, '/configure-social epochreminder remove', i18n.__({ phrase: 'configure.social.epochreminder.remove.purposeContinued', locale }), 'configure-social-epochreminder-remove', additionalReminders);
        // eslint-disable-next-line no-await-in-loop
        await interaction.followUp({ embeds: [embed], components, ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while removing reminder from your server. Please contact your bot admin via https://www.vibrantnet.io.' });
    }
  },
  createDetailsDropdown(reminders, locale) {
    if (reminders.length > 0) {
      return [new ActionRowBuilder<MessageActionRowComponentBuilder>()
        .addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('configure-social/epochreminder-remove/details')
            .setPlaceholder(i18n.__({ phrase: 'configure.social.epochreminder.remove.chooseDetails', locale }))
            .addOptions(reminders.map((reminder) => ({
              label: i18n.__({ phrase: 'configure.social.epochreminder.list.reminderSelection', locale }, { reminderTitle: reminder.title.substring(0, 32), reminderId: `${reminder.id}` }),
              value: `reminder-id-${reminder.id}`,
            }))),
        ),
      ];
    }
    return undefined;
  },
  async executeSelectMenu(interaction) {
    try {
      await interaction.deferUpdate();
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      const reminderId = +interaction.values[0].replace('reminder-id-', '');
      const reminderToRemove = await interaction.client.services.reminders.getReminder(interaction.guild!.id, reminderId);
      if (reminderToRemove) {
        await interaction.client.services.reminders.deleteReminder(interaction.guild!.id, reminderToRemove.id);
        const reminderFields = reminderUtil.getReminderDetailsFields(reminderToRemove, locale);
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-social epochreminder remove', i18n.__({ phrase: 'configure.social.epochreminder.remove.success', locale }), 'configure-social-epochreminder-remove', reminderFields);
        await interaction.editReply({ embeds: [embed] });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-social epochreminder remove', i18n.__({ phrase: 'configure.social.epochreminder.remove.errorNotFound', locale }, { reminderId: `${reminderId}` }), 'configure-social-epochreminder-remove');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ components: [] });
      await interaction.followUp({ content: 'Error while removing reminder. Please contact your bot admin via https://www.vibrantnet.io.', ephemeral: true });
    }
  },
};
