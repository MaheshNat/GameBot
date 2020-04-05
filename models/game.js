module.exports = class Game {
  constructor(name, players, createdBy, started) {
    this.name = name;
    this.players = players;
    this.createdBy = createdBy;
    this.started = started;
  }
};
