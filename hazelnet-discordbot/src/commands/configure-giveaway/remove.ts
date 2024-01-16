import { ActionRowBuilder, MessageActionRowComponentBuilder, StringSelectMenuBuilder } from 'discord.js';
import i18n, { Replacements } from 'i18n';
import { Giveaway } from '@vibrantnet/core';
import { BotSubcommand } from '../../utility/commandtypes';
import embedBuilder from '../../utility/embedbuilder';

interface GiveawayRemoveCommand extends BotSubcommand {
  getGiveawayChoices(locale: string, giveaways: Giveaway[]): ActionRowBuilder<MessageActionRowComponentBuilder>[]
}

export default <GiveawayRemoveCommand> {
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      const giveaways = (await interaction.client.services.discordserver.getGiveaways(interaction.guild!.id))
        .sort((giveawayA, giveawayB) => giveawayA.displayName.localeCompare(giveawayB.displayName));
      if (giveaways.length) {
        const CHUNK_SIZE = 20;
        const firstGiveaways = giveaways.splice(0, CHUNK_SIZE);
        const components = this.getGiveawayChoices(locale, firstGiveaways);
        let embed = embedBuilder.buildForAdmin(discordServer, '/configure-giveaway remove', i18n.__({ phrase: 'configure.giveaway.remove.purpose', locale }), 'configure-giveaway-remove');
        await interaction.editReply({ embeds: [embed], components });
        while (giveaways.length) {
          const additionalGiveaways = giveaways.splice(0, CHUNK_SIZE);
          const moreComponents = this.getGiveawayChoices(locale, additionalGiveaways);
          embed = embedBuilder.buildForAdmin(discordServer, '/configure-giveaway remove', i18n.__({ phrase: 'configure.giveaway.remove.purpose', locale }), 'configure-giveaway-remove');
          // eslint-disable-next-line no-await-in-loop
          await interaction.followUp({ embeds: [embed], components: moreComponents, ephemeral: true });
        }
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-giveaway remove', i18n.__({ phrase: 'configure.giveaway.list.noGiveaways', locale }), 'configure-giveaway-remove');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting giveaway list. Please contact your bot admin via https://www.hazelnet.io.' });
    }
  },
  async executeSelectMenu(interaction) {
    if (interaction.customId === 'configure-giveaway/remove/complete') {
      await interaction.deferUpdate();
      const guildId = interaction.guild!.id;
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(guildId);
      const locale = discordServer.getBotLanguage();
      const giveawayId = +interaction.values[0].substring(19);
      const giveaways = await interaction.client.services.discordserver.getGiveaways(guildId);
      const giveaway = giveaways.find((giveawayForDetails) => giveawayForDetails.id === giveawayId);
      if (giveaway) {
        await interaction.client.services.discordserver.deleteGiveaway(guildId, giveaway.id);
        const removedFields = [
          {
            name: i18n.__({ phrase: 'configure.giveaway.list.detailsName', locale }),
            value: i18n.__({ phrase: 'configure.giveaway.list.adminName', locale }, { giveaway } as unknown as Replacements),
          },
          {
            name: i18n.__({ phrase: 'configure.giveaway.list.detailsDescription', locale }),
            value: giveaway.description.trim().length ? giveaway.description.trim() : i18n.__({ phrase: 'configure.giveaway.list.detailsDescriptionEmpty', locale }),
          },
        ];
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-giveaway remove', i18n.__({ phrase: 'configure.giveaway.remove.success', locale }), 'configure-giveaway-remove', removedFields);
        await interaction.editReply({ embeds: [embed], components: [] });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-giveaway remove', i18n.__({ phrase: 'configure.giveaway.remove.errorNotFound', locale }, { giveawayId: `${giveawayId}` }), 'configure-giveaway-remove');
        await interaction.editReply({ embeds: [embed], components: [] });
      }
    }
  },
  getGiveawayChoices(locale, giveaways) {
    return [new ActionRowBuilder()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('configure-giveaway/remove/complete')
          .setPlaceholder(i18n.__({ phrase: 'configure.giveaway.remove.chooseGiveawayDetails', locale }))
          .addOptions(giveaways.map((giveaway) => ({
            label: i18n.__({ phrase: 'configure.giveaway.list.adminName', locale }, { giveaway } as any),
            description: (giveaway.description ? (giveaway.description.substring(0, 90) + (giveaway.description.length > 90 ? '…' : '')) : ''),
            value: `configure-giveaway-${giveaway.id}`,
          }))),
      ),
    ];
  },
};
