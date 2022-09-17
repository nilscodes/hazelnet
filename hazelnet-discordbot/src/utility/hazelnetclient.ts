import { ChatInputCommandInteraction, Client, ClientOptions, Collection, SelectMenuInteraction, ButtonInteraction, UserContextMenuCommandInteraction, Message, Guild } from 'discord.js';
import { CommandMetrics } from './metrics';
import { Logger } from 'pino'

export interface AugmentedCommandInteraction extends ChatInputCommandInteraction {
  client: HazelnetClient
}

export interface AugmentedButtonInteraction extends ButtonInteraction {
  client: HazelnetClient
}

export interface AugmentedSelectMenuInteraction extends SelectMenuInteraction {
  client: HazelnetClient
}

export interface AugmentedUserContextMenuInteraction extends UserContextMenuCommandInteraction {
  client: HazelnetClient
}

export interface AugmentedMessage extends Message {
  client: HazelnetClient
}

export interface AugmentedGuild extends Guild {
  client: HazelnetClient
}

export default class HazelnetClient extends Client {
  services: any;
  logger: Logger;
  commands: Collection<unknown, unknown>;
  metrics: CommandMetrics;

  constructor(services: any, logger: Logger, commands: Collection<unknown, unknown>, metrics: CommandMetrics, options: ClientOptions) {
    super(options);
    this.services = services;
    this.logger = logger;
    this.commands = commands;
    this.metrics = metrics;
  }
}