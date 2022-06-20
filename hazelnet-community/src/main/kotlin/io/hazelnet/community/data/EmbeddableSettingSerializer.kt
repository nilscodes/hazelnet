package io.hazelnet.community.data

import com.fasterxml.jackson.core.JsonGenerator
import com.fasterxml.jackson.databind.SerializerProvider
import com.fasterxml.jackson.databind.ser.std.StdSerializer
import java.io.IOException

class EmbeddableSettingSerializer : StdSerializer<Set<EmbeddableSetting>>(setOf<EmbeddableSetting>().javaClass) {

    @Throws(IOException::class)
    override fun serialize(embeddableSettings: Set<EmbeddableSetting>, jsonGenerator: JsonGenerator, serializerProvider: SerializerProvider) {
        jsonGenerator.writeStartObject()
        for (discordServerSetting in embeddableSettings) {
            jsonGenerator.writeStringField(discordServerSetting.name, discordServerSetting.value)
        }
        jsonGenerator.writeEndObject()
    }
}