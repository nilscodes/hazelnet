/* eslint-disable import/no-dynamic-require,global-require */
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const fs = require('fs');
const path = require('path');
const { Client, Collection, Intents } = require('discord.js');
const i18n = require('i18n');
const cron = require('node-cron');
const logger = require('pino')();
const services = require('./services');

// Configure localization singleton
i18n.configure({
  locales: ['en', 'de'],
  directory: path.join(__dirname, '/i18n'),
  objectNotation: true,
});

// Create a new client instance
const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.DIRECT_MESSAGES],
  partials: ['CHANNEL'],
});

// Inject shared services and utilities into the client
client.services = services;
client.logger = logger;

client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter((file) => file.endsWith('.js'));

commandFiles.forEach((file) => {
  const command = require(`./commands/${file}`);
  const commandData = command.getCommandData('en');
  // Find and add any subcommands, if present
  if (fs.existsSync(`./commands/${commandData.name}`)) {
    const subCommandFiles = fs.readdirSync(`./commands/${commandData.name}`).filter((fileFilter) => fileFilter.endsWith('.js'));
    command.subcommands = {};
    subCommandFiles.forEach((subcommandFile) => {
      const subcommand = require(`./commands/${commandData.name}/${subcommandFile}`);
      const subcommandName = path.basename(subcommandFile, '.js');
      command.subcommands[subcommandName] = subcommand;
    });
  }
  client.commands.set(commandData.name, command);
});

const eventFiles = fs.readdirSync('./events').filter((file) => file.endsWith('.js'));

eventFiles.forEach((file) => {
  const event = require(`./events/${file}`);

  if (event.once) {
    logger.info(`Registering event ${event.name} (once-type)`);
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    logger.info(`Registering event ${event.name} (on-type)`);
    client.on(event.name, (...args) => event.execute(...args));
  }
});

const scheduleFiles = fs.readdirSync('./schedules').filter((file) => file.endsWith('.js'));

scheduleFiles.forEach((file) => {
  const schedule = require(`./schedules/${file}`);
  if (schedule.cron && schedule.execute) {
    cron.schedule(schedule.cron, () => schedule.execute(client));
  }
});

// Login to Discord with your client's token
client.login(process.env.TOKEN);
