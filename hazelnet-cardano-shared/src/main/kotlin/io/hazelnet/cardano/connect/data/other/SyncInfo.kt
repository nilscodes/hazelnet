package io.hazelnet.cardano.connect.data.other

import java.util.*

data class SyncInfo(
        val currentEpoch: Int,
        val lastBlock: Date,
        val syncPercentage: Double
) {
    fun getSecondsSinceLastSync(): Long = (Date().time - lastBlock.time) / 1000

    override fun toString(): String {
        return "SyncInfo(currentEpoch=$currentEpoch, lastBlock=$lastBlock, syncPercentage=$syncPercentage)"
    }
}