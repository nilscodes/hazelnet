// Required map since there is no localization for user context menus yet.
const USERCONTEXT_COMMAND_NAME_MAP = {
  'Show ADA Handle': 'whois',
};

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    try {
      if (interaction.isUserContextMenu()) {
        try {
          const command = interaction.client.commands.get(USERCONTEXT_COMMAND_NAME_MAP[interaction.commandName]);
          if (!command) return;
          await command.executeUserContextMenu(interaction);
        } catch (error) {
          interaction.client.logger.error({ guildId: interaction.guild?.id, error });
          await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
      } else if (interaction.isCommand()) {
        const startRun = new Date();
        const command = interaction.client.commands.get(interaction.commandName);
        const subcommandGroup = interaction.options.getSubcommandGroup(false);
        const subcommand = interaction.options.getSubcommand(false);
        const subcommandName = subcommandGroup ? `${subcommandGroup}-${subcommand}` : subcommand;
        if (!command) return;

        try {
          await command.execute(interaction);
        } catch (error) {
          interaction.client.logger.error({ guildId: interaction.guild?.id, error });
          await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
        const durationInMs = new Date().getTime() - startRun.getTime();
        interaction.client.metrics.commandDuration
          .labels({
            command: subcommandName ? `${interaction.commandName}-${subcommandName}` : interaction.commandName,
            guild: interaction.guild?.id,
          })
          .observe(durationInMs);
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
