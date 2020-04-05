module.exports = {
  name: 'join',
  isGame: false,
  description: 'Allows the user to a join a game with a specific index',
  execute(message, args, games) {
    // if (games.find((game) => game.createdBy === message.author))
    //   return message.reply(`You cannot join your own game!`);
    let joinGame =
      games[parseInt(Object.keys(args).find((key) => !isNaN(key))) - 1];
    if (joinGame.started) {
      return message.reply(
        'This game has already started! Type !games to view current games.'
      );
    }
    // if (
    //   games.find((game) => game.players.includes(message.author ))
    // )
    //   return message.reply('You already joined that game!');
    joinGame.players.push(message.author);
    return message.reply(
      `Successfully joined a game of ${joinGame.name} created by ${joinGame.createdBy.username}`
    );
  },
};
