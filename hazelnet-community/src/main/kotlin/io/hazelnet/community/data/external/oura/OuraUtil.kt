package io.hazelnet.community.data.external.oura

import java.nio.charset.StandardCharsets

fun processNestedMap(map: Map<String, Any>): Map<String, Any> {
    return map.mapValues { (_, value) ->
        when (value) {
            is Map<*, *> -> processNestedMap(value as Map<String, Any>)
            is List<*> -> value.map { processListItem(it) }
            else -> value
        }
    }
}

fun processListItem(item: Any?): Any? {
    return when (item) {
        is Map<*, *> -> {
            when {
                item.containsKey("k") && item.containsKey("v") -> {
                    val key = convertBytesToUtf8((item["k"] as Map<*, *>)["bytes"] as String)
                    val valueMap = item["v"] as Map<*, *>
                    val value = valueMap["bytes"]?.let { convertBytesToUtf8(it as String) } ?: valueMap["int"]
                    key to value
                }
                item.containsKey("map") -> {
                    val resultMap = mutableMapOf<String, Any?>()
                    val mapItems = item["map"] as List<*>
                    mapItems.forEach { mapItem ->
                        val (key, value) = processListItem(mapItem) as Pair<String, Any>
                        resultMap[key] = value
                    }
                    resultMap
                }
                item.containsKey("int") -> item["int"]
                item.containsKey("constructor") -> item["constructor"]
                else -> processNestedMap(item as Map<String, Any>)
            }
        }
        is List<*> -> item.map { processListItem(it) }
        else -> item
    }
}

fun convertBytesToUtf8(bytes: String): String {
    val byteArray = bytes.chunked(2).map { it.toInt(16).toByte() }.toByteArray()
    return String(byteArray, StandardCharsets.UTF_8)
}