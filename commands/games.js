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
    games.forEach((game, index) => {
      reply += `index: ${index + 1}, game: ${
        game.name
      }, players: [${game.players.map(
        (player) => player.username
      )}], createdBy: ${game.createdBy.username}, started: ${
        game.started ? 'yes' : 'no'
      }\n`;
    });
    message.channel.send(reply);
  },
};
