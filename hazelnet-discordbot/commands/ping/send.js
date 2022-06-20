const i18n = require('i18n');
const adahandle = require('../../utility/adahandle');
const cardanoaddress = require('../../utility/cardanoaddress');
const cardanotoken = require('../../utility/cardanotoken');
const embedBuilder = require('../../utility/embedbuilder');

module.exports = {
  async execute(interaction) {
    const pingType = interaction.options.getString('ping-type');
    const target = interaction.options.getString('target');
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      let errorMessage = false;
      switch (pingType) {
        case 'PING_TYPE_HANDLE':
          if (!adahandle.isHandle(target)) {
            errorMessage = 'invalidHandle';
          }
          break;
        case 'PING_TYPE_NFT':
          if (!cardanotoken.isValidAssetFingerprint(target)) {
            errorMessage = 'invalidAssetFingerprint';
          }
          break;
        case 'PING_TYPE_ADDRESS':
          if (!cardanoaddress.isWalletAddress(target) && !cardanoaddress.isStakeAddress(target)) {
            errorMessage = 'invalidAddress';
          }
          break;
        default:
          errorMessage = 'unknownPingType';
          break;
      }
      if (errorMessage === false) {
        // PING MAGIC await interaction.client.services.discordserver.updateDiscordServerSetting(interaction.guild.id, pingType, target);
        const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'ping.send.messageTitle', locale }), i18n.__({ phrase: 'ping.send.purpose', locale }), 'ping');
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      } else {
        const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'ping.send.messageTitle', locale }), i18n.__({ phrase: `ping.send.${errorMessage}`, locale }, { target }), 'ping');
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ guildId: interaction.guild.id, content: 'Error while pinging user. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
};
