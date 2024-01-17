import i18n from 'i18n';
import { BotSubcommand } from '../../utility/commandtypes';
import giveawayutil from '../../utility/giveaway';
import embedBuilder from '../../utility/embedbuilder';

export default <BotSubcommand> {
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      const giveaways = await interaction.client.services.discordserver.getGiveaways(interaction.guild!.id);
      const CHUNK_SIZE = 20;
      const firstGiveaways = giveaways.splice(0, CHUNK_SIZE);
      const { giveawayFields, components } = giveawayutil.getDiscordGiveawayListParts(discordServer, firstGiveaways, 'configure-giveaway/list/details', 'configure.giveaway.list.chooseGiveawayDetails');
      let embed = embedBuilder.buildForAdmin(discordServer, '/configure-giveaway list', i18n.__({ phrase: 'configure.giveaway.list.purpose', locale }), 'configure-giveaway-list', giveawayFields);
      await interaction.editReply({ embeds: [embed], components });
      while (giveaways.length) {
        const additionalGiveaways = giveaways.splice(0, CHUNK_SIZE);
        const { giveawayFields: moreGiveawayFields, components: moreComponents } = giveawayutil.getDiscordGiveawayListParts(discordServer, additionalGiveaways, 'configure-giveaway/list/details', 'configure.giveaway.list.chooseGiveawayDetails');
        embed = embedBuilder.buildForAdmin(discordServer, '/configure-giveaway list', i18n.__({ phrase: 'configure.giveaway.list.purposeContinued', locale }), 'configure-giveaway-list', moreGiveawayFields);
        // eslint-disable-next-line no-await-in-loop
        await interaction.followUp({ embeds: [embed], components: moreComponents, ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting giveaway list. Please contact your bot admin via https://www.vibrantnet.io.' });
    }
  },
  async executeSelectMenu(interaction) {
    if (interaction.customId === 'configure-giveaway/list/details') {
      await interaction.deferUpdate();
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      const giveawayId = +interaction.values[0].substring(19);
      const giveaways = await interaction.client.services.discordserver.getGiveaways(interaction.guild!.id);
      const giveaway = giveaways.find((giveawayForDetails) => giveawayForDetails.id === giveawayId);
      if (giveaway) {
        const detailFields = giveawayutil.getGiveawayDetails(locale, giveaway);
        const components = giveawayutil.getGiveawayChoices(locale, giveaways, 'configure-giveaway/list/details', 'configure.giveaway.list.chooseGiveawayDetails');
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-giveaway list', i18n.__({ phrase: 'configure.giveaway.list.details', locale }), 'configure-giveaway-list', detailFields);
        await interaction.editReply({ embeds: [embed], components });
      }
    }
  },
};
