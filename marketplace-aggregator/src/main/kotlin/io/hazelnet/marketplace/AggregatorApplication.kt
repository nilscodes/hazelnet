package io.hazelnet.marketplace

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.boot.runApplication
import org.springframework.cache.annotation.EnableCaching
import org.springframework.scheduling.annotation.EnableScheduling

@SpringBootApplication
@EnableCaching
@EnableScheduling
@EnableConfigurationProperties(AggregatorApplicationConfiguration::class)
class AggregatorApplication {

}

fun main(args: Array<String>) {
    runApplication<AggregatorApplication>(*args)
}
