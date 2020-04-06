const client = require('../gameBot');

module.exports = {
  name: 'start',
  isGame: false,
  description:
    'Allows the creator of a game to start his/her game. Usage: !start',
  execute(message, args, games) {
    //finding the game the user wants to start
    let game = games.find((game) => game.createdBy === message.author);
    if (!game)
      return message.reply(
        'You have to be the creator of a game in order to use this command.'
      );
    if (game.started) {
      return message.reply('This game has already started!');
    }
    game.started = true;
    message.reply(
      `Successfully started a game of ${game.name} created by ${game.createdBy.username}.`
    );

    //executing the game upon starting it, passing in the optional argument 'started' to be true
    return client.commands.get(game.name).execute(message, args, games, true);
  },
};
