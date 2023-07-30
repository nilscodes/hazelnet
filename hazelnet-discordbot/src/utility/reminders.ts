import i18n from 'i18n';
import { APIEmbedField } from 'discord.js';
import { Reminder } from '@vibrantnet/core';

export default {
  getReminderDetailsFields(reminder: Reminder, locale: string): APIEmbedField[] {
    const createTime = Math.floor(new Date(reminder.createTime).getTime() / 1000);
    const offset = this.formatDuration(reminder.secondsOffset);
    const fields = [{
      name: i18n.__({ phrase: 'configure.social.epochreminder.add.reminderType', locale }),
      value: i18n.__({ phrase: `configure.social.epochreminder.add.reminderType_${reminder.type}`, locale }, { offset, channel: reminder.reminderChannel }),
    }, {
      name: i18n.__({ phrase: 'configure.social.epochreminder.add.reminderTitle', locale }),
      value: reminder.title,
    }, {
      name: i18n.__({ phrase: 'configure.social.epochreminder.add.createTimeTitle', locale }),
      value: `<t:${createTime}>`,
    }];
    if (reminder.lastEpochSent && reminder.lastTimeSent) {
      const lastTimeSentTimestamp = `${Math.floor(new Date(reminder.lastTimeSent).getTime() / 1000)}`;
      fields.push({
        name: i18n.__({ phrase: 'configure.social.epochreminder.add.lastTimeSent', locale }),
        value: i18n.__({ phrase: 'configure.social.epochreminder.add.lastTimeSentDetails', locale }, { lastTimeSentTimestamp, lastEpochSent: `${reminder.lastEpochSent}` }),
      });
    }

    return fields;
  },
  formatDuration(seconds: number) {
    if (seconds < 0) {
      throw new Error('Invalid input. Please provide a non-negative number of seconds.');
    }

    const timeUnits = [
      { unit: 'hour', divisor: 3600 },
      { unit: 'minute', divisor: 60 },
      { unit: 'second', divisor: 1 },
    ];

    let result = '';
    let remainingSeconds = seconds;

    for (let i = 0; i < timeUnits.length; i += 1) {
      const { unit, divisor } = timeUnits[i];
      const count = Math.floor(remainingSeconds / divisor);
      remainingSeconds %= divisor;

      if (count > 0) {
        result += `${count} ${unit}${count !== 1 ? 's' : ''}`;
        if (remainingSeconds > 0) {
          result += ' and ';
        }
      }
    }
    return result;
  },
};
