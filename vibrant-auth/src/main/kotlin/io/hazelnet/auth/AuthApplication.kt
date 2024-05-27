package io.hazelnet.auth

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.boot.runApplication

@SpringBootApplication
@EnableConfigurationProperties(AuthApplicationConfiguration::class)
class AuthApplication

fun main(args: Array<String>) {
    runApplication<AuthApplication>(*args)
}
