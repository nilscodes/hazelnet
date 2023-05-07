import { ActionRowBuilder, APIEmbed, APIEmbedField, MessageActionRowComponentBuilder } from "discord.js"

export type EmbedAndComponents = {
    embed: APIEmbed
    components: ActionRowBuilder<MessageActionRowComponentBuilder>[]
}

export type EmbedFieldsAndComponents = {
    detailFields: APIEmbedField[]
    components: ActionRowBuilder<MessageActionRowComponentBuilder>[]
}
