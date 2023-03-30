// To be merged with commandbase.js
import HazelnetClient, { AugmentedCommandInteraction, AugmentedButtonInteraction, AugmentedSelectMenuInteraction, AugmentedUserContextMenuInteraction } from "./hazelnetclient";
import { ContextMenuCommandBuilder, Guild, RESTPostAPIChatInputApplicationCommandsJSONBody, SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder } from 'discord.js';

export interface BotCommand {
  getCommandData(locale: string, commandsToEnable?: string[]): SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder
  getContextMenuData?(locale: string): ContextMenuCommandBuilder
  augmentPermissions(json: RESTPostAPIChatInputApplicationCommandsJSONBody): RESTPostAPIChatInputApplicationCommandsJSONBody
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