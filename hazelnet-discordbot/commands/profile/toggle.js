const i18n = require('i18n');
const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const embedBuilder = require('../../utility/embedbuilder');

module.exports = {
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
      const mainAccount = await interaction.client.services.externalaccounts.getAccountForExternalAccount(externalAccount.id);
      const profileFields = this.getProfileFields(mainAccount.settings, locale);
      const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'profile.toggle.messageTitle', locale }), i18n.__({ phrase: 'profile.toggle.purpose', locale }), 'profile', profileFields);
      const components = this.getSelectMenu(mainAccount.settings, locale);
      await interaction.editReply({ components, embeds: [embed], ephemeral: true });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ guildId: interaction.guild.id, content: 'Error while pinging user. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
  getProfileFields(accountSettings, locale) {
    return this.getToggleSettings().map((setting) => {
      const currentValue = accountSettings[setting.name] !== undefined ? accountSettings[setting.name] === 'true' : setting.default;
      return {
        name: i18n.__({ phrase: `profile.toggle.${setting.name}`, locale }),
        value: `${i18n.__({ phrase: `profile.toggle.${setting.name}_${currentValue ? 'on' : 'off'}`, locale })}\n\n${i18n.__({ phrase: `profile.toggle.${setting.name}_info`, locale })}`,
      };
    });
  },
  getToggleSettings() {
    return [{
      name: 'OPTION_RECEIVEPINGS',
      default: true,
    }];
  },
  getSelectMenu(accountSettings, locale) {
    return [new MessageActionRow()
      .addComponents(
        new MessageSelectMenu()
          .setCustomId('profile/toggle/complete')
          .setPlaceholder(i18n.__({ phrase: 'profile.toggle.chooseSetting', locale }))
          .addOptions(this.getToggleSettings().map((setting) => {
            const currentValue = accountSettings[setting.name] !== undefined ? accountSettings[setting.name] === 'true' : setting.default;
            return {
              label: i18n.__({ phrase: `profile.toggle.${currentValue ? 'turnOff' : 'turnOn'}`, locale }, { option: i18n.__({ phrase: `profile.toggle.${setting.name}`, locale }) }),
              value: `${setting.name}-${currentValue ? 'false' : 'true'}`,
            };
          })),
      )];
  },
  async executeSelectMenu(interaction) {
    if (interaction.customId === 'profile/toggle/complete') {
      const [settingName, settingValue] = interaction.values[0].split('-');
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
      const mainAccount = await interaction.client.services.externalaccounts.getAccountForExternalAccount(externalAccount.id);
      await interaction.client.services.accounts.updateAccountSetting(mainAccount.id, settingName, settingValue);
      mainAccount.settings[settingName] = settingValue;
      const profileFields = this.getProfileFields(mainAccount.settings, locale);
      const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'profile.toggle.messageTitle', locale }), i18n.__({ phrase: 'profile.toggle.purpose', locale }), 'profile', profileFields);
      const components = this.getSelectMenu(mainAccount.settings, locale);
      await interaction.update({ components, embeds: [embed], ephemeral: true });
    }
  },
};
