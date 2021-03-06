const i18n = require('i18n');
const embedBuilder = require('../../utility/embedbuilder');
const tokenroles = require('../../utility/tokenroles');

module.exports = {
  async execute(interaction) {
    const tokenRoleId = interaction.options.getInteger('token-role-id');
    const attributeName = interaction.options.getString('attribute-path');
    const operator = interaction.options.getString('operator');
    const attributeValue = interaction.options.getString('attribute-value');
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      const tokenRoleToAddFilterTo = discordServer.tokenRoles.find((tokenRole) => tokenRole.id === tokenRoleId);
      if (tokenRoleToAddFilterTo) {
        const maxFiltersPerTokenRole = await interaction.client.services.globalsettings.getGlobalSetting('MAX_FILTERS_PER_TOKEN_ROLE') || 3;
        if (!tokenRoleToAddFilterTo.filters || tokenRoleToAddFilterTo.filters.length < maxFiltersPerTokenRole) {
          if (attributeName.length <= 64) {
            if (attributeValue.length <= 128) {
              const newMetadataFilter = await interaction.client.services.discordserver.addTokenRoleMetadataFilter(interaction.guild.id, tokenRoleToAddFilterTo.id, attributeName, operator, attributeValue);
              const effectiveFilters = [...(tokenRoleToAddFilterTo.filters ?? []), newMetadataFilter];
              tokenRoleToAddFilterTo.filters = effectiveFilters;
              const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles metadatafilter add', i18n.__({ phrase: 'configure.tokenroles.details.purpose', locale }), 'configure-tokenroles-metadatafilter-add', [
                tokenroles.getTokenRoleDetailsText(tokenRoleToAddFilterTo, discordServer, locale, true),
              ]);
              await interaction.editReply({ embeds: [embed], ephemeral: true });
            } else {
              const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles metadatafilter add', i18n.__({ phrase: 'configure.tokenroles.metadatafilter.add.errorAttributeValueLength', locale }, { maxLength: 128 }), 'configure-tokenroles-metadatafilter-add');
              await interaction.editReply({ embeds: [embed], ephemeral: true });
            }
          } else {
            const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles metadatafilter add', i18n.__({ phrase: 'configure.tokenroles.metadatafilter.add.errorAttributeNameLength', locale }, { maxLength: 64 }), 'configure-tokenroles-metadatafilter-add');
            await interaction.editReply({ embeds: [embed], ephemeral: true });
          }
        } else {
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles metadatafilter add', i18n.__({ phrase: 'configure.tokenroles.metadatafilter.add.errorLimitReached', locale }, { tokenRoleId }), 'configure-tokenroles-metadatafilter-add');
          await interaction.editReply({ embeds: [embed], ephemeral: true });
        }
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles metadatafilter add', i18n.__({ phrase: 'configure.tokenroles.list.errorNotFound', locale }, { tokenRoleId }), 'configure-tokenroles-metadatafilter-add');
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: `Error while adding metadata filter to auto-role assignment for role with ID ${tokenRoleId} on your server. Please contact your bot admin via https://www.hazelnet.io.`, ephemeral: true });
    }
  },
};
