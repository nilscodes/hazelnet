import { SlashCommandBuilder } from 'discord.js';
import { BotCommand } from "../utility/commandtypes";
import embedBuilder from '../utility/embedbuilder';
import commandbase from '../utility/commandbase';

export default <BotCommand> {
  getCommandData() {
    return new SlashCommandBuilder()
      .setName('somersault')
      .setDescription('Do a somersault');
  },
  augmentPermissions: commandbase.augmentPermissionsAdmin,
  commandTags: ['cardolphins'],
  async execute(interaction) {
    try {
      await interaction.deferReply();
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const embed = embedBuilder.buildForUser(discordServer, 'Wen Somersault?', 'LFG!', 'somersault', [], 'https://media.giphy.com/media/4NrwipHkVEvpEsCoRP/giphy.gif');
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting server info.' });
    }
  },
};
