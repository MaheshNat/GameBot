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
    message.author.send('hello');

    //randomly generating hand
    let hands = ['rock', 'paper', 'scissor'];
    let hands1 = [];
    let hands2 = [];
    for (let i = 3; i>0; i--)
    {
        hands1.push(hands.splice(Math.floor((Math.random()*limit)+1),1));
    }
    hands = ['rock', 'paper', 'scissor'];
    for (let i = 3; i>0; i--)
    {
        hands2.push(hands.splice(Math.floor((Math.random()*limit)+1),1));
    }
    message.players[0].send(sendHand(hands1));
    message.players[1].send(sendHand(hands2));
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

//makese the string sent to the player
function sendHand(customList)
{
    let botMessage = '';
    for (let i = 1; i<4; i++)
    {
       botMessage += '' + i + ": " + customList[i-1] + ' ';
    }
    return botMessage;
}