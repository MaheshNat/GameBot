const fs = require('fs');

module.exports = {
  name: 'help',
  isGame: false,
  description: 'Sends a description of every command.',
  execute(message, args, games) {
    let helpMessage = 'Commands:\n';
    const commandFiles = fs
      .readdirSync('commands/')
      .filter((file) => file.endsWith('.js'));
    for (const file of commandFiles) {
      const command = require(`./${file}`);
      helpMessage += `'!${command.name}': ${command.description}\n`;
    }
    message.channel.send(helpMessage);
  },
};
