import i18n from 'i18n';
import HazelnetClient from '../../utility/hazelnetclient';
import { Message, TextBasedChannel } from "discord.js";
import adahandle  from '../../utility/adahandle';
import cardanoaddress from '../../utility/cardanoaddress';
import embedBuilder from '../../utility/embedbuilder';
import ethereumaddress from '../../utility/ethereumaddress';

interface ProtectionInteractionHandler {
  applyProtection(client: HazelnetClient, message: Message, discordServer: any): void
}

export default<ProtectionInteractionHandler> {
  async applyProtection(client, message, discordServer) {
    const containsCardanoAddress = cardanoaddress.containsWalletOrEnterpriseAddress(message.content);
    const containsEthereumAddress = ethereumaddress.containsWalletAddress(message.content);
    const containsAdaHandle = adahandle.containsHandle(message.content);
    if (containsCardanoAddress || containsEthereumAddress || containsAdaHandle) {
      try {
        if (discordServer?.settings?.PROTECTION_ADDR_REMOVAL === 'true') {
          const removalTypesString = discordServer.settings?.PROTECTION_ADDR_REMOVAL_TYPES ?? 'CARDANO,ETHEREUM';
          const removalTypes = removalTypesString.split(',');
          if ((containsCardanoAddress && removalTypes.includes('CARDANO'))
            || (containsEthereumAddress && removalTypes.includes('ETHEREUM'))
            || (containsAdaHandle && removalTypes.includes('ADAHANDLE'))) {
            if (discordServer?.settings?.PROTECTION_AUDIT_CHANNEL !== '') {
              try {
                const channel = await message.guild?.channels.fetch(discordServer.settings.PROTECTION_AUDIT_CHANNEL) as TextBasedChannel;
                if (channel && channel.send) {
                  const locale = discordServer.getBotLanguage();
                  const embed = embedBuilder.buildForAudit(
                    discordServer,
                    i18n.__({ phrase: 'configure.protection.auditchannel.auditEventTitle', locale }),
                    i18n.__({ phrase: 'configure.protection.auditchannel.auditEventDetail', locale }, { author: message.author.id, channel: message.channel.id, message: message.content }),
                    'configure-protection-auditchannel'
                  );
                  channel.send({ embeds: [embed] });
                } else {
                  client.logger.warn(`Server ${discordServer.guildId} does not have a valid audit channel configured with ${discordServer.settings.PROTECTION_AUDIT_CHANNEL}`);
                }
              } catch (error) {
                client.logger.warn(`Error when sending audit message for guild ${discordServer.guildId} with audit channel configured with ${discordServer.settings.PROTECTION_AUDIT_CHANNEL}`);
              }
            }
            message.delete();
          }
        }
      } catch (error) {
        client.logger.error(error);
      }
    }
  },
};

