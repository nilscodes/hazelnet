import i18n from 'i18n';

export default class CommandTranslations {
  commandName: string
  locale: string
  constructor(commandName: string, locale: string) {
    this.commandName = commandName;
    this.locale = locale;
  }
  description() {
    return i18n.__({ phrase: `commands.descriptions.${this.commandName}`, locale: this.locale }).substring(0, 100);
  }
  subDescription(subCommand: string) {
    return i18n.__({ phrase: `commands.descriptions.${this.commandName}-${subCommand}`, locale: this.locale }).substring(0, 100);
  }
  option(optionName: string) {
    return i18n.__({ phrase: `commands.options.${this.commandName}.${optionName}`, locale: this.locale }).substring(0, 100);
  }
  choice(choiceName: string) {
    return i18n.__({ phrase: `commands.choices.${this.commandName}.${choiceName}`, locale: this.locale }).substring(0, 100);
  }
};
