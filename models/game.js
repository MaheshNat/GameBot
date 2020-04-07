module.exports = class Game {
  constructor(name, players, createdBy, started, isPrivate) {
    this.name = name;
    this.players = players;
    this.createdBy = createdBy;
    this.started = started;
    this.isPrivate = isPrivate;
    this.requests = [];
  }
};
