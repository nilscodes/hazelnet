import { APIEmbedField } from 'discord.js';
import i18n from 'i18n';
import { DiscordServer } from '../../utility/sharedtypes';
import { BotSubcommand } from '../../utility/commandtypes';
import embedBuilder from '../../utility/embedbuilder';

interface PremiumStatusCommand extends BotSubcommand {
  addBillingInfo(premiumInfo: any, premiumFields: APIEmbedField[], discordServer: DiscordServer, locale: string): void
  addCostInfo(premiumInfo: any, premiumFields: APIEmbedField[], discordServer: DiscordServer, locale: string): void
  addBalanceInfo(premiumInfo: any, premiumFields: APIEmbedField[], discordServer: DiscordServer, locale: string): void
  addBenefitsInfo(premiumInfo: any, locale: string): void
}

export default <PremiumStatusCommand> {
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      const premiumInfo = await interaction.client.services.discordserver.getPremiumInfo(interaction.guild!.id);
      const premiumUntilTimestamp = premiumInfo.premiumUntil && Math.floor(new Date(premiumInfo.premiumUntil).getTime() / 1000);
      const premiumFields = [{
        name: i18n.__({ phrase: 'configure.premium.status.premiumStatus', locale }),
        value: i18n.__({ phrase: (premiumInfo.currentPremium ? 'configure.premium.status.premiumStatusYes' : 'configure.premium.status.premiumStatusNo'), locale }, { premiumUntilTimestamp } as any),
      }];
      this.addBillingInfo(premiumInfo, premiumFields, discordServer, locale);
      this.addCostInfo(premiumInfo, premiumFields, discordServer, locale);
      this.addBalanceInfo(premiumInfo, premiumFields, discordServer, locale);
      this.addBenefitsInfo(premiumFields, locale);
      const embed = embedBuilder.buildForAdmin(discordServer, '/configure-premium status', i18n.__({ phrase: 'configure.premium.status.purpose', locale }), 'configure-premium-status', premiumFields);
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while viewing premium status. Please contact your bot admin via https://www.hazelnet.io.' });
    }
  },
  addBillingInfo(premiumInfo, premiumFields, discordServer, locale) {
    if (premiumInfo.lastBillingTime) {
      const lastBillingTimeTimestamp = Math.floor(new Date(premiumInfo.lastBillingTime).getTime() / 1000);
      premiumFields.push({
        name: i18n.__({ phrase: 'configure.premium.status.lastBill', locale }),
        value: i18n.__({ phrase: 'configure.premium.status.lastBillInfo', locale }, {
          ...premiumInfo,
          lastBillingAmount: Math.round(premiumInfo.lastBillingAmount / 100000) / 10,
          lastBillingGuildMemberCountFormatted: discordServer.formatNumber(premiumInfo.lastBillingGuildMemberCount),
          lastBillingTimeTimestamp,
        }),
      });
    }
  },
  addCostInfo(premiumInfo, premiumFields, discordServer, locale) {
    premiumFields.push({
      name: i18n.__({ phrase: 'configure.premium.status.cost', locale }),
      value: i18n.__({ phrase: 'configure.premium.status.costInfo', locale }, {
        ...premiumInfo,
        currentGuildMemberCountFormatted: discordServer.formatNumber(premiumInfo.guildMemberCount),
        monthlyCostFormatted: Math.round(premiumInfo.monthlyCost / 100000) / 10,
        discount: Math.min(100, Math.round(Math.round((premiumInfo.totalDelegation / premiumInfo.maxDelegation) * 100))),
        actualMonthlyCostFormatted: Math.round(premiumInfo.actualMonthlyCost / 100000) / 10,
      }),
    });
    premiumFields.push({
      name: i18n.__({ phrase: 'configure.premium.status.discount', locale }),
      value: i18n.__({ phrase: 'configure.premium.status.discountInfo', locale }, {
        totalDelegationFormatted: discordServer.formatNumber(Math.round(premiumInfo.totalDelegation / 1000000)),
        maxDelegationFormatted: discordServer.formatNumber(Math.round(premiumInfo.maxDelegation / 1000000)),
        discount: Math.min(100, Math.round(Math.round((premiumInfo.totalDelegation / premiumInfo.maxDelegation) * 100))),
      } as any),
    });
  },
  addBalanceInfo(premiumInfo, premiumFields, discordServer, locale) {
    const balanceMessages = [
      i18n.__({ phrase: 'configure.premium.status.balanceInfo', locale }, { remainingBalanceFormatted: discordServer.formatNumber(Math.round(premiumInfo.remainingBalance / 1000000)) }),
    ];
    if (premiumInfo.remainingBalance < 0) {
      balanceMessages.push(i18n.__({ phrase: 'configure.premium.status.balanceInfoNegative', locale }));
    }
    balanceMessages.push(i18n.__({ phrase: 'configure.premium.status.balanceInfoTopOff', locale }));
    premiumFields.push({
      name: i18n.__({ phrase: 'configure.premium.status.balance', locale }),
      value: balanceMessages.join(' '),
    });
  },
  addBenefitsInfo(premiumFields, locale) {
    premiumFields.push({
      name: i18n.__({ phrase: 'configure.premium.status.benefits', locale }),
      value: i18n.__({ phrase: 'configure.premium.status.benefitsDetails', locale }),
    });
  },
};
