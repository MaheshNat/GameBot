const discord = require('discord.js');
const client = require('../gameBot');
const fs = require('fs');
const Game = require('../models/game');
const merge = require('merge-img');

//represents the index of the player whose turn it is
let turn = 0;
//represents in which direction the game is being played (which can change by a reverse card)
//1 represents normal direction, -1 represents reverse
let direction = 1;

module.exports = {
  name: 'uno',
  isGame: true,
  players: Number.POSITIVE_INFINITY,
  description: 'A game of uno, which can be configured to include jump-ins.',
  async execute(message, args, games, start = false) {
    //finding the game the user is in
    let game = games.find((game) => game.players.includes(message.author));
    if (!game)
      return message.reply('You have to join a game to use that command.');
    if (!game.started) return message.reply('This game has not started yet!');
    if (start) {
      //creating a deck containing all uno cards
      game.deck = [];
      for (let i = 0; i < 10; i++)
        //adding all number cards of each color [0-9]
        game.deck = game.deck.concat([
          `blue_${i}`,
          `red_${i}`,
          `yellow_${i}`,
          `green_${i}`,
        ]);
      //adding special cards to the deck
      let cards = [
        'blue_plus_2',
        'blue_reverse',
        'blue_skip',
        'red_plus_2',
        'red_reverse',
        'red_skip',
        'green_plus_2',
        'green_reverse',
        'green_skip',
        'yellow_plus_2',
        'yellow_reverse',
        'yellow_skip',
        'wild',
        'wild',
        'plus_4',
        'plus_4',
      ];
      //adding the cards twice to the deck
      game.deck = game.deck.concat(cards).concat(cards);
      //shuffling the deck
      game.deck.sort(() => Math.random() - 0.5);
      //assigning each player a deck of 7 cards
      game.hands = {};
      game.players.forEach((player) => {
        game.hands[player] = game.deck.splice(0, 7);
        sendHand(game, player);
      });
      const startEmbed = new discord.MessageEmbed()
        .setColor('#0099f')
        .setTitle('The game has started!')
        .setDescription(`It is ${game.players[turn].username}'s turn`);
    }
  },
};

function sendHand(game, player) {
  //NOTE: REFACTOR TO USE PROMISES!!! FOR SOME REASON THEY DON'T WORK!

  //merges the images of the players cards into one cohesive image
  //merges -> writes to file -> sends images aig-> deletes files
  //for some reason the discord.js library can't send file objects, it always needs a
  //file directory in order to send it, so we have to write the file to the bot's directory.
  let fileName = '';
  merge(game.hands[player].map((card) => `./images/uno/${card}.png`))
    .then((img) => {
      console.log('done merging');
      fileName = `./images/${player.username}.png`;
      img.write(fileName, () => {
        console.log('done writing');
        player
          .send('Your uno hand:', {
            files: [fileName],
          })
          .then((message) => {
            console.log('done sending');
            fs.unlink(fileName, (result) => {
              console.log('done deleting');
            });
          });
      });
    })
    .catch((err) => {
      console.log(err);
    });
}
