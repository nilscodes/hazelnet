/* eslint-disable global-require */
const fs = require('fs');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const path = require('path');
const commandbase = require('./commandbase');

const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);

module.exports = {
  async registerStartCommand(client, guildId) {
    const startCommand = require('../commands/start');
    await this.registerCommands(client, guildId, [startCommand.getCommandData('en').toJSON()]);
  },
  async registerMainCommands(enabledCommandTags, client, guildId) {
    const commandsToEnable = [...enabledCommandTags];
    const discordServer = await client.services.discordserver.getDiscordServer(guildId);
    const useLocale = discordServer.getBotLanguage();
    const commands = [];
    const commandFiles = fs.readdirSync(path.resolve(__dirname, '..', 'commands')) // readdir operates out of root directory
      .filter((file) => file.endsWith('.js') || file.endsWith('.ts'));
    //  .filter((file) => !file.startsWith('start'));

    if (!discordServer.settings?.SPONSORED_BY) {
      commandsToEnable.push('premium');
    }

    for (let i = 0; i < commandFiles.length; i += 1) {
      const file = commandFiles[i];
      let command;
      const importName = file.substring(0, file.lastIndexOf('.'));
      if (commandbase.typescriptCommands.includes(importName)) {
        // eslint-disable-next-line no-await-in-loop
        command = (await import(`../commands/${importName}`)).default;
      } else {
        // eslint-disable-next-line import/no-dynamic-require
        command = require(`../commands/${importName}`); // require uses relative path
      }
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
  async registerCommands(client, guildId, commands) {
    const commandNames = commands.map((command) => command.name).join(', ');
    try {
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
        { body: commands },
      );

      client.logger.info(`Successfully registered application commands [${commandNames}] for guild with ID ${guildId}`);
    } catch (error) {
      client.logger.error({ msg: `Error registering application commands [${commandNames}] for guild with ID ${guildId}`, error });
    }
  },
};
