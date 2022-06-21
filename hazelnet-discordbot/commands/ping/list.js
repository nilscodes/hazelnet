const i18n = require('i18n');
const {
  MessageActionRow, MessageButton,
} = require('discord.js');
const embedBuilder = require('../../utility/embedbuilder');
const datetime = require('../../utility/datetime');
const cardanoaddress = require('../../utility/cardanoaddress');

module.exports = {
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();

      const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
      const mainAccount = await interaction.client.services.externalaccounts.getAccountForExternalAccount(externalAccount.id);
      const allPings = await interaction.client.services.pings.getPingsForExternalAccount(externalAccount.id);
      const receivedPings = allPings.filter((ping) => ping.sentTime && ping.recipient === mainAccount.id);
      const sentPings = allPings.filter((ping) => ping.sentTime && ping.sender === externalAccount.id);
      const pingFields = [{
        name: i18n.__({ phrase: 'ping.list.receivedPingsTitle', locale }),
        value: receivedPings.length ? receivedPings.map((ping) => {
          const sentTime = datetime.getUTCDateFormatted(ping, 'sentTime');
          return i18n.__({ phrase: 'ping.list.receivedPing', locale }, {
            senderLocal: ping.senderLocal,
            sentTime,
            targetShort: cardanoaddress.shorten(ping.recipientAddress),
            message: ping.senderMessage,
          });
        }).join('\n\n') : i18n.__({ phrase: 'ping.list.receivedPingsNone', locale }),
      },
      {
        name: i18n.__({ phrase: 'ping.list.sentPingsTitle', locale }),
        value: sentPings.length ? sentPings.map((ping) => {
          const sentTime = datetime.getUTCDateFormatted(ping, 'sentTime');
          return i18n.__({ phrase: 'ping.list.sentPing', locale }, {
            sentTime,
            targetShort: cardanoaddress.shorten(ping.recipientAddress),
          });
        }).join('\n\n') : i18n.__({ phrase: 'ping.list.sentPingsNone', locale }),
      }];
      if (receivedPings.length) {
        pingFields.push({
          name: i18n.__({ phrase: 'ping.send.pingRecipientAdditionalTitle', locale }),
          value: i18n.__({ phrase: 'ping.send.pingRecipientAdditionalContent', locale }),
        });
      }
      const components = [
        new MessageActionRow()
          .addComponents(
            new MessageButton()
              .setCustomId('ping/list/test')
              .setLabel(i18n.__({ phrase: 'ping.list.testPingReceive', locale }))
              .setStyle('PRIMARY'),
          ),
      ];
      const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'ping.list.messageTitle', locale }), i18n.__({ phrase: 'ping.list.purpose', locale }), 'ping-list', pingFields);
      await interaction.editReply({ embeds: [embed], components, ephemeral: true });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ guildId: interaction.guild.id, content: 'Error while pinging user. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
  async executeButton(interaction) {
    if (interaction.customId === 'ping/list/test') {
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      try {
        const recipientDmChannel = await interaction.client.users.createDM(interaction.user.id);
        const messageFields = [{
          name: i18n.__({ phrase: 'ping.send.pingRecipientMessageTitle', locale }),
          value: i18n.__({ phrase: 'ping.list.testPingTestMessage', locale }),
        }, {
          name: i18n.__({ phrase: 'ping.send.pingRecipientAdditionalTitle', locale }),
          value: i18n.__({ phrase: 'ping.send.pingRecipientAdditionalContent', locale }),
        }];
        const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'ping.send.pingRecipientTitle', locale }), i18n.__({ phrase: 'ping.send.pingRecipientText', locale }, {
          sender: interaction.user.id,
          guildName: interaction.guild.name,
          target: '$test',
        }), 'ping-list', messageFields);
        await recipientDmChannel.send({ embeds: [embed], ephemeral: true });
        const embedFollowUp = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'ping.list.testMessageSentTitle', locale }), i18n.__({ phrase: 'ping.list.testMessageSentContent', locale }), 'ping-list');
        await interaction.reply({ embeds: [embedFollowUp], components: [], ephemeral: true });
      } catch (error) {
        if (error.constructor?.name === 'DiscordAPIError') {
          const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'ping.list.noDirectMessageTitle', locale }), i18n.__({ phrase: 'ping.list.noDirectMessage', locale }), 'ping-list');
          await interaction.reply({ embeds: [embed], components: [], ephemeral: true });
        } else {
          interaction.client.logger.error(error);
        }
      }
    }
  },
};
