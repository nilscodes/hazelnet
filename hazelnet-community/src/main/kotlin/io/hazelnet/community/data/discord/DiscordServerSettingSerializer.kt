package io.hazelnet.community.data.discord

import com.fasterxml.jackson.core.JsonGenerator
import com.fasterxml.jackson.databind.SerializerProvider
import com.fasterxml.jackson.databind.ser.std.StdSerializer
import java.io.IOException

class DiscordServerSettingSerializer : StdSerializer<Set<DiscordServerSetting>>(setOf<DiscordServerSetting>().javaClass) {

    @Throws(IOException::class)
    override fun serialize(discordServerSettings: Set<DiscordServerSetting>, jsonGenerator: JsonGenerator, serializerProvider: SerializerProvider) {
        jsonGenerator.writeStartObject()
        for (discordServerSetting in discordServerSettings) {
            jsonGenerator.writeStringField(discordServerSetting.name, discordServerSetting.value)
        }
        jsonGenerator.writeEndObject()
    }
}