package io.hazelnet.community

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.boot.context.properties.ConstructorBinding

@ConstructorBinding
@ConfigurationProperties(prefix = "io.hazelnet.community")
data class CommunityApplicationConfiguration(
        val connect: ConnectConfiguration,
        val voteaire: VoteaireConfiguration,
        val cnftjungle: CnftJungleConfiguration,
        val fundedpool: String?,
        val fundedhandle: String?,
        val ipfslink: String?,
)

data class ConnectConfiguration(
        val url: String
)

data class VoteaireConfiguration(
        val url: String
)

data class CnftJungleConfiguration(
        val url: String
)