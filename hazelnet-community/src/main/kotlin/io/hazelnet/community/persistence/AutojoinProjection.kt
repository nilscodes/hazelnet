package io.hazelnet.community.persistence

import io.hazelnet.shared.data.BlockchainType

interface AutojoinProjection {
    fun getDiscordServerId(): Int
    fun getDiscordWhitelistId(): Long
    fun getAddress(): String
    fun getBlockchain(): BlockchainType
    fun getExternalAccountId(): Long
}