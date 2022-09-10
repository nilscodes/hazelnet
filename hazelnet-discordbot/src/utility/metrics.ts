import { Registry, Histogram } from "prom-client";

export interface CommandMetrics {
  commandDuration: Histogram<string>
}

export default {
  setup(prometheus: Registry) {
    const defaultLabels = { application: 'discordbot' };
    prometheus.setDefaultLabels(defaultLabels);
    const commandDuration = new Histogram({
      name: 'command_duration_ms',
      help: 'Duration of discord commands in ms',
      labelNames: ['command', 'guild'],
      // buckets for response time from 0.1ms to 500ms
      buckets: [0.10, 5, 15, 50, 100, 200, 300, 400, 500, 1000, 2000, 5000, 10000],
    });
    prometheus.registerMetric(commandDuration);
    return {
      commandDuration,
    };
  },
};
