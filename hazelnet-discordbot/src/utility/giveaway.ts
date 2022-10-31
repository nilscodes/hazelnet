import { ActionRowBuilder, MessageActionRowComponentBuilder, SelectMenuBuilder } from "discord.js"
import { DiscordRequiredRole } from "./polltypes"
import i18n from 'i18n';

export type Giveaway = {
  name: string
  displayName: string,
  id: number
  description: string,
  requiredRoles: DiscordRequiredRole[]
  createTime: string
  openAfter: string
  openUntil: string
  channelId?: string
  messageId?: string
  snapshotIds: number[]
  creator: number
  winnerCount: number
}

export default {
  getDiscordGiveawayListParts(discordServer: any, giveaways: Giveaway[], customId: string, selectionPhrase: string) {
    const locale = discordServer.getBotLanguage();
    const sortedGiveaways = giveaways.sort((giveawayA, giveawayB) => giveawayA.displayName.localeCompare(giveawayB.displayName));
    const giveawayFields = sortedGiveaways.map((giveaway) => {
      return {
        name: i18n.__({ phrase: 'configure.giveaway.list.adminName', locale }, { giveaway } as any),
        value: i18n.__({ phrase: 'configure.giveaway.list.giveawayInfo', locale }, {
          openAfterTimestamp: Math.floor(new Date(giveaway.openAfter).getTime() / 1000),
          openUntilTimestamp: Math.floor(new Date(giveaway.openUntil).getTime() / 1000),
        } as any),
      };
    });
    if (!giveawayFields.length) {
      giveawayFields.push({ name: i18n.__({ phrase: 'vote.noGiveawaysTitle', locale }), value: i18n.__({ phrase: 'join.noGiveaways', locale }) });
    }
    if (!discordServer.premium && sortedGiveaways.length) {
      giveawayFields.unshift({
        name: i18n.__({ phrase: 'generic.blackEditionWarning', locale }),
        value: i18n.__({ phrase: 'configure.giveaway.list.noPremium', locale }),
      });
    }
    const components = this.getGiveawayChoices(locale, sortedGiveaways, customId, selectionPhrase);
    return { locale, giveawayFields, components };
  },
  getGiveawayChoices(locale: string, giveaways: Giveaway[], customId: string, selectionPhrase: string) {
    if (giveaways.length) {
      return [new ActionRowBuilder()
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
      ] as ActionRowBuilder<MessageActionRowComponentBuilder>[];
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
        name: i18n.__({ phrase: 'configure.giveaway.list.detailsCreation', locale }),
        value: i18n.__({ phrase: 'configure.giveaway.list.creationDate', locale }, { createTime: `${Math.floor(new Date(giveaway.createTime).getTime() / 1000)}` }),
      },
      {
        name: i18n.__({ phrase: 'configure.giveaway.list.detailsDates', locale }),
        value: i18n.__({ phrase: 'configure.giveaway.list.giveawayInfo', locale }, {
          openAfterTimestamp: `${Math.floor(new Date(giveaway.openAfter).getTime() / 1000)}`,
          openUntilTimestamp: `${Math.floor(new Date(giveaway.openUntil).getTime() / 1000)}`,
        }),
      },
      {
        name: i18n.__({ phrase: 'configure.giveaway.list.detailsConfiguration', locale }),
        value: i18n.__({ phrase: 'configure.giveaway.list.optionList', locale }, {
          tokenBased: giveaway.snapshotIds.length ? i18n.__({ phrase: 'generic.yes', locale }) : i18n.__({ phrase: 'generic.no', locale }),
        }),
      },
      {
        name: i18n.__({ phrase: 'configure.giveaway.list.detailsChannel', locale }),
        value: giveaway.channelId ? i18n.__({ phrase: 'configure.giveaway.list.announcementChannel', locale }, { giveaway } as any) : i18n.__({ phrase: 'configure.giveaway.list.announcementNone', locale }),
      },
    ];
    if (giveaway.requiredRoles?.length) {
      detailFields.push({
        name: i18n.__({ phrase: 'configure.giveaway.list.detailsRoles', locale }),
        value: giveaway.requiredRoles.map((role) => (i18n.__({ phrase: 'configure.giveaway.list.requiredRoleEntry', locale }, { role } as any))).join('\n'),
      });
    }
    return detailFields;
  },
}