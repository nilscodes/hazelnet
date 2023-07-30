import axios from 'axios';
import { BaseApi } from './base';
import { Reminder } from '../types/reminder/reminder';
import { ReminderPartial } from '../types/reminder/reminderPartial';

export class RemindersApi extends BaseApi {
  async addReminder(guildId: string, reminderObject: ReminderPartial): Promise<Reminder> {
    const newReminderPromise = await axios.post(`${this.apiUrl}/discord/servers/${guildId}/reminders`, reminderObject);
    return newReminderPromise.data;
  }

  async listReminders(guildId: string): Promise<Reminder[]> {
    const reminders = await axios.get(`${this.apiUrl}/discord/servers/${guildId}/reminders`);
    return reminders.data;
  }

  async getReminder(guildId: string, reminderId: number): Promise<Reminder | null> {
    try {
      const reminder = await axios.get(`${this.apiUrl}/discord/servers/${guildId}/reminders/${reminderId}`);
      return reminder.data;
    } catch (error) {
      return null;
    }
  }

  async deleteReminder(guildId: string, reminderId: number) {
    await axios.delete(`${this.apiUrl}/discord/servers/${guildId}/reminders/${reminderId}`);
  }
}
