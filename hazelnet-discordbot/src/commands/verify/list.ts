import i18n from 'i18n';
import { BotSubcommand } from '../../utility/commandtypes';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageActionRowComponentBuilder } from 'discord.js';
import embedBuilder from '../../utility/embedbuilder';
import cardanoaddress from '../../utility/cardanoaddress';

export default <BotSubcommand> {
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    try {
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
      const verifications = await interaction.client.services.externalaccounts.getActiveVerificationsForExternalAccount(externalAccount.id);

      const verificationInfoFields = [];
      const currentMembers = await interaction.client.services.discordserver.listExternalAccounts(interaction.guild!.id);
      const currentMemberData = currentMembers.find((member) => member.externalAccountId === externalAccount.id);
      if (currentMemberData) {
        verificationInfoFields.push({ name: i18n.__({ phrase: 'verify.list.accountIsLinked', locale }), value: i18n.__({ phrase: 'verify.list.accountIsLinkedInfo', locale }) });
      } else {
        verificationInfoFields.push({ name: i18n.__({ phrase: 'verify.list.accountIsNotLinked', locale }), value: i18n.__({ phrase: 'verify.list.accountIsNotLinkedInfo', locale }) });
      }

      const relevantVerifications = verifications.filter((verification) => !verification.obsolete);
      if (relevantVerifications.length) {
        const confirmedVerifications = relevantVerifications.filter((verification) => verification.confirmed);
        if (confirmedVerifications.length) {
          verificationInfoFields.push(...confirmedVerifications.map((verification) => {
            const stakeShort = verification.cardanoStakeAddress!.substring(0, 10);
            let confirmationText = i18n.__({ phrase: 'verify.list.confirmedData', locale }, { verification } as any);
            if (!verification.transactionHash || !cardanoaddress.isTransactionHash(verification.transactionHash)) {
              confirmationText = i18n.__({ phrase: 'verify.list.confirmedDataImport', locale }, { verification } as any);
            }
            return {
              name: i18n.__({ phrase: 'verify.list.confirmedVerificationFor', locale }, { stakeShort }),
              value: confirmationText,
            };
          }));
        }
        const components = [];
        const outstandingVerifications = relevantVerifications.filter((verification) => !verification.confirmed);
        if (outstandingVerifications.length) {
          verificationInfoFields.push({
            name: i18n.__({ phrase: 'verify.list.outstandingVerifications', locale }),
            value: outstandingVerifications.map((verification) => i18n.__({ phrase: 'verify.list.outstandingData', locale }, { verification, amount: verification.amount / 1000000 } as any)).join('\n\n'),
          });
          components.push(new ActionRowBuilder<MessageActionRowComponentBuilder>()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('verify/list/canceloutstanding')
                .setLabel(i18n.__({ phrase: 'verify.list.cancelOutstanding', locale }))
                .setStyle(ButtonStyle.Danger),
            ));
        }
        const embed = embedBuilder.buildForUserWithAd(externalAccount, discordServer, i18n.__({ phrase: 'verify.list.messageTitle', locale }), i18n.__({ phrase: 'verify.list.listVerificationsInfo', locale }), 'verify-list', verificationInfoFields);
        await interaction.editReply({ components, embeds: [embed] });
      } else {
        const embed = embedBuilder.buildForUserWithAd(externalAccount, discordServer, i18n.__({ phrase: 'verify.list.messageTitle', locale }), i18n.__({ phrase: 'verify.list.noVerifications', locale }), 'verify-list', verificationInfoFields);
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting your verification info.' });
    }
  },
  async executeButton(interaction) {
    if (interaction.customId === 'verify/list/canceloutstanding') {
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
      const verifications = await interaction.client.services.externalaccounts.getActiveVerificationsForExternalAccount(externalAccount.id);
      const outstandingVerifications = verifications.filter((verification) => !verification.confirmed && !verification.obsolete);
      outstandingVerifications.forEach((outstandingVerification) => interaction.client.services.verifications.removeVerification(outstandingVerification.id!));
      await interaction.update({ components: [] });
      const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'generic.cancel', locale }), i18n.__({ phrase: 'verify.list.cancelSuccess', locale }, { address: outstandingVerifications[0].address }), 'verify-list');
      await interaction.followUp({ embeds: [embed], ephemeral: true });
    }
  },
};