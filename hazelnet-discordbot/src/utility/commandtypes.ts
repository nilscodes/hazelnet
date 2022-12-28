// To be merged with commandbase.js
import HazelnetClient, { AugmentedCommandInteraction, AugmentedButtonInteraction, AugmentedSelectMenuInteraction, AugmentedUserContextMenuInteraction } from "./hazelnetclient";
import { ContextMenuCommandBuilder, Guild, SlashCommandBuilder } from 'discord.js';

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
  client?: HazelnetClient
  execute(client: HazelnetClient, ...args: any[]): void
}

export interface GuildDiscordEvent extends DiscordEvent {
  execute(client: HazelnetClient, guild: Guild): void
}