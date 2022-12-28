import i18n from 'i18n';
import { BotSubcommand } from '../../utility/commandtypes';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageActionRowComponentBuilder } from 'discord.js';
import { ExternalAccountPing } from '../../utility/sharedtypes';
const embedBuilder = require('../../utility/embedbuilder');
const cardanoaddress = require('../../utility/cardanoaddress');

export default <BotSubcommand> {
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();

      const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
      const mainAccount = await interaction.client.services.externalaccounts.getAccountForExternalAccount(externalAccount.id);
      const allPings = await interaction.client.services.pings.getPingsForExternalAccount(externalAccount.id) as ExternalAccountPing[];
      const receivedPings = allPings.filter((ping) => ping.sentTime && ping.recipient === mainAccount.id);
      const sentPings = allPings.filter((ping) => ping.sentTime && ping.sender === externalAccount.id);
      const pingFields = [{
        name: i18n.__({ phrase: 'ping.list.receivedPingsTitle', locale }),
        value: receivedPings.length ? receivedPings.map((ping) => {
          const sentTime = Math.floor(new Date(ping.sentTime).getTime() / 1000);
          return i18n.__({ phrase: 'ping.list.receivedPing', locale }, {
            senderLocal: ping.senderLocal,
            sentTime,
            targetShort: cardanoaddress.shorten(ping.recipientAddress),
            message: ping.senderMessage,
          } as any);
        }).join('\n\n') : i18n.__({ phrase: 'ping.list.receivedPingsNone', locale }),
      },
      {
        name: i18n.__({ phrase: 'ping.list.sentPingsTitle', locale }),
        value: sentPings.length ? sentPings.map((ping) => {
          const sentTime = Math.floor(new Date(ping.sentTime).getTime() / 1000);
          return i18n.__({ phrase: 'ping.list.sentPing', locale }, {
            sentTime,
            targetShort: cardanoaddress.shorten(ping.recipientAddress),
          } as any);
        }).join('\n\n') : i18n.__({ phrase: 'ping.list.sentPingsNone', locale }),
      }];
      if (receivedPings.length) {
        pingFields.push({
          name: i18n.__({ phrase: 'ping.send.pingRecipientAdditionalTitle', locale }),
          value: i18n.__({ phrase: 'ping.send.pingRecipientAdditionalContent', locale }),
        });
      }
      const components = [
        new ActionRowBuilder<MessageActionRowComponentBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('ping/list/test')
              .setLabel(i18n.__({ phrase: 'ping.list.testPingReceive', locale }))
              .setStyle(ButtonStyle.Primary),
          ),
      ];
      const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'ping.list.messageTitle', locale }), i18n.__({ phrase: 'ping.list.purpose', locale }), 'ping-list', pingFields);
      await interaction.editReply({ embeds: [embed], components });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while pinging user. Please contact your bot admin via https://www.hazelnet.io.' });
    }
  },
  async executeButton(interaction) {
    if (interaction.customId === 'ping/list/test') {
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
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
          guildName: interaction.guild!.name,
          target: '$test',
        }), 'ping-list', messageFields);
        await recipientDmChannel.send({ embeds: [embed] });
        const embedFollowUp = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'ping.list.testMessageSentTitle', locale }), i18n.__({ phrase: 'ping.list.testMessageSentContent', locale }), 'ping-list');
        await interaction.reply({ embeds: [embedFollowUp], components: [], ephemeral: true });
      } catch (error) {
        if (error?.constructor?.name === 'DiscordAPIError') {
          const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'ping.list.noDirectMessageTitle', locale }), i18n.__({ phrase: 'ping.list.noDirectMessage', locale }), 'ping-list');
          await interaction.reply({ embeds: [embed], components: [], ephemeral: true });
        } else {
          interaction.client.logger.error(error);
        }
      }
    }
  },
};
