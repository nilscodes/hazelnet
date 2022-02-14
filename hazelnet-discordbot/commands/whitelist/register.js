const NodeCache = require('node-cache');
const i18n = require('i18n');
const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const embedBuilder = require('../../utility/embedbuilder');
const whitelistUtil = require('../../utility/whitelist');

module.exports = {
  cache: new NodeCache({ stdTTL: 900 }),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
    const useLocale = discordServer.getBotLanguage();
    try {
      const addressToWhitelist = interaction.options.getString('address');
      const cardanoAddress = /^addr1[a-zA-Z0-9]{10,100}$/;
      if (cardanoAddress.test(addressToWhitelist)) {
        const externalAccount = await interaction.client.services.externalaccounts.getExternalDiscordAccount(interaction.user.id);
        const signups = await whitelistUtil.getExistingSignups(externalAccount, discordServer, interaction);
        const signupsText = this.getSignupsText(signups, discordServer);

        const whitelistsAllowedPromises = discordServer.whitelists.map((whitelist) => {
          const existingSignup = signups.find((signup) => signup?.whitelistId === whitelist.id);
          return whitelistUtil.userQualifies(interaction, whitelist, existingSignup);
        });
        const whitelistsAllowed = await Promise.all(whitelistsAllowedPromises);
        const whitelistOptions = discordServer.whitelists.filter((v, index) => (whitelistsAllowed[index])).map((whitelist) => ({ label: whitelist.displayName, value: whitelist.name }));
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
        const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'whitelist.register.messageTitle', locale: useLocale }), i18n.__({ phrase: 'whitelist.register.invalidAddress', locale: useLocale }, { address: addressToWhitelist, blockchain: 'Cardano' }), 'whitelist-register');
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'whitelist.register.messageTitle', locale: useLocale }), i18n.__({ phrase: 'whitelist.register.otherError', locale: useLocale }), 'whitelist-register');
      await interaction.editReply({ embeds: [embed], ephemeral: true });
    }
  },
  async executeSelectMenu(interaction) {
    if (interaction.customId === 'whitelist/register/complete') {
      await interaction.deferUpdate();
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const useLocale = discordServer.getBotLanguage();
      try {
        const addressToWhitelist = this.cache.take(`${interaction.guild.id}-${interaction.user.id}`);
        const whitelistName = interaction.values[0];
        if (addressToWhitelist) {
          const whitelistToRegisterFor = discordServer.whitelists.find((whitelist) => whitelist.name === whitelistName);
          if (whitelistToRegisterFor) {
            const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
            await interaction.client.services.discordserver.registerForWhitelist(interaction.guild.id, whitelistToRegisterFor.id, externalAccount.id, addressToWhitelist);
            const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'whitelist.register.messageTitle', locale: useLocale }), i18n.__({ phrase: 'whitelist.register.success', locale: useLocale }, { whitelist: whitelistToRegisterFor, address: addressToWhitelist }), 'whitelist-register');
            await interaction.editReply({ components: [], embeds: [embed], ephemeral: true });
          } else {
            const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'whitelist.register.messageTitle', locale: useLocale }), i18n.__({ phrase: 'whitelist.register.errorNotFound', locale: useLocale }, { whitelistName }), 'whitelist-register');
            await interaction.editReply({ components: [], embeds: [embed], ephemeral: true });
          }
        } else {
          interaction.client.logger.warn(`Address for user ${interaction.user.id} expired when registering for whitelist ${whitelistName} on Discord server ${discordServer.guildId}`);
          const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'whitelist.register.messageTitle', locale: useLocale }), i18n.__({ phrase: 'whitelist.register.otherError', locale: useLocale }), 'whitelist-register');
          await interaction.editReply({ components: [], embeds: [embed], ephemeral: true });
        }
      } catch (error) {
        interaction.client.logger.error(error);
        const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'whitelist.register.messageTitle', locale: useLocale }), i18n.__({ phrase: 'whitelist.register.otherError', locale: useLocale }), 'whitelist-register');
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
};
