import { BanResponseType } from './banResponseType';
import { BanType } from './banType';

export type Ban = {
  id: number
  creator: string
  createTime?: string
  type: BanType
  responseType: BanResponseType
  pattern: string
  reason: string
  alertChannel?: string
};
