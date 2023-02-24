import { PermissionsBitField } from "discord.js";

export default {
  hasBasicEmbedSendPermissions(permissions: Readonly<PermissionsBitField> | null) {
    return permissions
      && permissions.has(PermissionsBitField.Flags.SendMessages)
      && permissions.has(PermissionsBitField.Flags.ViewChannel)
      && permissions.has(PermissionsBitField.Flags.EmbedLinks);
  },
  hasBasicEmbedSendAndAttachPermissions(permissions: Readonly<PermissionsBitField> | null) {
    return permissions
      && permissions.has(PermissionsBitField.Flags.SendMessages)
      && permissions.has(PermissionsBitField.Flags.ViewChannel)
      && permissions.has(PermissionsBitField.Flags.EmbedLinks)
      && permissions.has(PermissionsBitField.Flags.AttachFiles);
  },
}