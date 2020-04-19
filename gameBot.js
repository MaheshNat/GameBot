const discord = require('discord.js');
const fs = require('fs');
const Game = require('./models/game');

//creating map of commands {'name': file}
const client = new discord.Client();
client.commands = new discord.Collection();
client.mongoose = require('./utils/mongoose');
module.exports = client;

const prefix = process.env.prefix;
const token = process.env.token;

//putting command files to client.commands map
const commandFiles = fs
  .readdirSync('./commands/')
  .filter((file) => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  //putting a new entry in the map. key: name, value: file
  client.commands.set(command.name, command);
}

//array to hold information about the current games (game objects)
const games = [];

//setting activity once ready
client.on('ready', () => {
  console.log('ready');
  client.user.setActivity('games');
});

client.on('message', (message) => {
  //returning if message was written by a bot or first character is not '!'
  if (message.author.bot || message.content.charAt(0) != '!') return;

  //parsing arguments from message into args object
  //example: !command arg1=val1 arg2 arg2=val3 -> {'arg1': 'val1', 'arg2': true, 'arg3': 'val3'}
  let words = message.content.substring(prefix.length).split(' ');
  let args = {};
  for (let word of words.slice(1)) {
    let arg = word.split('=');
    args[arg[0]] = arg[1] ? arg[1] : true;
  }

  let command = client.commands.get(words[0]);
  if (command) {
    //checking if attempting to create a new game
    if (command.isGame && (Object.keys(args).length === 0 || args['private'])) {
      //exiting if user is the creator of a current game, and is attempting to create a new one
      if (games.find((game) => game.players.includes(message.author)))
        return message.reply(
          'You can only create one game at a time! Finish your existing game to created a new one.'
        );
      games.push(
        new Game(
          command.name,
          [message.author],
          message.author,
          false,
          args['private']
        )
      );
      message.reply(
        `Your game has been created! Other players can join this game by typing !join ${games.length}`
      );
    }
    //executing appropriate command
    command.execute(message, args, games);
  }
});

client.mongoose.init();
client.login(token);
