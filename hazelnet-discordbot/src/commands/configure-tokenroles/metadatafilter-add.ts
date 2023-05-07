import i18n from 'i18n';
import { AttributeOperatorType } from '@vibrantnet/core';
import { BotSubcommand } from '../../utility/commandtypes';
import tokenroles from '../../utility/tokenroles';
import embedBuilder from '../../utility/embedbuilder';

export default <BotSubcommand> {
  async execute(interaction) {
    const tokenRoleId = interaction.options.getInteger('token-role-id', true);
    const attributeName = interaction.options.getString('attribute-path', true);
    const operator = interaction.options.getString('operator', true) as AttributeOperatorType;
    const attributeValue = interaction.options.getString('attribute-value', true);
    const tokenWeight = interaction.options.getInteger('token-weight') ?? 1;
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const tokenRoles = await interaction.client.services.discordserver.listTokenOwnershipRoles(interaction.guild!.id);
      const tokenPolicies = await interaction.client.services.discordserver.listTokenPolicies(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      const tokenRoleToAddFilterTo = tokenRoles.find((tokenRole) => tokenRole.id === tokenRoleId);
      if (tokenRoleToAddFilterTo) {
        const maxFiltersPerTokenRole = +(discordServer.settings?.MAX_FILTERS_PER_TOKEN_ROLE ?? 3);
        if (!tokenRoleToAddFilterTo.filters || tokenRoleToAddFilterTo.filters.length < maxFiltersPerTokenRole) {
          if (attributeName.length <= 64) {
            if (attributeValue.length <= 128) {
              const newMetadataFilter = await interaction.client.services.discordserver.addTokenRoleMetadataFilter(interaction.guild!.id, tokenRoleToAddFilterTo.id, attributeName, operator, attributeValue, tokenWeight);
              const effectiveFilters = [...(tokenRoleToAddFilterTo.filters ?? []), newMetadataFilter];
              tokenRoleToAddFilterTo.filters = effectiveFilters;
              const embed = embedBuilder.buildForAdmin(
                discordServer,
                '/configure-tokenroles metadatafilter add',
                i18n.__({ phrase: 'configure.tokenroles.details.purpose', locale }),
                'configure-tokenroles-metadatafilter-add',
                tokenroles.getTokenRoleDetailsFields(tokenRoleToAddFilterTo, tokenPolicies, locale, true),
              );
              await interaction.editReply({ embeds: [embed] });
            } else {
              const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles metadatafilter add', i18n.__({ phrase: 'configure.tokenroles.metadatafilter.add.errorAttributeValueLength', locale }, { maxLength: `128` }), 'configure-tokenroles-metadatafilter-add');
              await interaction.editReply({ embeds: [embed] });
            }
          } else {
            const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles metadatafilter add', i18n.__({ phrase: 'configure.tokenroles.metadatafilter.add.errorAttributeNameLength', locale }, { maxLength: `64` }), 'configure-tokenroles-metadatafilter-add');
            await interaction.editReply({ embeds: [embed] });
          }
        } else {
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles metadatafilter add', i18n.__({ phrase: 'configure.tokenroles.metadatafilter.add.errorLimitReached', locale }), 'configure-tokenroles-metadatafilter-add');
          await interaction.editReply({ embeds: [embed] });
        }
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles metadatafilter add', i18n.__({ phrase: 'configure.tokenroles.list.errorNotFound', locale }, { tokenRoleId } as any), 'configure-tokenroles-metadatafilter-add');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: `Error while adding metadata filter to auto-role assignment for role with ID ${tokenRoleId} on your server. Please contact your bot admin via https://www.hazelnet.io.` });
    }
  },
};
