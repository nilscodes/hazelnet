package io.hazelnet.community

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.boot.context.properties.ConstructorBinding

@ConstructorBinding
@ConfigurationProperties(prefix = "io.hazelnet.community")
data class CommunityApplicationConfiguration(
    val connect: ConnectConfiguration,
    val voteaire: VoteaireConfiguration,
    val mutantstaking: MutantStakingConfiguration,
    val tokenregistry: TokenRegistryConfiguration,
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
    val url: String
)

data class VoteaireConfiguration(
    val url: String
)

data class MutantStakingConfiguration(
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
    val aggregationFrequency: Long = 5L
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