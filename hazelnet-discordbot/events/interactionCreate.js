module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    try {
      if (interaction.isCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) return;

        try {
          await command.execute(interaction);
        } catch (error) {
          interaction.client.logger.error({ guildId: interaction.guild?.id, error });
          await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
      } else if (interaction.isSelectMenu()) {
        const commandForSelect = interaction.customId.split('/')[0];
        const command = interaction.client.commands.get(commandForSelect);
        if (!command) return;

        try {
          await command.executeSelectMenu(interaction);
        } catch (error) {
          interaction.client.logger.error({ guildId: interaction.guild?.id, error });
          await interaction.reply({ content: `There was an error while executing the select menu action ${interaction.customId} for this command!`, ephemeral: true });
        }
      } else if (interaction.isButton()) {
        const commandForButton = interaction.customId.split('/')[0];
        const command = interaction.client.commands.get(commandForButton);
        if (!command) return;

        try {
          await command.executeButton(interaction);
        } catch (error) {
          interaction.client.logger.error({ guildId: interaction.guild?.id, error });
          await interaction.reply({ content: `There was an error while executing the button action ${interaction.customId} for this command!`, ephemeral: true });
        }
      }
    } catch (fatalError) {
      interaction.client.logger.error({ guildId: interaction.guild?.id, ...fatalError });
    }
  },
};
