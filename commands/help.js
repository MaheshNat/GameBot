const fs = require('fs');

module.exports = {
  name: 'help',
  isGame: false,
  description: 'Sends a description of every command. Usage: !help',
  execute(message, args, games) {
    let helpMessage = 'Commands:\n';

    //creating array containg all files in the commands folder
    const commandFiles = fs
      .readdirSync('commands/')
      .filter((file) => file.endsWith('.js'));

    //looping through command files, and outputting each command's name and description
    for (const file of commandFiles) {
      const command = require(`./${file}`);
      helpMessage += `'!${command.name}': ${command.description}\n`;
    }
    message.channel.send(helpMessage);
  },
};
