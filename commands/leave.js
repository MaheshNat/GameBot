const client = require('../gameBot');

module.exports = {
  name: 'leave',
  isGame: false,
  description: 'Allows the user to leave a game.',
  execute(message, args, games) {
    let game = games.find((game) =>
      game.players.includes(message.author.username)
    );
    if (!game)
      return message.reply(
        'You have to be playing a game to use this command.'
      );
    message.reply(
      `Sucessfully left a game of ${game.name} hosted by ${game.createdBy}.`
    );
    let index = games.indexOf(game);
    game.players.splice(message.author.username);
    if (game.players.length === 0) games.splice(game);
    else games[index] = game;
  },
};
