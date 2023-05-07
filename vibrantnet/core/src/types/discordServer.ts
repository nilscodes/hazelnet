import { Settings } from './settings';

export type DiscordServer = {
  id: number
  guildId: string
  guildName: string
  getBotLanguage(): string
  getBasicEditionThumbnail(): string
  getAdvertisement(): AdvertisementData
  formatNumber(num: number): string
  settings: Settings
  premium: boolean
  active: boolean
};

type AdvertisementData = {
  text: string
  logo: string
};
