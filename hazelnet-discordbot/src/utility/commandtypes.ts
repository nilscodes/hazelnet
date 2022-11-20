// To be merged with commandbase.js
import { AugmentedCommandInteraction, AugmentedButtonInteraction, AugmentedSelectMenuInteraction, AugmentedUserContextMenuInteraction, AugmentedGuild } from "./hazelnetclient";
import { ContextMenuCommandBuilder, SlashCommandBuilder } from 'discord.js';

export interface BotCommand {
  getCommandData(locale: string, commandsToEnable?: string[]): SlashCommandBuilder
  getContextMenuData?(locale: string): ContextMenuCommandBuilder
  augmentPermissions(): void
  commandTags?: string[],
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

export interface DiscordEvent {
  once?: boolean
  name: string
  execute(args: any): void
}

export interface GuildDiscordEvent extends DiscordEvent {
  execute(guild: AugmentedGuild): void
}