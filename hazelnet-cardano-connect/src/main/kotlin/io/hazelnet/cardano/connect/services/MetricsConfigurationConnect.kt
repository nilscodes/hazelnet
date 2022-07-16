package io.hazelnet.cardano.connect.services

import io.micrometer.core.instrument.Gauge
import io.micrometer.core.instrument.MeterRegistry
import io.micrometer.core.instrument.binder.MeterBinder
import org.springframework.boot.actuate.autoconfigure.metrics.MeterRegistryCustomizer
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class MetricsConfigurationConnect {
    @Bean
    fun metricsCommonTags(): MeterRegistryCustomizer<MeterRegistry>? {
        return MeterRegistryCustomizer { registry: MeterRegistry ->
            registry.config().commonTags("application", "connect")
        }
    }

    @Bean
    fun syncMetrics(infoService: InfoService): MeterBinder {
        return MeterBinder { registry ->
            Gauge.builder(
                "db_sync_status_seconds",
                infoService
            ) { infoService -> infoService.getSynchronizationStatus().getSecondsSinceLastSync().toDouble() }
                .register(registry)
        }
    }
}