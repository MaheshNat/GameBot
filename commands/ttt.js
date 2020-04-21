const Game = require('../models/game');

//represents the index of the player whose turn it is
let turn = 0;

module.exports = {
  name: 'ttt',
  isGame: true,
  players: 2,
  description: `A traditional game of tic-tac-toe. Usage: ${process.env.prefix}ttt to create a game, ${process.env.token}ttt <int> to place a marker at the location <int> on the board.`,
  execute(message, args, games) {
    //finding the game the user is in
    let game = games.find((game) => game.players.includes(message.author));
    if (!game)
      return message.reply('You have to join a game to use that command.');
    //exiting if 2 players have not been joined yet.
    if (game.players.length !== this.players) return;
    //setting up board if it has not been created yet
    if (!game.board) {
      game.board = [
        ['', '', ''],
        ['', '', ''],
        ['', '', ''],
      ];
      game.started = true;
      return message.reply(
        `The game has started. It is ${game.players[turn].username}'s turn as X.`
      );
    } else if (game.players[turn] !== message.author) {
      return message.reply('It is not your turn!');
    } else {
      //finding the location the user wants to place their marker in from the args object
      let loc = parseInt(Object.keys(args).find((key) => !isNaN(key)));
      //exiting if location is outside bounds or isn't an integer
      if (loc < 1 || loc > 9 || !Number.isInteger(loc))
        return message.reply(
          'Make sure you integer an integer location between 1 and 9 (inclusive)!'
        );
      //converting location [1, 9] into a row index and col index in the board 2d array
      let row = Math.floor((loc - 1) / 3);
      let col = Math.floor((loc - 1) % 3);
      if (game.board[row][col] !== '')
        return message.reply('You cannot a marker at that location!');

      //placing a marker depending on who's turn it is.
      game.board[row][col] = turn === 0 ? 'X' : 'O';

      //incrementing the turn, setting back to 0 if maximum with modulus
      turn = (turn + 1) % game.players.length;
    }

    message.channel.send(printBoard(game.board));

    //checking for a result, either a win (containing the character of the player who won) or a draw
    let result = checkWin(game.board);
    if (result) {
      if (result === 'draw')
        message.channel.send('The game ended in a draw!!!');
      else if (result === 'X')
        message.channel.send(
          `Congratulations! player ${game.players[0].username} won the game!!!`
        );
      else if (result === 'O')
        message.channel.send(
          `Congratulations! player ${game.players[1].username} won the game!!!`
        );
      //deleting the game as it has ended
      games.splice(game);
    }
  },
};

//checks for either a win or a draw by calling the other functions
function checkWin(board) {
  let rowCol = checkRowCol(board);
  let diag = checkDiagonal(board);
  if (rowCol) return rowCol;
  if (diag) return diag;
  if (checkDraw(board)) return 'draw';
  return false;
}

//checks for a draw: returns true if all the spaces in the board are occupied
function checkDraw(board) {
  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board[i].length; j++) {
      if (board[i][j] === '') return false;
    }
  }
  return true;
}

//checks for a win in a row or column of 3
function checkRowCol(board) {
  for (let i = 0; i < board.length; i++) {
    let result1 = check(board[i][0], board[i][1], board[i][2]);
    if (result1) return result1;
    let result2 = check(board[0][i], board[1][i], board[2][i]);
    if (result2) return result2;
  }
  return false;
}

//checks for a diagonal win
function checkDiagonal(board) {
  let result1 = check(board[0][0], board[1][1], board[2][2]);
  if (result1) return result1;
  let result2 = check(board[2][0], board[1][1], board[0][2]);
  if (result2) return result2;
  return false;
}

//checks to see if three elements (a, b, and c) are equal
function check(a, b, c) {
  if (a == b && b == c) return a;
  return false;
}

//prints out the board in emoji form
function printBoard(board) {
  let output = '';
  let index = 1;
  for (let row of board) {
    for (let cell of row) {
      output +=
        cell === ''
          ? `:${getWord(index)}:`
          : cell === 'X'
          ? ':regional_indicator_x:'
          : ':o2:';
      index++;
    }
    output += '\n';
  }
  return output;
}

function getWord(number) {
  switch (number) {
    case 1:
      return 'one';
    case 2:
      return 'two';
    case 3:
      return 'three';
    case 4:
      return 'four';
    case 5:
      return 'five';
    case 6:
      return 'six';
    case 7:
      return 'seven';
    case 8:
      return 'eight';
    case 9:
      return 'nine';
  }
}
