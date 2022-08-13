package io.hazelnet.shared

fun String.decodeHex(): String {
    require(length % 2 == 0) {"Must have an even length"}
    return String(
        chunked(2)
            .map { it.toInt(16).toByte() }
            .toByteArray()
    )
}