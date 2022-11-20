import { DiscordEvent } from "../utility/commandtypes";

import i18n from 'i18n';
import { ChannelType, Message, TextBasedChannel } from "discord.js";
import { AugmentedMessage } from "../utility/hazelnetclient";
const adahandle = require('../utility/adahandle');
const cardanoaddress = require('../utility/cardanoaddress');
const embedBuilder = require('../utility/embedbuilder');
const ethereumaddress = require('../utility/ethereumaddress');

interface MessageCreateDiscordEvent extends DiscordEvent {
  execute(message: AugmentedMessage): void
}

export default <MessageCreateDiscordEvent> {
  name: 'messageCreate',
  async execute(message) {
    const isSentByHazelnet = message.author.id === message.client.application?.id;
    if (!isSentByHazelnet) {
      if (message.channel.type === ChannelType.DM) {
        const claimCommand: any = message.client.commands.get('claim');
        await claimCommand.processDirectMessage(message);
      } else if (message.content) {
        const containsCardanoAddress = cardanoaddress.containsWalletOrEnterpriseAddress(message.content);
        const containsEthereumAddress = ethereumaddress.containsWalletAddress(message.content);
        const containsAdaHandle = adahandle.containsHandle(message.content);
        if (containsCardanoAddress || containsEthereumAddress || containsAdaHandle) {
          try {
            const discordServer = await message.client.services.discordserver.getDiscordServer(message.guildId);
            if (discordServer?.settings?.PROTECTION_ADDR_REMOVAL === 'true') {
              const removalTypesString = discordServer?.settings?.PROTECTION_ADDR_REMOVAL_TYPES ?? 'CARDANO,ETHEREUM';
              const removalTypes = removalTypesString.split(',');
              if (
                (containsCardanoAddress && removalTypes.includes('CARDANO'))
                 || (containsEthereumAddress && removalTypes.includes('ETHEREUM'))
                 || (containsAdaHandle && removalTypes.includes('ADAHANDLE'))
              ) {
                if (discordServer?.settings?.PROTECTION_AUDIT_CHANNEL !== '') {
                  try {
                    const channel = await message.guild?.channels.fetch(discordServer.settings.PROTECTION_AUDIT_CHANNEL) as TextBasedChannel;
                    if (channel && channel.send) {
                      const useLocale = discordServer.getBotLanguage();

                      const embed = embedBuilder.buildForAudit(
                        discordServer,
                        i18n.__({ phrase: 'configure.protection.auditchannel.auditEventTitle', locale: useLocale }),
                        i18n.__({ phrase: 'configure.protection.auditchannel.auditEventDetail', locale: useLocale }, { author: message.author.id, channel: message.channel.id, message: message.content }),
                        'configure-protection-auditchannel',
                      );
                      await channel.send({ embeds: [embed] });
                    } else {
                      message.client.logger.warn(`Server ${discordServer.guildId} does not have a valid audit channel configured with ${discordServer.settings.PROTECTION_AUDIT_CHANNEL}`);
                    }
                  } catch (error) {
                    message.client.logger.warn(`Error when sending audit message for guild ${discordServer.guildId} with audit channel configured with ${discordServer.settings.PROTECTION_AUDIT_CHANNEL}`);
                  }
                }
                await message.delete();
              }
            }
          } catch (error) {
            message.client.logger.error(error);
          }
        }
      }
    }
  },
};
