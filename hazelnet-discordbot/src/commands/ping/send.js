const NodeCache = require('node-cache');
const i18n = require('i18n');
const {
  MessageActionRow, MessageButton,
} = require('discord.js');
const adahandle = require('../../utility/adahandle');
const cardanoaddress = require('../../utility/cardanoaddress');
const cardanotoken = require('../../utility/cardanotoken');
const embedBuilder = require('../../utility/embedbuilder');

module.exports = {
  cache: new NodeCache({ stdTTL: 900 }),
  async execute(interaction) {
    const pingType = interaction.options.getString('ping-type');
    const target = interaction.options.getString('target');
    const message = interaction.options.getString('message');
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      let errorMessage = false;
      switch (pingType) {
        case 'PING_TYPE_HANDLE':
          if (!adahandle.isHandle(target)) {
            errorMessage = 'invalidHandle';
          }
          break;
        case 'PING_TYPE_NFT':
          if (!cardanotoken.isValidAssetFingerprint(target)) {
            errorMessage = 'invalidAssetFingerprint';
          }
          break;
        case 'PING_TYPE_ADDRESS':
          if (!cardanoaddress.isWalletAddress(target) && !cardanoaddress.isStakeAddress(target)) {
            errorMessage = 'invalidAddress';
          }
          break;
        default:
          errorMessage = 'unknownPingType';
          break;
      }
      if (errorMessage === false && message?.length > 320) {
        errorMessage = 'tooLongMessage';
      } else if (errorMessage === false && this.isUnsafeMessage(message)) {
        errorMessage = 'messageContainsUnsafePhrases';
      }
      if (errorMessage === false) {
        const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
        try {
          const newPing = await interaction.client.services.pings.addPing(externalAccount.id, message, target, discordServer.id);
          this.cache.set(`${interaction.user.id}`, newPing);
          const pingFields = [{
            name: i18n.__({ phrase: 'ping.send.messageContentTitle', locale }),
            value: i18n.__({ phrase: `ping.send.${message ? 'messageContent' : 'messageContentEmpty'}`, locale }, { message })
              + i18n.__({ phrase: 'ping.send.clickBelowToSend', locale }, { message })
              + i18n.__({ phrase: 'ping.send.recipientAcknowledgement', locale }, { message }),
          },
          {
            name: i18n.__({ phrase: 'ping.send.pingLimitTitle', locale }),
            value: i18n.__({ phrase: `ping.send.${externalAccount.premium ? 'pingLimitPremium' : 'pingLimitStandard'}`, locale }),
          }];
          const components = [
            new MessageActionRow()
              .addComponents(
                new MessageButton()
                  .setCustomId('ping/send/send')
                  .setLabel(i18n.__({ phrase: 'ping.send.pingButton', locale }))
                  .setStyle('PRIMARY'),
              ),
          ];
          const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'ping.send.messageTitle', locale }), i18n.__({ phrase: 'ping.send.purpose', locale }, { targetShort: cardanoaddress.shorten(target) }), 'ping-send', pingFields);
          await interaction.editReply({ embeds: [embed], components, ephemeral: true });
        } catch (pingError) {
          let pingAddErrorMessage = 'ping.send.pingOtherError';
          let waitTime;
          let waitUnits;
          switch (pingError.response?.status) {
            case 404:
              pingAddErrorMessage = 'ping.send.pingTargetNotFound';
              break;
            case 403: {
              const { minutesSinceLastPing } = pingError.response.data.messages[0].additionalData;
              waitTime = (externalAccount.premium ? 60 : 1440) - minutesSinceLastPing;
              waitUnits = i18n.__({ phrase: 'ping.send.waitUnitsMinutes', locale });
              if (waitTime > 60) {
                waitUnits = i18n.__({ phrase: 'ping.send.waitUnitsHours', locale });
                waitTime = Math.floor(waitTime / 60);
              }
              pingAddErrorMessage = 'ping.send.pingTooOften';
              break;
            }
            default:
              break;
          }
          const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'ping.send.messageTitle', locale }), i18n.__({ phrase: pingAddErrorMessage, locale }, { targetShort: cardanoaddress.shorten(target), waitTime, waitUnits }), 'ping-send');
          await interaction.editReply({ embeds: [embed], ephemeral: true });
        }
      } else {
        const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'ping.send.messageTitle', locale }), i18n.__({ phrase: `ping.send.${errorMessage}`, locale }, { target }), 'ping-send');
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ guildId: interaction.guild.id, content: 'Error while pinging user. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
  async executeButton(interaction) {
    if (interaction.customId === 'ping/send/send') {
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      const pingToSend = this.cache.take(`${interaction.user.id}`);
      if (pingToSend) {
        const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
        await interaction.client.services.pings.updateExternalAccountPing(externalAccount.id, pingToSend.id, {
          sentTime: new Date().toISOString().replace(/\.[0-9]{3}Z$/, ''),
        });
        if (pingToSend.recipientLocal) { // recipientLocal will be null if recipient does not want message pings
          try {
            const recipientDmChannel = await interaction.client.users.createDM(pingToSend.recipientLocal);
            const messageFields = [];
            if (pingToSend.senderMessage) {
              messageFields.push({
                name: i18n.__({ phrase: 'ping.send.pingRecipientMessageTitle', locale }),
                value: pingToSend.senderMessage,
              });
            }
            messageFields.push({
              name: i18n.__({ phrase: 'ping.send.pingRecipientAdditionalTitle', locale }),
              value: i18n.__({ phrase: 'ping.send.pingRecipientAdditionalContent', locale }),
            });
            const components = [
              new MessageActionRow()
                .addComponents(
                  new MessageButton()
                    .setCustomId(`ping/send/report-${pingToSend.id}-${discordServer.id}`)
                    .setLabel(i18n.__({ phrase: 'ping.send.reportPing', locale }))
                    .setStyle('SECONDARY'),
                ),
            ];
            let targetType = 'pingTargetTypeAddress';
            if (adahandle.isHandle(pingToSend.recipientAddress)) {
              targetType = 'pingTargetTypeHandle';
            } else if (cardanotoken.isValidAssetFingerprint(pingToSend.recipientAddress)) {
              targetType = 'pingTargetTypeNft';
            }
            const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'ping.send.pingRecipientTitle', locale }), i18n.__({ phrase: 'ping.send.pingRecipientText', locale }, {
              sender: interaction.user.id,
              guildName: interaction.guild.name,
              targetType: i18n.__({ phrase: `ping.send.${targetType}`, locale }),
              target: pingToSend.recipientAddress,
            }), 'ping-send', messageFields);
            await recipientDmChannel.send({ components, embeds: [embed], ephemeral: true });
          } catch (error) {
            interaction.client.logger.info({ guildId: interaction.guild.id, error: `The discord user with the ID ${pingToSend.recipientLocal} is not accepting messages. Ping was sent by ${interaction.user.id} (${interaction.user.tag}).` });
          }
        }
        const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'ping.send.messageTitle', locale }), i18n.__({ phrase: 'ping.send.success', locale }, { targetShort: cardanoaddress.shorten(pingToSend.recipientAddress) }), 'ping-send');
        await interaction.update({ components: [], embeds: [embed], ephemeral: true });
      } else {
        const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'ping.send.messageTitle', locale }), i18n.__({ phrase: 'ping.send.failedTimeout', locale }), 'ping-send');
        await interaction.update({ components: [], embeds: [embed], ephemeral: true });
      }
    } else if (interaction.customId.indexOf('ping/send/report-') === 0) {
      const [, pingToReport, discordServerId] = interaction.customId.split('-');
      const discordServer = await interaction.client.services.discordserver.getDiscordServerByInternalId(discordServerId);
      const locale = discordServer.getBotLanguage();
      const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
      await interaction.client.services.pings.updateExternalAccountPing(externalAccount.id, pingToReport, { reported: true });
      const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'ping.send.reportTitle', locale }), i18n.__({ phrase: 'ping.send.reportContent', locale }), 'ping-send');
      await interaction.update({ components: [] });
      await interaction.user.send({ embeds: [embed], ephemeral: true });
    }
  },
  isUnsafeMessage(message) {
    const httpUrlRegex = /(https?:(?:\/\/)?)/i;
    const handleRegex = /\$[-._a-zA-Z0-9]{1,15}/i;
    const cardanoAddress = /addr1[a-zA-Z0-9]{10,100}/i;
    return httpUrlRegex.test(message)
      || handleRegex.test(message)
      || cardanoAddress.test(message);
  },
};
