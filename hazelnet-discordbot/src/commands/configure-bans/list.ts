import i18n from 'i18n';
import { ActionRowBuilder, MessageActionRowComponentBuilder, SelectMenuBuilder } from 'discord.js';
import { Ban, cardanoaddress } from '@vibrantnet/core';
import { BotSubcommand } from '../../utility/commandtypes';
import embedBuilder from '../../utility/embedbuilder';
import banutils from '../../utility/bans';

interface ConfigureBansListCommand extends BotSubcommand {
  createDetailsDropdown(tokenRoles: Ban[], locale: string): ActionRowBuilder<MessageActionRowComponentBuilder>[]
}

export default <ConfigureBansListCommand> {
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const bans = await interaction.client.services.discordbans.listBans(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      const banFields = bans.map((ban) => ({
        name: i18n.__({ phrase: `configure.bans.list.banEntryTitle_${ban.type}`, locale }, { banId: `${ban.id}` }),
        value: i18n.__({ phrase: `configure.bans.list.banEntry_${ban.type}_${ban.responseType}`, locale }, { pattern: cardanoaddress.shorten(ban.pattern) }),
      }));
      const CHUNK_SIZE = 15;
      if (!banFields.length) {
        banFields.push({ name: i18n.__({ phrase: 'configure.bans.list.noBansName', locale }), value: i18n.__({ phrase: 'configure.bans.list.noBans', locale }) });
      }
      const firstFields = banFields.splice(0, CHUNK_SIZE);
      const components = this.createDetailsDropdown(bans.splice(0, CHUNK_SIZE), discordServer.getBotLanguage());
      let embed = embedBuilder.buildForAdmin(discordServer, '/configure-bans list', i18n.__({ phrase: 'configure.bans.list.purpose', locale }), 'configure-bans-list', firstFields);
      await interaction.editReply({ embeds: [embed], components });
      while (banFields.length) {
        const additionalBans = banFields.splice(0, CHUNK_SIZE);
        this.createDetailsDropdown(bans.splice(0, CHUNK_SIZE), discordServer.getBotLanguage());
        embed = embedBuilder.buildForAdmin(discordServer, '/configure-bans list', i18n.__({ phrase: 'configure.bans.list.purposeContinued', locale }), 'configure-bans-list', additionalBans);
        // eslint-disable-next-line no-await-in-loop
        await interaction.followUp({ embeds: [embed], components, ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting ban list. Please contact your bot admin via https://www.vibrantnet.io.' });
    }
  },
  createDetailsDropdown(bans, locale) {
    if (bans.length > 0) {
      return [new ActionRowBuilder<MessageActionRowComponentBuilder>()
        .addComponents(
          new SelectMenuBuilder()
            .setCustomId('configure-bans/list/details')
            .setPlaceholder(i18n.__({ phrase: 'configure.bans.list.chooseDetails', locale }))
            .addOptions(bans.map((ban) => ({
              label: i18n.__({ phrase: 'configure.bans.list.chooseText', locale }, { banId: `${ban.id}` }),
              value: `ban-id-${ban.id}`,
            }))),
        ),
      ];
    }
    return undefined;
  },
  async executeSelectMenu(interaction) {
    try {
      await interaction.deferUpdate();
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      const banId = +interaction.values[0].replace('ban-id-', '');
      const banToShow = await interaction.client.services.discordbans.getBan(interaction.guild!.id, banId);
      if (banToShow) {
        const bannedBy = await interaction.client.services.externalaccounts.getExternalDiscordAccountFromExternalAccountId(banToShow.creator);
        const banFields = banutils.getBanDetailsFields(banToShow, bannedBy, locale);
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-bans list', i18n.__({ phrase: 'configure.bans.list.detailsPurpose', locale }), 'configure-bans-list', banFields);
        await interaction.followUp({ embeds: [embed], ephemeral: true });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-bans list', i18n.__({ phrase: 'configure.bans.list.errorNotFound', locale }, { banId: `${banId}` }), 'configure-bans-list');
        await interaction.followUp({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ components: [] });
      await interaction.followUp({ content: 'Error while showing ban details. Please contact your bot admin via https://www.vibrantnet.io.', ephemeral: true });
    }
  },
};
