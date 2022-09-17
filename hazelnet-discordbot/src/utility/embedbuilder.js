const i18n = require('i18n');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  buildForUserWithAd(externalAccount, discordServer, title, message, commandId, fields, image) {
    return this.buildForUser(discordServer, title, message, commandId, fields, image, !externalAccount.premium);
  },
  buildForUser(discordServer, title, message, commandId, fields, image, allowAdvertisement) {
    const color = discordServer.settings?.THEME_COLOR_USER ?? '#fece07';
    const topLogo = discordServer.settings?.THEME_TOP_LOGO ?? discordServer.getBasicEditionThumbnail();
    const { useImage, useFields } = this.augmentWithAdvertisement(image, fields, discordServer, allowAdvertisement);
    return this.build(discordServer, color, topLogo, title, message, commandId, useFields, useImage);
  },
  buildForAdmin(discordServer, title, message, commandId, fields, image) {
    return this.build(discordServer, '#ee3323', 'http://info.hazelpool.com/hazelnet-admin.png', title, message, commandId, fields, image);
  },
  buildForAudit(discordServer, title, message, commandId, fields) {
    return this.build(discordServer, '#ee3323', 'http://info.hazelpool.com/hazelnet-admin.png', title, message, commandId, fields);
  },
  build(discordServer, color, thumbnail, title, message, commandId, fields, image) {
    const authorName = discordServer.settings?.THEME_AUTHOR_NAME ?? `HAZELnet.io | ${i18n.__({ phrase: 'generic.clickhelp', locale: discordServer.getBotLanguage() })}`;
    const authorIcon = discordServer.settings?.THEME_AUTHOR_ICON ?? 'https://www.hazelnet.io/logo192.png';
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
      url: commandId ? `https://www.hazelnet.io/documentation/${commandId}` : null,
    }, image, footer);
  },
  buildFullyCustom(color, thumbnail, title, message, fields, author, image, footer) {
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
  augmentWithAdvertisement(image, fields, discordServer, allowAdvertisement) {
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
