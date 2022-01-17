package io.hazelnet.external

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.boot.runApplication
import org.springframework.cache.annotation.EnableCaching
import org.springframework.scheduling.annotation.EnableScheduling

@SpringBootApplication
@EnableCaching
@EnableScheduling
@EnableConfigurationProperties(ExternalApplicationConfiguration::class)
class ExternalApplication {

}

fun main(args: Array<String>) {
    runApplication<ExternalApplication>(*args)
}
