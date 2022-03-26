package io.hazelnet.community

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.boot.context.properties.ConstructorBinding

@ConstructorBinding
@ConfigurationProperties(prefix = "io.hazelnet.community")
data class CommunityApplicationConfiguration(
        val connect: ConnectConfiguration,
        val fundedpool: String?,
        val fundedhandle: String?,
)

data class ConnectConfiguration(
        val url: String
)