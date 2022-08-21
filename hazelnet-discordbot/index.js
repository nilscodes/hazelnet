/* eslint-disable import/no-dynamic-require,global-require */
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const fs = require('fs');
const path = require('path');
const { Client, Collection, Intents } = require('discord.js');
const i18n = require('i18n');
const cron = require('node-cron');
const express = require('express');
const prometheus = require('prom-client');
const logger = require('pino')();
const amqplib = require('amqplib');
const services = require('./services');
const metrics = require('./utility/metrics');

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
client.metrics = metrics.setup(prometheus);

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

// Connect to AMQP queues
const queueFiles = fs.readdirSync('./queues').filter((file) => file.endsWith('.js'));

if (queueFiles.length) {
  (async () => {
    const conn = await amqplib.connect(`amqp://hazelnet:${encodeURIComponent(process.env.RABBITMQ_PASSWORD)}@${process.env.RABBITMQ_HOST}`);
    queueFiles.forEach(async (file) => {
      const queue = require(`./queues/${file}`);
      if (queue.name && queue.consume) {
        const queueChannel = await conn.createChannel();
        await queueChannel.assertQueue(queue.name);
        queueChannel.consume(queue.name, (msg) => {
          if (msg !== null) {
            queue.consume(client, JSON.parse(msg.content.toString()));
            queueChannel.ack(msg);
          } else {
            logger.error({ msg: `Consumer for queue ${queue.name} cancelled by server` });
          }
        });
      }
    });
  })();
}

// Start express server to expose prometheus metrics
const app = express();

app.get('/metrics', async (_, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(await prometheus.register.metrics());
});

app.listen(30100);
