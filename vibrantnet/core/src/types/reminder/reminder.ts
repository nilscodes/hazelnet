import { ReminderType } from './reminderType';

export type Reminder = {
  id: number
  creator: string
  createTime: string
  type: ReminderType
  secondsOffset: number
  reminderChannel: string
  title: string
  reminderText: string
  lastEpochSent?: number
  lastTimeSent?: string
};
