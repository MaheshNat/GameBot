const discord = require('discord.js');


module.exports = {
  name: 'rps',
  isGame: true,
  players: 2,
  description: 'Normal game of rock paper scissors.',
  execute(message, args, games){
    //finding the game the user is in
    let game = games.find((game) => game.players.includes(message.author));
    if (!game)
      return message.reply('You have to join a game to use that command.');
    if (game.players.length !== this.players) return;
    //exiting if 2 players have not been joined yet.
    game.started = true;
    if(!game.started) {
        game.started = true;
        return message.channel.send('game started');
    }
    let hand1 = '';
    let hand2 = '';
    let hands = ['rock', 'paper', 'scissor'];

    //sends message to the player 
    message.players[0].send('Select: \n1:Rock 2:paper 3:scissor');
    message.players[1].send('Select: \n1:Rock 2:paper 3:scissor');

    //reads the message of players[0] to determine their hand
    if(message.channel instanceof DMChannel) {
      if(message.author === message.players[0]) {  
        if (message.content < 4 && message.content > 0) {hand1 = message.content;}
        else {message.player[0].send('Please choose a valid number')}
      }
    }

     //reads the message of players[1] to determine their hand
    if(message.channel instanceof DMChannel) {
      if(message.author === message.players[1]) {  
        if (message.content < 4 && message.content > 0) {hand2 = message.content;}
        else {message.player[1].send('Please choose a valid number')}
      }
    }

    //determines the winner by comparing the two messages using the helper function
    determineWinner(hands[hand1 - 1], hands[hand2 - 1]);

    //deleting the game as it has ended
    games.splice(game);
  }
};

//compares the two hands and determines the winner
function determineWinner(hand1, hand2){
    if(hand1 === hand2)             {return 'tie!';}
    if(hand1 === 'paper')
    {
        if(hand2 === 'rock')        {return `Congratulations! Player ${game.players[0].username} won the game!`;}
        if(hand2 === 'scissors')    {return `Congratulations! Player ${game.players[1].username} won the game!`;}
    }
    if(hand1 === 'rock')
    {
        if(hand2 === 'paper')       {return `Congratulations! Player ${game.players[1].username} won the game!`;}
        if(hand2 === 'scissors')    {return `Congratulations! Player ${game.players[0].username} won the game!`;}
    }
    if(hand1 === 'scissors')
    {
        if(hand2 === 'rock')        {return `Congratulations! Player ${game.players[1].username} won the game!`;}
        if(hand2 === 'scissors')    {return `Congratulations! Player ${game.players[0].username} won the game!`;}
    }
    return 'error lmao';
}