module.exports = {
  setup(prometheus) {
    const defaultLabels = { application: 'discordbot' };
    prometheus.register.setDefaultLabels(defaultLabels);
    const commandDuration = new prometheus.Histogram({
      name: 'command_duration_ms',
      help: 'Duration of discord commands in ms',
      labelNames: ['command', 'guild'],
      // buckets for response time from 0.1ms to 500ms
      buckets: [0.10, 5, 15, 50, 100, 200, 300, 400, 500, 1000, 2000, 5000, 10000],
    });
    return {
      commandDuration,
    };
  },
};
