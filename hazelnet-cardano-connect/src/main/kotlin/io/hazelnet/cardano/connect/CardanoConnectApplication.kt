package io.hazelnet.cardano.connect

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.cache.annotation.EnableCaching
import org.springframework.scheduling.annotation.EnableScheduling

@SpringBootApplication
@EnableCaching
@EnableScheduling
class CardanoConnectApplication

fun main(args: Array<String>) {
	runApplication<CardanoConnectApplication>(*args)
}
