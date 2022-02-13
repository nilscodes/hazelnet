module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    client.logger.info(`HAZELnet bot is running. Logged in as ${client.user.tag} (${client.user.id})`);
  },
};
