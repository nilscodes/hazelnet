import { ActionRowBuilder, ButtonBuilder, GuildMember, MessageActionRowComponentBuilder, SelectMenuBuilder, ButtonStyle, APIEmbedField, Guild, DiscordAPIError } from "discord.js"
import { DiscordRequiredRole } from "./polltypes"
import i18n from 'i18n';
import HazelnetClient from "./hazelnetclient";
import { DiscordServer } from "./sharedtypes";

export type Giveaway = {
  name: string
  displayName: string,
  id: number
  description: string,
  requiredRoles: DiscordRequiredRole[]
  createTime: string
  openAfter: string
  openUntil: string
  snapshotTime?: string
  weighted?: boolean
  uniqueWinners?: boolean
  channelId?: string
  messageId?: string
  snapshotIds: number[]
  creator: number
  winnerCount: number
  drawType: GiveawayDrawType
  archived: boolean
  logoUrl?: string
}

export type ParticipationData = {
  participants: number
  totalEntries: number
}

export type WinnerList = {
  winners: string[]
  winnerCount: number
  winnerType: GiveawayDrawType
}

export enum GiveawayDrawType {
  DISCORD_ID = 'DISCORD_ID',
  CARDANO_ADDRESS = 'CARDANO_ADDRESS',
}

export interface GiveawayPartial extends Omit<Giveaway, 'description'> {
  description?: string
  tokenType?: string
  assetFingerprint?: string
  policyId?: string
  snapshotId?: number
}

export type TokenMetadata = {
  subject: string,
  policy: string,
  name?: object,
  description?: object,
  url?: object,
  ticker?: TickerTokenMetadata,
  decimals?: DecimalsTokenMetadata,
  logo?: object,
}

type TickerTokenMetadata = {
  value?: string
}

type DecimalsTokenMetadata = {
  value?: number
}

export default {
  isValidName(giveawayName: string) {
    const giveawayNameRegex = /^[A-Za-z][-A-Za-z0-9]{0,29}$/;
    return giveawayNameRegex.test(giveawayName);
  },
  hasGiveawayEnded(giveaway: Giveaway) {
    if (giveaway.openUntil) {
      return new Date(giveaway.openUntil) < new Date();
    }
    return false;
  },
  hasGiveawayStarted(giveaway: Giveaway) {
    if (giveaway.openAfter) {
      return new Date(giveaway.openAfter) < new Date();
    }
    return true;
  },
  isGiveawayArchived(giveaway: Giveaway) {
    return !!giveaway.archived;
  },
  userCanSeeGiveaway(member: GuildMember, giveaway: Giveaway) {
    if (!this.isGiveawayArchived(giveaway)) {
      if (giveaway.requiredRoles?.length) {
        const needsAnyOfRoleIds = giveaway.requiredRoles.map((role) => role.roleId);
        return needsAnyOfRoleIds.length === 0 || member.roles.cache.some((role) => needsAnyOfRoleIds.includes(role.id));
      }
      return true;
    }
    return false;
  },
  userCanParticipateInGiveaway(member: GuildMember, giveaway: Giveaway, votingWeight: number) {
    if (!this.isGiveawayArchived(giveaway) && !this.hasGiveawayEnded(giveaway) && this.hasGiveawayStarted(giveaway) && votingWeight > 0) {
      const needsAnyOfRoleIds = giveaway.requiredRoles.map((role) => role.roleId);
      return needsAnyOfRoleIds.length === 0 || member.roles.cache.some((role) => needsAnyOfRoleIds.includes(role.id));
    }
    return false;
  },
  getDiscordGiveawayListParts(discordServer: DiscordServer, giveaways: Giveaway[], customId: string, selectionPhrase: string) {
    const locale = discordServer.getBotLanguage();
    const sortedGiveaways = giveaways.sort((giveawayA, giveawayB) => giveawayA.displayName.localeCompare(giveawayB.displayName));

    const giveawayFields = sortedGiveaways.map((giveaway) => {
      const openTime = this.getTimePhrase(giveaway.openAfter, 'configure.giveaway.list.giveawayInfoOpen', locale);
      const closeTime = this.getTimePhrase(giveaway.openUntil, 'configure.giveaway.list.giveawayInfoClose', locale);
      const snapshotTime = this.getTimePhrase(giveaway.snapshotTime, 'configure.giveaway.list.giveawayInfoSnapshot', locale);
      return {
        name: i18n.__({ phrase: 'configure.giveaway.list.adminName', locale }, { giveaway } as any),
        value: i18n.__({ phrase: 'configure.giveaway.list.giveawayInfo', locale }, { winnerCount: `${giveaway.winnerCount}` }) + openTime + closeTime + snapshotTime,
      };
    });
    if (!giveawayFields.length) {
      giveawayFields.push({ name: i18n.__({ phrase: 'configure.giveaway.list.noGiveawaysTitle', locale }), value: i18n.__({ phrase: 'configure.giveaway.list.noGiveaways', locale }) });
    }
    if (!discordServer.premium && sortedGiveaways.length) {
      giveawayFields.unshift({
        name: i18n.__({ phrase: 'generic.blackEditionWarning', locale }),
        value: i18n.__({ phrase: 'configure.giveaway.list.noPremium', locale }),
      });
    }
    const components = this.getGiveawayChoices(locale, sortedGiveaways, customId, selectionPhrase);
    return { giveawayFields, components };
  },
  getTimePhrase(timeObject: string | undefined, phrase: string, locale: string) {
    return timeObject ? i18n.__({ phrase, locale }, {
      timestamp: `${Math.floor(new Date(timeObject).getTime() / 1000)}`,
    }) : '';
  },
  getGiveawayChoices(locale: string, giveaways: Giveaway[], customId: string, selectionPhrase: string) {
    if (giveaways.length) {
      return [new ActionRowBuilder<MessageActionRowComponentBuilder>()
        .addComponents(
          new SelectMenuBuilder()
            .setCustomId(customId)
            .setPlaceholder(i18n.__({ phrase: selectionPhrase, locale }))
            .addOptions(giveaways.map((giveaway) => ({
              label: i18n.__({ phrase: 'configure.giveaway.list.adminName', locale }, { giveaway } as any),
              description: (giveaway.description.trim().length ? (giveaway.description.substring(0, 90) + (giveaway.description.length > 90 ? '...' : '')) : i18n.__({ phrase: 'configure.giveaway.list.detailsDescriptionEmpty', locale })),
              value: `configure-giveaway-${giveaway.id}`,
            }))),
        ),
      ];
    }
    return [];
  },
  getGiveawayDetails(locale: string, giveaway: Giveaway) {
    const detailFields = [
      {
        name: i18n.__({ phrase: 'configure.giveaway.list.detailsName', locale }),
        value: i18n.__({ phrase: 'configure.giveaway.list.adminName', locale }, { giveaway } as any),
      },
      {
        name: i18n.__({ phrase: 'configure.giveaway.list.detailsDescription', locale }),
        value: giveaway.description.trim().length ? giveaway.description.trim() : i18n.__({ phrase: 'configure.giveaway.list.detailsDescriptionEmpty', locale }),
      },
      {
        name: i18n.__({ phrase: 'configure.giveaway.list.winnerCountDescription', locale }),
        value: i18n.__({ phrase: 'configure.giveaway.list.winnerCount', locale }, giveaway as any),
      },
      {
        name: i18n.__({ phrase: 'configure.giveaway.list.drawTypeDescription', locale }),
        value: i18n.__({ phrase: `configure.giveaway.list.drawType${giveaway.drawType}`, locale }),
      },
      {
        name: i18n.__({ phrase: 'configure.giveaway.list.detailsCreation', locale }),
        value: i18n.__({ phrase: 'configure.giveaway.list.creationDate', locale }, { createTime: `${Math.floor(new Date(giveaway.createTime).getTime() / 1000)}` }),
      },
    ];

    this.augmentGiveawayDates(giveaway, detailFields, locale);
    this.augmentGiveawayOptions(giveaway, detailFields, locale);
    detailFields.push({
        name: i18n.__({ phrase: 'configure.giveaway.list.detailsChannel', locale }),
        value: giveaway.channelId ? i18n.__({ phrase: 'configure.giveaway.list.announcementChannel', locale }, { giveaway } as any) : i18n.__({ phrase: 'configure.giveaway.list.announcementNone', locale }),
      },
    );
    this.augmentRequiredRoles(giveaway, detailFields, locale);
    return detailFields;
  },
  augmentGiveawayDates(giveaway: Giveaway, detailFields: APIEmbedField[], locale: string) {
    const openTime = this.getTimePhrase(giveaway.openAfter, 'configure.giveaway.list.giveawayInfoOpen', locale);
    const closeTime = this.getTimePhrase(giveaway.openUntil, 'configure.giveaway.list.giveawayInfoClose', locale);
    const snapshotTime = this.getTimePhrase(giveaway.snapshotTime, 'configure.giveaway.list.giveawayInfoSnapshot', locale);
    if (openTime !== '' || closeTime !== '' || snapshotTime !== '') {
      detailFields.push({
        name: i18n.__({ phrase: 'configure.giveaway.list.detailsDates', locale }),
        value: openTime + closeTime + snapshotTime,
      });
    }
  },
  augmentGiveawayOptions(giveaway: Giveaway, detailFields: APIEmbedField[], locale: string) {
    detailFields.push(
      {
        name: i18n.__({ phrase: 'configure.giveaway.list.detailsConfiguration', locale }),
        value: i18n.__({ phrase: 'configure.giveaway.list.optionList', locale }, {
          uniqueWinners: giveaway.uniqueWinners ? i18n.__({ phrase: 'generic.yes', locale }) : i18n.__({ phrase: 'generic.no', locale }),
          tokenBased: giveaway.snapshotIds.length ? i18n.__({ phrase: 'generic.yes', locale }) : i18n.__({ phrase: 'generic.no', locale }),
          weighted: giveaway.weighted ? i18n.__({ phrase: 'generic.yes', locale }) : i18n.__({ phrase: 'generic.no', locale }),
        }),
      });
  },
  augmentRequiredRoles(giveaway: Giveaway, detailFields: APIEmbedField[], locale: string) {
    if (giveaway.requiredRoles?.length) {
      detailFields.push({
        name: i18n.__({ phrase: 'configure.giveaway.list.detailsRoles', locale }),
        value: giveaway.requiredRoles.map((role) => (i18n.__({ phrase: 'configure.giveaway.list.requiredRoleEntry', locale }, { role } as any))).join('\n'),
      });
    }
  },
  augmentCurrentParticipation(giveaway: Giveaway, detailFields: APIEmbedField[], discordServer: any, participation: ParticipationData, tokenMetadata: TokenMetadata) {
    detailFields.push({
      name: i18n.__({ phrase: 'join.currentParticipants', locale: discordServer.getBotLanguage() }),
      value: this.getCurrentParticipation(discordServer, giveaway, participation, tokenMetadata),
    });
  },
  getCurrentParticipation(discordServer: any, giveaway: Giveaway, participation: ParticipationData, tokenMetadata: TokenMetadata) {
    const locale = discordServer.getBotLanguage();
    const decimals = (giveaway.weighted && tokenMetadata?.decimals?.value) || 0;
    const formattedEntries = discordServer.formatNumber(this.calculateParticipationCountNumber(participation.totalEntries, decimals));
    if (giveaway.weighted) {
      return i18n.__({ phrase: 'configure.giveaway.list.participationWeighted', locale }, { entrants: `${participation.participants}`, entries: formattedEntries });
    } else {
      return i18n.__({ phrase: 'configure.giveaway.list.participation', locale }, { entries: formattedEntries });
    }
  },
  calculateParticipationCountNumber(votingPower: number, decimals: number) {
    return Math.floor(votingPower / (10 ** decimals));
  },
  getGiveawayAnnouncementParts(discordServer: any, giveaway: Giveaway, participation: ParticipationData, tokenMetadata: TokenMetadata) {
    const locale = discordServer.getBotLanguage();
    const detailFields = [
      {
        name: i18n.__({ phrase: 'configure.giveaway.list.detailsDescription', locale }),
        value: giveaway.description.trim().length ? giveaway.description.trim() : i18n.__({ phrase: 'configure.giveaway.list.detailsDescriptionEmpty', locale }),
      },
    ];

    this.augmentCurrentParticipation(giveaway, detailFields, discordServer, participation, tokenMetadata);

    const openTime = this.getTimePhrase(giveaway.openAfter, 'configure.giveaway.list.giveawayInfoOpen', locale);
    const closeTime = this.getTimePhrase(giveaway.openUntil, 'configure.giveaway.list.giveawayInfoClose', locale);
    const snapshotTime = this.getTimePhrase(giveaway.snapshotTime, 'configure.giveaway.list.giveawayInfoSnapshot', locale);
    if (openTime !== '' || closeTime !== '' || snapshotTime !== '') {
      detailFields.push({
        name: i18n.__({ phrase: 'configure.giveaway.list.detailsDates', locale }),
        value: openTime + closeTime + snapshotTime,
      });
    }

    const components = [];
    if (!this.hasGiveawayEnded(giveaway)) {
      const buttons = [new ButtonBuilder()
        .setCustomId(`join/widgetjoin/${giveaway.id}`)
        .setLabel(i18n.__({ phrase: 'join.joinButton', locale }))
        .setStyle(ButtonStyle.Primary)
      ];

      if (giveaway.snapshotIds.length) {
        buttons.push(new ButtonBuilder()
          .setCustomId('verify/add/widgetverify')
          .setLabel(i18n.__({ phrase: 'verify.add.verifyButton', locale }))
          .setStyle(ButtonStyle.Secondary));
      }
      components.push(new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(buttons));
    }
    return { detailFields, components };
  },
  async getTokenMetadataFromRegistry(guildId: string, giveaway: Giveaway, client: HazelnetClient) {
    if (giveaway.snapshotIds.length === 1) {
      return client.services.discordserver.getGiveawayTokenMetadata(guildId, giveaway.id);
    }
    return null;
  },
  async getWinnerInfo(giveaway: Giveaway, locale: string, winnerList: WinnerList, guild: Guild) {
    let winnerText = '';
    if (giveaway.drawType === GiveawayDrawType.DISCORD_ID) {
      const winnerTextList = [];
      for (let i = 0, len = winnerList.winners.length; i < len; i += 1) {
        try {
          const member = await guild.members.fetch(winnerList.winners[i]);
          winnerTextList.push(i18n.__({ phrase: 'configure.giveaway.end.winnerDrawDiscordId', locale}, { place: `${i + 1}`, userId: member.user.id }));
        } catch (e) {
          if ((e as DiscordAPIError).code === 10013) {
            winnerTextList.push(i18n.__({ phrase: 'configure.giveaway.end.winnerDrawError', locale}, { place: `${i + 1}` }));
          }
        }
      }
      winnerText = winnerTextList.join('\n');
    } else if(giveaway.drawType === GiveawayDrawType.CARDANO_ADDRESS) {
      winnerText = winnerList.winners.map((winnerAddress, idx) => i18n.__({ phrase: 'configure.giveaway.end.winnerDrawCardanoAddress', locale}, { place: `${idx + 1}`, winnerAddress })).join('\n');
    }
    return {
      name: i18n.__({ phrase: 'configure.giveaway.end.winnerList', locale }, giveaway as any),
      value: winnerText,
    }
  }
}