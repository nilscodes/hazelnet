package io.hazelnet.community.data.ping

class LastPingTooRecentException(
    override val message: String?,
    val minutesSinceLastPing: Int,
): Throwable(message)