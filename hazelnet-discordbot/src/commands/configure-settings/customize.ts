import i18n from 'i18n';
import { BotSubcommand } from '../../utility/commandtypes';
const colors = require('../../utility/colors');
const embedBuilder = require('../../utility/embedbuilder');

interface ConfigureSettingsCustomizeCommand extends BotSubcommand {
  isValidUrl(message: string): boolean
}

export default <ConfigureSettingsCustomizeCommand> {
  async execute(interaction) {
    const element = interaction.options.getString('element', true);
    let customizationValue = interaction.options.getString('customization-value', true);
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      if (discordServer.premium) {
        let errorMessage = false as string | boolean;
        switch (element) {
          case 'THEME_TOP_LOGO':
          case 'THEME_FOOTER_ICON':
          case 'THEME_AUTHOR_ICON':
          case 'INFO_CONTENT_IMAGE':
            if (!this.isValidUrl(customizationValue)) {
              errorMessage = 'invalidUrl';
            }
            break;
          case 'THEME_COLOR_USER':
            customizationValue = colors.transformColor(customizationValue);
            if (!colors.isValidHexColor(customizationValue)) {
              errorMessage = 'invalidColor';
            }
            break;
          case 'THEME_AUTHOR_NAME':
          case 'THEME_FOOTER_TEXT':
          case 'INFO_CONTENT_TITLE':
            if (customizationValue.length > 100) {
              errorMessage = 'textTooLongTitle';
            }
            break;
          case 'INFO_CONTENT_TEXT':
            if (customizationValue.length > 4000) {
              errorMessage = 'textTooLongInfo';
            }
            break;
          case 'RESET':
            if (customizationValue !== 'YES') {
              errorMessage = 'incorrectConfirmation';
            }
            break;
          default:
            errorMessage = 'unknownElement';
            break;
        }
        if (errorMessage === false) {
          if (element === 'RESET') {
            const settingsToDelete = ['THEME_TOP_LOGO', 'THEME_FOOTER_ICON', 'THEME_AUTHOR_ICON', 'INFO_CONTENT_IMAGE', 'THEME_COLOR_USER', 'THEME_AUTHOR_NAME', 'THEME_FOOTER_TEXT', 'INFO_CONTENT_TITLE', 'INFO_CONTENT_TEXT'];
            for (let i = 0, len = settingsToDelete.length; i < len; i += 1) {
              const elementToReset = settingsToDelete[i];
              // eslint-disable-next-line no-await-in-loop
              await interaction.client.services.discordserver.deleteDiscordServerSetting(interaction.guild!.id, elementToReset);
              delete discordServer.settings[elementToReset];
            }
          } else {
            await interaction.client.services.discordserver.updateDiscordServerSetting(interaction.guild!.id, element, customizationValue);
            discordServer.settings[element] = customizationValue;
          }
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-settings customize', i18n.__({ phrase: 'configure.settings.customize.success', locale }), 'configure-settings-customize');
          await interaction.editReply({ embeds: [embed] });
          const sampleFields = [{
            name: i18n.__({ phrase: 'configure.settings.customize.sampleTitle', locale }),
            value: i18n.__({ phrase: 'configure.settings.customize.sampleContent', locale }),
          }];
          const infoTitle = discordServer.settings?.INFO_CONTENT_TITLE ?? i18n.__({ phrase: 'info.welcomeTitle', locale }, { guildName: interaction.guild!.name });
          const infoText = discordServer.settings?.INFO_CONTENT_TEXT ?? i18n.__({ phrase: 'info.infoBaseText', locale });
          const infoImage = discordServer.settings?.INFO_CONTENT_IMAGE;
          const sampleEmbed = embedBuilder.buildForUser(discordServer, infoTitle, infoText, 'configure-settings-customize', sampleFields, infoImage);
          await interaction.followUp({ embeds: [sampleEmbed], ephemeral: true });
        } else {
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-settings customize', i18n.__({ phrase: `configure.settings.customize.${errorMessage}`, locale }, { element }), 'configure-settings-customize');
          await interaction.editReply({ embeds: [embed] });
        }
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-settings customize', i18n.__({ phrase: 'configure.settings.customize.noPremium', locale }), 'configure-settings-customize');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while customizing bot. Please contact your bot admin via https://www.hazelnet.io.' });
    }
  },
  isValidUrl(url) {
    const httpUrlRegex = /(((https?:(?:\/\/)?)(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+|(?:www\.|[-;:&=+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%/.\w\-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[.!/\\\w]*))?)/;
    return httpUrlRegex.test(url);
  },
};
