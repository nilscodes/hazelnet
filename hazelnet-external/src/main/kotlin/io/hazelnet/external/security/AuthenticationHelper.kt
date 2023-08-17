package io.hazelnet.external.security

import org.springframework.security.oauth2.server.resource.authentication.BearerTokenAuthentication

fun BearerTokenAuthentication.getGuildId(): Long = this.token.tokenValue.substringAfter(".").toLong()