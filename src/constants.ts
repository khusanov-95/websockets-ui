export enum messageType {
  reg = "reg",
  createRoom = "create_room",
  addUserToRoom = "add_user_to_room",
  singlePlay = "single_play",
  updateRoom = "update_room",
  updateWinners = "update_winners",
  createGame = "create_game",
  addShips = "add_ships",
  startGame = "start_game",
  attack = "attack",
  randomAttack = "randomAttack",
  turn = "turn",
  finish = "finish",
}

export enum shipType {
  small = "small",
  medium = "medium",
  large = "large",
  huge = "huge",
}

export enum attackStatus {
  miss = "miss",
  killed = "killed",
  shot = "shot",
}

// export enum shipDirections {
//   vertical = "vertical",
//   horizontal = "horizontal",
// }
