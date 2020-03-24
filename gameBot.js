const discord = require('discord.js');
const client = new discord.Client();
client.commands = new discord.Collection();

const fs = require('fs');

const { token, prefix } = require('./config.json');

const commandFiles = fs
  .readdirSync('./commands/')
  .filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

client.on('ready', () => {
  console.log('ready');
  client.user.setActivity('games');
});

client.on('message', message => {
  if (message.author.bot) return;
  let args = message.content.substring(prefix.length).split(' ');

  switch (args[0]) {
    case 'hello':
      client.commands.get('hello').execute(message, args);
      break;
  }
});

client.login(token);
