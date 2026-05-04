/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum Subject {
  MATH = 'Math',
  SCIENCE = 'Science',
  ENGLISH = 'English'
}

export interface Question {
  subject: Subject;
  text: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface GameState {
  playerName: string;
  playerAvatar: string;
  difficulty: number; // 1 to 12
  playerHealth: number;
  playerMaxHealth: number;
  dragonHealth: number;
  dragonMaxHealth: number;
  attackPower: number;
  currentTurn: number;
  phase: 'INIT' | 'START' | 'POWER_UP' | 'QUESTION' | 'PLAYER_ATTACK' | 'DRAGON_ATTACK' | 'VICTORY' | 'DEFEAT';
  activeQuestion?: Question;
  lastActionResult?: string;
  level: number;
}
