import { CommandInteraction, Client, ClientOptions, Collection, SelectMenuInteraction, ButtonInteraction, Interaction, UserContextMenuInteraction } from 'discord.js';
import { CommandMetrics } from './metrics';
import { Logger } from 'pino'

export interface AugmentedCommandInteraction extends CommandInteraction {
  client: HazelnetClient
}

export interface AugmentedButtonInteraction extends ButtonInteraction {
  client: HazelnetClient
}

export interface AugmentedSelectMenuInteraction extends SelectMenuInteraction {
  client: HazelnetClient
}

export interface AugmentedInteraction extends Interaction {
  client: HazelnetClient
}

export interface AugmentedUserContextMenuInteraction extends UserContextMenuInteraction {
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