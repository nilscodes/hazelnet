const NodeCache = require('node-cache');
const i18n = require('i18n');
const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const embedBuilder = require('../../utility/embedbuilder');
const whitelistUtil = require('../../utility/whitelist');
const adahandle = require('../../utility/adahandle');
const cardanoaddress = require('../../utility/cardanoaddress');

module.exports = {
  cache: new NodeCache({ stdTTL: 900 }),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
    const useLocale = discordServer.getBotLanguage();
    try {
      const addressOrHandle = interaction.options.getString('address-or-handle');
      let addressToWhitelist = null;
      let handle = null;
      if (adahandle.isHandle(addressOrHandle)) {
        handle = addressOrHandle;
        addressToWhitelist = await interaction.client.services.cardanoinfo.resolveHandle(handle);
      } else {
        addressToWhitelist = addressOrHandle;
      }

      const cardanoAddress = /^addr1[a-zA-Z0-9]{10,100}$/;
      if (cardanoAddress.test(addressToWhitelist)) {
        const externalAccount = await interaction.client.services.externalaccounts.getExternalDiscordAccount(interaction.user.id);
        const signups = await whitelistUtil.getExistingSignups(externalAccount, discordServer, interaction);
        const signupsText = this.getSignupsText(signups, discordServer);

        if (discordServer.premium) {
          const whitelistsAllowedPromises = discordServer.whitelists.map((whitelist) => {
            const existingSignup = signups.find((signup) => signup?.whitelistId === whitelist.id);
            return whitelistUtil.userQualifies(interaction, whitelist, existingSignup);
          });
          const whitelistsAllowed = await Promise.all(whitelistsAllowedPromises);
          const whitelistOptions = discordServer.whitelists.filter((_, index) => (whitelistsAllowed[index])).map((whitelist) => ({ label: whitelist.displayName, value: whitelist.name }));
          if (whitelistOptions.length) {
            // Register address in cache, as we cannot send it along with the menu data.
            this.cache.set(`${interaction.guild.id}-${interaction.user.id}`, addressToWhitelist);

            const components = [new MessageActionRow()
              .addComponents(
                new MessageSelectMenu()
                  .setCustomId('whitelist/register/complete')
                  .setPlaceholder(i18n.__({ phrase: 'whitelist.register.chooseWhitelist', locale: useLocale }))
                  .addOptions(whitelistOptions),
              )];

            const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'whitelist.register.messageTitle', locale: useLocale }), `${signupsText}${i18n.__({ phrase: 'whitelist.register.purpose', locale: useLocale })}`, 'whitelist-register');
            await interaction.editReply({ components, embeds: [embed], ephemeral: true });
          } else {
            const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'whitelist.register.messageTitle', locale: useLocale }), `${signupsText}${i18n.__({ phrase: 'whitelist.register.noOpenWhitelists', locale: useLocale })}`, 'whitelist-register');
            await interaction.editReply({ embeds: [embed], ephemeral: true });
          }
        } else {
          const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'whitelist.register.messageTitle', locale: useLocale }), i18n.__({ phrase: 'whitelist.register.noPremium', locale: useLocale }), 'whitelist-register');
          await interaction.editReply({ embeds: [embed], ephemeral: true });
        }
      } else {
        const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'whitelist.register.messageTitle', locale: useLocale }), i18n.__({ phrase: 'whitelist.register.invalidAddress', locale: useLocale }, {
          address: addressToWhitelist,
          blockchain: 'Cardano',
          example: 'addr1qxqhukr5nhsa0qm7uj9zv6h9xvf698m5u9k8gh8wl3mpetsfuzpzq2vy24qehs92d4zlz8af96c8tzcukkzarqfa0q8s7t255v',
        }), 'whitelist-register');
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'whitelist.register.messageTitle', locale: useLocale }), i18n.__({ phrase: 'whitelist.register.otherError', locale: useLocale }), 'whitelist-register');
      await interaction.editReply({ embeds: [embed], ephemeral: true });
    }
  },
  async executeSelectMenu(interaction) {
    await interaction.deferUpdate();
    const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
    const locale = discordServer.getBotLanguage();
    if (interaction.customId === 'whitelist/register/complete') {
      try {
        const addressToWhitelist = this.cache.take(`${interaction.guild.id}-${interaction.user.id}`);
        const whitelistName = interaction.values[0];
        if (addressToWhitelist) {
          const whitelistToRegisterFor = discordServer.whitelists.find((whitelist) => whitelist.name === whitelistName);
          if (whitelistToRegisterFor) {
            const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
            await interaction.client.services.discordserver.registerForWhitelist(interaction.guild.id, whitelistToRegisterFor.id, externalAccount.id, addressToWhitelist);
            const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'whitelist.register.messageTitle', locale }), i18n.__({ phrase: 'whitelist.register.success', locale }, { whitelist: whitelistToRegisterFor, address: addressToWhitelist }), 'whitelist-register');
            await interaction.editReply({ components: [], embeds: [embed], ephemeral: true });
          } else {
            const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'whitelist.register.messageTitle', locale }), i18n.__({ phrase: 'whitelist.register.errorNotFound', locale }, { whitelistName }), 'whitelist-register');
            await interaction.editReply({ components: [], embeds: [embed], ephemeral: true });
          }
        } else {
          interaction.client.logger.warn(`Address for user ${interaction.user.id} expired when registering for whitelist ${whitelistName} on Discord server ${discordServer.guildId}`);
          const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'whitelist.register.messageTitle', locale }), i18n.__({ phrase: 'whitelist.register.otherError', locale }), 'whitelist-register');
          await interaction.editReply({ components: [], embeds: [embed], ephemeral: true });
        }
      } catch (error) {
        interaction.client.logger.error(error);
        const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'whitelist.register.messageTitle', locale }), i18n.__({ phrase: 'whitelist.register.otherError', locale }), 'whitelist-register');
        await interaction.editReply({ components: [], embeds: [embed], ephemeral: true });
      }
    } else if (interaction.customId === 'whitelist/register/widget') {
      const [whitelistId, verificationId] = interaction.values[0].split('-');
      const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
      const whitelistToRegisterFor = discordServer.whitelists.find((whitelist) => whitelist.id === +whitelistId);
      const existingVerifications = await interaction.client.services.externalaccounts.getActiveVerificationsForExternalAccount(externalAccount.id);
      const verificationToUse = existingVerifications.find((verification) => verification.confirmed && !verification.obsolete && verification.id === +verificationId);
      if (verificationToUse && whitelistToRegisterFor) {
        await interaction.client.services.discordserver.registerForWhitelist(interaction.guild.id, whitelistToRegisterFor.id, externalAccount.id, verificationToUse.address);
        const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'whitelist.register.messageTitle', locale }), i18n.__({ phrase: 'whitelist.register.success', locale }, { whitelist: whitelistToRegisterFor, address: verificationToUse.address }), 'whitelist-register');
        await interaction.editReply({ components: [], embeds: [embed], ephemeral: true });
      }
    }
  },
  getSignupsText(signups, discordServer) {
    const useLocale = discordServer.getBotLanguage();
    let signupsText = '';
    const confirmedSignups = signups.filter((signup) => (!!signup));
    if (confirmedSignups.length) {
      signupsText = `${i18n.__({ phrase: 'whitelist.register.signedupFor', locale: useLocale })}\n\n`;
      signupsText += confirmedSignups.map((signup) => {
        const whiteListForSignup = discordServer.whitelists.find((whitelist) => (signup.whitelistId === whitelist.id));
        return i18n.__({ phrase: 'whitelist.register.signedupForEntry', locale: useLocale }, { whitelist: whiteListForSignup });
      }).join('\n');
      signupsText += '\n\n';
    }
    return signupsText;
  },
  async executeButton(interaction) {
    if (interaction.customId.indexOf('whitelist/register/widgetsignup-') === 0) {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
      await interaction.client.services.discordserver.connectExternalAccount(interaction.guild.id, externalAccount.id);
      const whitelistId = +interaction.customId.split('-')[1];
      const signups = await whitelistUtil.getExistingSignups(externalAccount, discordServer, interaction);
      const whitelistToRegisterFor = discordServer.whitelists.find((whitelist) => whitelist.id === whitelistId);
      if (whitelistToRegisterFor) {
        const existingSignup = signups.find((signup) => signup?.whitelistId === whitelistToRegisterFor.id);
        const titlePhrase = existingSignup ? 'whitelist.register.alreadyRegisteredTitle' : 'whitelist.register.messageTitle';
        const userQualifiesForWhitelist = await whitelistUtil.userQualifies(interaction, whitelistToRegisterFor, false);
        const existingVerifications = await interaction.client.services.externalaccounts.getActiveVerificationsForExternalAccount(externalAccount.id);
        const existingConfirmedVerifications = existingVerifications.filter((verification) => verification.confirmed && !verification.obsolete);
        if (!existingSignup && !userQualifiesForWhitelist) {
          const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: titlePhrase, locale }), i18n.__({ phrase: 'whitelist.register.userDoesNotQualify', locale }, { whitelist: whitelistToRegisterFor }), 'whitelist-register');
          await interaction.editReply({ embeds: [embed], ephemeral: true });
        } else if (existingSignup && !userQualifiesForWhitelist) {
          const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: titlePhrase, locale }), i18n.__({ phrase: 'whitelist.register.success', locale }, { whitelist: whitelistToRegisterFor, address: existingSignup.signup.address }), 'whitelist-register');
          await interaction.editReply({ embeds: [embed], ephemeral: true });
        } else if (existingConfirmedVerifications.length) {
          const stakeAddressesToHandles = await adahandle.getHandleMapFromStakeAddresses(interaction.client.services.cardanoinfo, existingConfirmedVerifications.map((verification) => verification.cardanoStakeAddress));
          const registerOptions = existingConfirmedVerifications.map((verification) => {
            const handleForStakeAddress = stakeAddressesToHandles.find((handleForStake) => handleForStake.handle.resolved && handleForStake.stakeAddress === verification.cardanoStakeAddress);
            return {
              label: handleForStakeAddress ? `$${handleForStakeAddress.handle.handle}` : `${cardanoaddress.shorten(verification.address)} (${cardanoaddress.shorten(verification.cardanoStakeAddress)})`,
              value: `${whitelistId}-${verification.id}`,
            };
          });

          const components = !userQualifiesForWhitelist ? [] : [new MessageActionRow()
            .addComponents(
              new MessageSelectMenu()
                .setCustomId('whitelist/register/widget')
                .setPlaceholder(i18n.__({ phrase: 'whitelist.register.chooseAddressToWhitelist', locale }))
                .addOptions(registerOptions),
            )];
          const registerPhrase = existingSignup ? 'whitelist.register.widgetSelectAddressAlreadyRegistered' : 'whitelist.register.widgetSelectAddress';

          const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: titlePhrase, locale }), i18n.__({ phrase: registerPhrase, locale }, {
            whitelist: whitelistToRegisterFor,
            signupTime: existingSignup ? new Date(existingSignup.signup.signupTime).toISOString().replace(/\.[0-9]{3}Z/, '').replace('T', ' ') : '',
            addressShort: existingSignup ? cardanoaddress.shorten(existingSignup.signup.address) : '',
          }), 'whitelist-register');
          await interaction.editReply({ embeds: [embed], components, ephemeral: true });
        } else {
          const registerPhrase = existingSignup ? 'whitelist.register.widgetNotVerifiedAlreadyRegistered' : 'whitelist.register.widgetNotVerified';
          const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: titlePhrase, locale }), i18n.__({ phrase: registerPhrase, locale }, {
            whitelist: whitelistToRegisterFor,
            signupTime: existingSignup ? new Date(existingSignup.signup.signupTime).toISOString().replace(/\.[0-9]{3}Z/, '').replace('T', ' ') : '',
            addressShort: existingSignup ? cardanoaddress.shorten(existingSignup.signup.address) : '',
          }), 'whitelist-register');
          await interaction.editReply({ embeds: [embed], ephemeral: true });
        }
      } else {
        const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'whitelist.register.messageTitle', locale }), i18n.__({ phrase: 'whitelist.register.errorNotFound', locale }, { whitelistName: whitelistId }), 'whitelist-register');
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      }
    }
  },
};
