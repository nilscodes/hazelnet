import { DiscordEvent } from "../utility/commandtypes";
import HazelnetClient, { AugmentedButtonInteraction, AugmentedCommandInteraction, AugmentedSelectMenuInteraction, AugmentedUserContextMenuInteraction } from "../utility/hazelnetclient";

interface InteractionCreateDiscordEvent extends DiscordEvent {
  execute(client: HazelnetClient, interaction: AugmentedCommandInteraction | AugmentedButtonInteraction | AugmentedSelectMenuInteraction | AugmentedUserContextMenuInteraction): void
}

type UserContextTranslationMap = {
  [key: string]: string
}

// Required map since there is no localization for user context menus yet.
const USERCONTEXT_COMMAND_NAME_MAP: UserContextTranslationMap = {
  'Show ADA Handle': 'whois',
};

export default <InteractionCreateDiscordEvent> {
  name: 'interactionCreate',
  async execute(client, interaction) {
    try {
      if (interaction.isUserContextMenuCommand()) {
        const userContextMenuCommandInteraction = interaction as AugmentedUserContextMenuInteraction
        try {
          const command: any = client.commands.get(USERCONTEXT_COMMAND_NAME_MAP[userContextMenuCommandInteraction.commandName]);
          if (!command) return;
          await command.executeUserContextMenu(interaction);
        } catch (error) {
          client.logger.error({ guildId: interaction.guild?.id, error: error + '' });
          await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        }
      } else if (interaction.isCommand()) {
        const commandInteraction = interaction as AugmentedCommandInteraction
        const startRun = new Date();
        const command: any = commandInteraction.client.commands.get(interaction.commandName);
        const subcommandGroup = commandInteraction.options.getSubcommandGroup(false);
        const subcommand = commandInteraction.options.getSubcommand(false);
        const subcommandName = subcommandGroup ? `${subcommandGroup}-${subcommand}` : subcommand;
        if (!command) return;

        try {
          await command.execute(interaction);
        } catch (error) {
          client.logger.error({ guildId: interaction.guild?.id, error: error + '' });
          await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        }
        const durationInMs = new Date().getTime() - startRun.getTime();
        client.metrics.commandDuration
          .labels({
            command: subcommandName ? `${interaction.commandName}-${subcommandName}` : interaction.commandName,
            guild: interaction.guild?.id,
          })
          .observe(durationInMs);
      } else if (interaction.isSelectMenu()) {
        const commandForSelect = interaction.customId.split('/')[0];
        const command: any = client.commands.get(commandForSelect);
        if (!command) return;

        try {
          await command.executeSelectMenu(interaction);
        } catch (error) {
          client.logger.error({ guildId: interaction.guild?.id, error: error + '' });
          await interaction.followUp({ content: `There was an error while executing the select menu action ${interaction.customId} for this command!`, ephemeral: true });
        }
      } else if (interaction.isButton()) {
        const commandForButton = interaction.customId.split('/')[0];
        const command: any = client.commands.get(commandForButton);
        if (!command) return;

        try {
          await command.executeButton(interaction);
        } catch (error) {
          client.logger.error({ guildId: interaction.guild?.id, error: error + '' });
          await interaction.followUp({ content: `There was an error while executing the button action ${interaction.customId} for this command!`, ephemeral: true });
        }
      }
    } catch (fatalError) {
      client.logger.error({ guildId: interaction.guild?.id, error: fatalError + '' });
    }
  },
};
