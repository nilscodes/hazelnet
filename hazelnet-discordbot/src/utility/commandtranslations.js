const i18n = require('i18n');

function CommandTranslations(commandName, locale) {
  this.commandName = commandName;
  this.locale = locale;
}

CommandTranslations.prototype = {
  description() {
    return i18n.__({ phrase: `commands.descriptions.${this.commandName}`, locale: this.locale }).substring(0, 100);
  },
  subDescription(subCommand) {
    return i18n.__({ phrase: `commands.descriptions.${this.commandName}-${subCommand}`, locale: this.locale }).substring(0, 100);
  },
  option(optionName) {
    return i18n.__({ phrase: `commands.options.${this.commandName}.${optionName}`, locale: this.locale }).substring(0, 100);
  },
  choice(choiceName) {
    return i18n.__({ phrase: `commands.choices.${this.commandName}.${choiceName}`, locale: this.locale }).substring(0, 100);
  },
};

module.exports = CommandTranslations;
