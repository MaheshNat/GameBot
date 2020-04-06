module.exports = {
  name: 'join',
  isGame: false,
  description:
    'Allows the user to a join a game with a specific index. Usage: !join <int>',
  execute(message, args, games) {
    //exiting if user is attempting to join their own game.
    if (games.find((game) => game.players.includes(message.author)))
      return message.reply(`You are already part of this game!`);
    //finding the game the user wants to join using the args object
    let joinGame =
      games[parseInt(Object.keys(args).find((key) => !isNaN(key))) - 1];
    if (joinGame.started) {
      return message.reply(
        'This game has already started! Type !games to view current games.'
      );
    }
    //adding the user to the game's players
    joinGame.players.push(message.author);
    return message.reply(
      `Successfully joined a game of ${joinGame.name} created by ${joinGame.createdBy.username}`
    );
  },
};
