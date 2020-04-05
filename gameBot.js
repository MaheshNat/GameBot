const discord = require('discord.js');
const client = new discord.Client();
module.exports = client;
client.commands = new discord.Collection();

const fs = require('fs');
const Game = require('./models/game');

const token = process.env.token;
const prefix = process.env.prefix;

const commandFiles = fs
  .readdirSync('./commands/')
  .filter((file) => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

const games = [];

client.on('ready', () => {
  console.log('ready');
  client.user.setActivity('games');
});

client.on('message', (message) => {
  if (message.author.bot || message.content.charAt(0) != '!') return;
  let words = message.content.substring(prefix.length).split(' ');
  let args = {};
  for (let word of words.slice(1)) {
    let arg = word.split('=');
    args[arg[0]] = arg[1] ? arg[1] : true;
  }
  let command = client.commands.get(words[0]);
  if (command) {
    if (command.isGame && Object.keys(args).length === 0) {
      if (games.find((game) => game.createdBy === message.author))
        return message.reply(
          'You can only create one game at a time! Finish your existing game to created a new one.'
        );
      games.push(
        new Game(command.name, [message.author], message.author, false)
      );
      message.reply(
        `Your game has been created! Other players can join this game by typing !join ${games.length}`
      );
    }
    // }
    command.execute(message, args, games);
  }
});

client.login(token);
