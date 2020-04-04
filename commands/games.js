const client = require('../gameBot');

module.exports = {
  name: 'games',
  isGame: false,
  description: 'Outputs the current games.',
  execute(message, args, games) {
    let reply = '';
    if (games.length === 0) {
      return message.reply('No games have been created yet.');
    }
    games.forEach((game) => {
      reply += `game: ${game.name}, players: [${game.players}], createdBy: ${
        game.createdBy
      }, full: ${
        client.commands.get(game.name).players === game.players.length
          ? 'yes'
          : 'no'
      }\n`;
    });
    message.channel.send(reply);
  },
};
