import { shipType } from "../constants";
import { Ship } from "../interfaces";

export const getAllShipPositions = (
  length: number,
  initialPosition: any,
  direction: boolean
) => {
  const targetValue = direction ? "y" : "x";

  const secondaryValue = direction ? "x" : "y";

  const allPositions = [];

  for (let i = 0; i < length; i++) {
    allPositions.push({
      [targetValue]: initialPosition[targetValue] + i,
      [secondaryValue]: initialPosition[secondaryValue],
    });
  }
  return allPositions;
};

// const getAllAroundShipPosition = (length: number) => {};

export const getNeighboringCoordinates = (x: number, y: number) => {
  const neighbors = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue;
      const newX = x + dx;
      const newY = y + dy;
      if (newX >= 0 && newX < 9 && newY >= 0 && newY < 9) {
        neighbors.push({ x: newX, Y: newY });
      }
    }
  }

  return neighbors;
};

export const getAroundShipPosition = (shipPosition) =>
  getNeighboringCoordinates(shipPosition.x, shipPosition.y);

export const contractShipsExactPositions = (ships: Ship[]) => {
  const shipsExactPositions = {
    small: { ships: [], aroundShip: [] },
    medium: { ships: [], aroundShip: [] },
    large: { ships: [], aroundShip: [] },
    huge: { ships: [], aroundShip: [] },
  };

  ships.forEach((ship) => {
    const { position, type, direction, length } = ship;

    if (type === shipType.small) {
      shipsExactPositions.small.ships.push({ ...position });
      const aroundShipPositions = getAroundShipPosition(position);

      shipsExactPositions.small.aroundShip.push([...aroundShipPositions]);
    }
    if (type === shipType.medium) {
      shipsExactPositions.medium.ships.push(
        getAllShipPositions(length, position, direction)
      );
    }
    if (type === shipType.large) {
      shipsExactPositions.large.ships.push(
        getAllShipPositions(length, position, direction)
      );
    }
    if (type === shipType.huge) {
      shipsExactPositions.huge.ships.push(
        getAllShipPositions(length, position, direction)
      );
    }
  });

  return shipsExactPositions;
};
