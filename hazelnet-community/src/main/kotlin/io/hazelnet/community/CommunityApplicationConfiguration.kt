package io.hazelnet.community

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.boot.context.properties.ConstructorBinding

@ConstructorBinding
@ConfigurationProperties(prefix = "io.hazelnet.community")
data class CommunityApplicationConfiguration(
    val connect: ConnectConfiguration,
    val voteaire: VoteaireConfiguration,
    val tokenregistry: TokenRegistryConfiguration,
    val necroleague: NecroLeagueConfiguration,
    val vibrantAuth: VibrantAuthConfiguration,
    val fundedpool: String?,
    val fundedhandle: String?,
    val salesIpfslink: String?,
    val mintIpfslink: String?,
    val marketplace: MarketplaceConfiguration,
    val nftcdn: NftCdnConfiguration,
    val logging: LoggingConfiguration?,
)

data class ConnectConfiguration(
    val url: String,
    val ignoreAmountIfStakeBelow: Long = 50000000L,
)

data class NecroLeagueConfiguration(
    val url: String,
    val policyId: String,
)

data class VoteaireConfiguration(
    val url: String
)

data class TokenRegistryConfiguration(
    val url: String
)

data class VibrantAuthConfiguration(
    val url: String,
    val clientId: String,
    val clientSecret: String,
)

data class MarketplaceConfiguration(
    val aggregationFrequency: Long = 180L
)

data class NftCdnConfiguration(
    val domain: String,
    val key: String,
)

data class LoggingConfiguration(
    val tokenroles: TokenRoleLoggingConfiguration?,
)

data class TokenRoleLoggingConfiguration(
    val externalAccountIds: List<Long>?,
    val tokenRoleIds: List<Long>?,
)