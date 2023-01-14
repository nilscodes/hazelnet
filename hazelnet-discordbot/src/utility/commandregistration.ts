/* eslint-disable global-require */
import startCommand from '../commands/start';
import { BotCommand } from './commandtypes';
import HazelnetClient from './hazelnetclient';
import fs from 'fs'
import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v9';
import path from 'path';

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN!);

export default {
  async registerStartCommand(client: HazelnetClient, guildId: string) {
    await this.registerCommands(client, guildId, [startCommand.getCommandData('en').toJSON()]);
  },
  async registerMainCommands(enabledCommandTags: string[], client: HazelnetClient, guildId: string) {
    const commandsToEnable = [...enabledCommandTags];
    const discordServer = await client.services.discordserver.getDiscordServer(guildId);
    const useLocale = discordServer.getBotLanguage();
    const commands = [];
    const commandFiles = fs.readdirSync(path.resolve(__dirname, '..', 'commands')) // readdir operates out of root directory
      .filter((file: string) => file.endsWith('.js') || file.endsWith('.ts'));
    //  .filter((file) => !file.startsWith('start'));

    if (!discordServer.settings?.SPONSORED_BY) {
      commandsToEnable.push('premium');
    }

    for (let i = 0; i < commandFiles.length; i += 1) {
      const file = commandFiles[i];
      const importName = file.substring(0, file.lastIndexOf('.'));
      // eslint-disable-next-line no-await-in-loop
      const command = (await import(`../commands/${importName}`)).default as BotCommand;
      const commandIsEnabled = !command.commandTags || command.commandTags.filter((tag) => commandsToEnable.includes(tag)).length;
      if (commandIsEnabled) {
        let commandJson = command.getCommandData(useLocale, commandsToEnable).toJSON();
        if (command.augmentPermissions) {
          commandJson = command.augmentPermissions(commandJson);
        }
        commands.push(commandJson);
        if (command.getContextMenuData) {
          commands.push(command.getContextMenuData(useLocale).toJSON());
        }
      }
    }

    await this.registerCommands(client, guildId, commands);
  },
  async registerCommands(client: HazelnetClient, guildId: string, commands: any[]) {
    const commandNames = commands.map((command) => command.name).join(', ');
    try {
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID!, guildId),
        { body: commands },
      );

      client.logger.info(`Successfully registered application commands [${commandNames}] for guild with ID ${guildId}`);
    } catch (error) {
      client.logger.error({ msg: `Error registering application commands [${commandNames}] for guild with ID ${guildId}`, error });
    }
  },
};
