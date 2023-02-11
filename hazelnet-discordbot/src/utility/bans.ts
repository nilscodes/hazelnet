import i18n from 'i18n';
import { APIEmbedField } from "discord.js"
import { ExternalAccount } from "./sharedtypes"

export type Ban = {
  id: number
  creator: string
  createTime?: string
  type: BanType
  responseType: BanResponseType
  pattern: string
  reason: string
  alertChannel?: string
}

export enum BanType {
  STAKE_ADDRESS_BAN = 'STAKE_ADDRESS_BAN',
  ASSET_FINGERPRINT_BAN = 'ASSET_FINGERPRINT_BAN',
  DISCORD_ID_BAN = 'DISCORD_ID_BAN',
  EXACT_NAME_BAN = 'EXACT_NAME_BAN',
  PARTIAL_NAME_BAN = 'PARTIAL_NAME_BAN',
  FUZZY_NAME_BAN = 'FUZZY_NAME_BAN',
}

export enum BanResponseType {
  PREVENT_ROLES = 'PREVENT_ROLES',
  SERVER_BAN = 'SERVER_BAN',
}


export default {
  getBanDetailsFields(ban: Ban, bannedBy: ExternalAccount | null, locale: string): APIEmbedField[] {
    const banTime = Math.floor(new Date(ban.createTime!).getTime() / 1000);
    return [{
      name: i18n.__({ phrase: `configure.bans.list.banEntryTitle_${ban.type}`, locale }, { banId: `${ban.id}` }),
      value: i18n.__({ phrase: `configure.bans.list.banEntry_${ban.type}_${ban.responseType}`, locale }, { pattern: ban.pattern }),
    }, {
      name: i18n.__({ phrase: 'configure.bans.list.banReasonTitle', locale }),
      value: ban.reason.length ? ban.reason : i18n.__({ phrase: 'configure.bans.list.banReasonNoneGiven', locale }),
    }, {
      name: i18n.__({ phrase: 'configure.bans.list.bannedByTitle', locale }),
      value: bannedBy ? `<@${bannedBy.referenceId}>` : i18n.__({ phrase: 'configure.bans.list.bannedByUnknown', locale }),
    }, {
      name: i18n.__({ phrase: 'configure.bans.list.banTimeTitle', locale }),
      value: `<t:${banTime}>`,
    }];
  }
}