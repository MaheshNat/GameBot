const discord = require('discord.js');
const client = require('../gameBot');
const fs = require('fs');
const Game = require('../models/game');
const merge = require('merge-img');

let turn = 0;
let direction = 1;

module.exports = {
  name: 'uno',
  isGame: true,
  players: Number.POSITIVE_INFINITY,
  description: 'A game of uno, which can be configured to include jump-ins.',
  async execute(message, args, games, start = false) {
    let game = games.find((game) => game.players.includes(message.author));
    if (!game)
      return message.reply('You have to join a game to use that command.');
    if (!game.started) return message.reply('This game has not started yet!');
    if (start) {
      //creating a deck containing all uno cards
      game.deck = [];
      for (let i = 0; i < 10; i++)
        game.deck = game.deck.concat([
          `blue_${i}`,
          `red_${i}`,
          `yellow_${i}`,
          `green_${i}`,
        ]);
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
      game.deck = game.deck.concat([...cards, ...cards]);
      //shuffling the deck
      game.deck.sort(() => Math.random() - 0.5);
      //assigning each player a deck of 7 cards
      game.hands = {};
      game.players.forEach((player) => {
        game.hands[player] = game.deck.splice(0, 7);

        //NOTE: PLEASE REFACTOR TO USE PROMISES!!! FOR SOME REASON THEY DON'T WORK!
        merge(game.hands[player].map((card) => `./images/uno/${card}.png`))
          .then((img) => {
            console.log('done merging');
            img.write(`./images/${player.username}.png`, () => {
              console.log('done writing');
              player
                .send('Your uno hand:', {
                  files: [`./images/${player.username}.png`],
                })
                .then((message) => {
                  console.log('done sending');
                  fs.unlink(`./images/${player.username}.png`, (result) => {
                    console.log('done deleting');
                  });
                });
            });
          })
          .catch((err) => {
            console.log(err);
          });
      });
    }
  },
};
