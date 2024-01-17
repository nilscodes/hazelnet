import { APIEmbedField, EmbedAuthorOptions, EmbedBuilder, EmbedFooterOptions, HexColorString } from 'discord.js';
import i18n from 'i18n';
import { DiscordServer, ExternalAccount } from '@vibrantnet/core';

export default {
  buildForUserWithAd(externalAccount: ExternalAccount, discordServer: DiscordServer, title: string, message: string, commandId: string, fields?: APIEmbedField[], image?: string) {
    return this.buildForUser(discordServer, title, message, commandId, fields, image, !externalAccount.premium);
  },
  buildForUser(discordServer: DiscordServer, title: string, message: string, commandId?: string, fields?: APIEmbedField[], image?: string | null, allowAdvertisement?: boolean) {
    const color = (discordServer.settings?.THEME_COLOR_USER as HexColorString) ?? '#fece07';
    const topLogo = discordServer.settings?.THEME_TOP_LOGO ?? discordServer.getBasicEditionThumbnail();
    const { useImage, useFields } = this.augmentWithAdvertisement(image, fields, discordServer, allowAdvertisement);
    return this.build(discordServer, color, topLogo, title, message, commandId, useFields, useImage);
  },
  buildForAdmin(discordServer: DiscordServer, title: string, message: string, commandId?: string, fields?: APIEmbedField[], image?: string | null) {
    return this.build(discordServer, '#ee3323', 'https://info.hazelpool.com/vibrant-admin.png', title, message, commandId, fields, image);
  },
  buildForAudit(discordServer: DiscordServer, title: string, message: string, commandId?: string, fields?: APIEmbedField[]) {
    return this.build(discordServer, '#ee3323', 'https://info.hazelpool.com/vibrant-admin.png', title, message, commandId, fields);
  },
  build(discordServer: DiscordServer, color: HexColorString, thumbnail: string, title: string, message: string, commandId?: string, fields?: APIEmbedField[], image?: string | null) {
    const authorName = discordServer.settings?.THEME_AUTHOR_NAME ?? `VibrantNet.io | ${i18n.__({ phrase: 'generic.clickhelp', locale: discordServer.getBotLanguage() })}`;
    const authorIcon = discordServer.settings?.THEME_AUTHOR_ICON ?? 'https://www.vibrantnet.io/logo192.png';
    let footer;
    if (discordServer.settings?.THEME_FOOTER_TEXT) {
      footer = {
        text: discordServer.settings?.THEME_FOOTER_TEXT,
        iconURL: discordServer.settings?.THEME_FOOTER_ICON,
      };
    }

    return this.buildFullyCustom(color, thumbnail, title, message, fields, {
      name: authorName,
      iconURL: authorIcon,
      url: commandId ? `https://www.vibrantnet.io/documentation/${commandId}` : undefined,
    }, image, footer);
  },
  buildFullyCustom(color: HexColorString, thumbnail: string, title: string, message: string, fields: APIEmbedField[] | undefined, author: EmbedAuthorOptions, image?: string | null, footer?: EmbedFooterOptions) {
    const baseEmbed = new EmbedBuilder()
      .setColor(color)
      .setTitle(title)
      .setAuthor(author)
      .setDescription(message)
      .setThumbnail(thumbnail)
      .setTimestamp();
    if (image) {
      baseEmbed.setImage(image);
    }
    if (footer) {
      baseEmbed.setFooter(footer);
    }
    if (fields) {
      baseEmbed.addFields(fields);
    }
    return baseEmbed;
  },
  augmentWithAdvertisement(image: string | undefined | null, fields: APIEmbedField[] | undefined, discordServer: DiscordServer, allowAdvertisement?: boolean) {
    let useImage = image;
    let useFields = fields;
    if (!discordServer.premium && allowAdvertisement) {
      const advertisement = discordServer.getAdvertisement();
      if (advertisement.text) {
        useFields = useFields ?? [];
        useFields.push({
          name: i18n.__({ phrase: 'generic.advertisement', locale: discordServer.getBotLanguage() }),
          value: advertisement.text,
        });
      }
      if (advertisement.logo && !useImage) {
        useImage = advertisement.logo;
      }
    }
    return {
      useImage,
      useFields,
    };
  },
};
