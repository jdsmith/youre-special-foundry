export const YOURESPECIAL = {};

// Define constants here

YOURESPECIAL.rangeBands = [
  'melee',
  'close',
  'far',
  'extreme',
];

YOURESPECIAL.attributes = {
  strength: {
    text: 'Strength',
    abbreviation: 'S',
  },
  perception: {
    text: 'Perception',
    abbreviation: 'P',
  },
  charisma: {
    text: 'Charisma',
    abbreviation: 'C',
  },
  endurance: {
    text: 'Endurance',
    abbreviation: 'E',
  },
  charisma: {
    text: 'Charisma',
    abbreviation: 'C',
  },
  intelligence: {
    text: 'Intelligence',
    abbreviation: 'I',
  },
  agility: {
    text: 'Agility',
    abbreviation: 'A',
  },
  luck: {
    text: 'Luck',
    abbreviation: 'L',
  },
};

YOURESPECIAL.exhaustionLevels = [
  '',
  '-1 die for Perception, Intelligence and Charisma',
  '-1 die for Strength, Agility and Endurance',
  '-1 AP per turn',
  '-1 die for all rolls, lose 1 Luck point',
  'Unconsious and dying',
];
