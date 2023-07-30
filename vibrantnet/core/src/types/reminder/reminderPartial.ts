import { Reminder } from './reminder';
import { ReminderType } from './reminderType';

export interface ReminderPartial extends Omit<Reminder, 'reminderText' | 'createTime' | 'title' | 'secondsOffset' | 'type'> {
  type?: ReminderType
  secondsOffset?: number
  reminderChannel: string
  title?: string
  reminderText?: string
}
