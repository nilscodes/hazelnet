// To be merged with commandbase.js
import { AugmentedCommandInteraction, AugmentedButtonInteraction, AugmentedSelectMenuInteraction, AugmentedUserContextMenuInteraction } from "src/utility/hazelnetclient";
import { ContextMenuCommandBuilder, SlashCommandBuilder } from "@discordjs/builders";

export interface BotCommand {
  getCommandData(locale: string, commandsToEnable?: string[]): SlashCommandBuilder
  getContextMenuData?(locale: string): ContextMenuCommandBuilder
  augmentPermissions(): void
  execute(interaction: AugmentedCommandInteraction): void
  executeSelectMenu?(interaction: AugmentedSelectMenuInteraction): void
  executeButton?(interaction: AugmentedButtonInteraction): void
  executeUserContextMenu?(interaction: AugmentedUserContextMenuInteraction): void
}

export interface BotSubcommand {
  execute(interaction: AugmentedCommandInteraction): void
  executeSelectMenu?(interaction: AugmentedSelectMenuInteraction): void
  executeButton?(interaction: AugmentedButtonInteraction): void
}
