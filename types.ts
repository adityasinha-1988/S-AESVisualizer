export enum SAESMode {
  ENCRYPTION = 'Encryption',
  DECRYPTION = 'Decryption'
}

export enum SAESStep {
  // Common
  INPUTS = 'Input',
  KEY_EXPANSION = 'Key Expansion',
  OUTPUT = 'Output',

  // Encryption
  INITIAL_ADD_ROUND_KEY = 'Add Round Key 0',
  ROUND_1_SUB_NIBBLES = 'Round 1: Sub Nibbles',
  ROUND_1_SHIFT_ROW = 'Round 1: Shift Row',
  ROUND_1_MIX_COLUMNS = 'Round 1: Mix Columns',
  ROUND_1_ADD_ROUND_KEY = 'Round 1: Add Round Key 1',
  ROUND_2_SUB_NIBBLES = 'Round 2: Sub Nibbles',
  ROUND_2_SHIFT_ROW = 'Round 2: Shift Row',
  ROUND_2_ADD_ROUND_KEY = 'Round 2: Add Round Key 2',

  // Decryption
  DEC_INITIAL_ADD_ROUND_KEY = 'Add Round Key 2',
  DEC_ROUND_1_SHIFT_ROW = 'Round 1: Shift Row (Inv)',
  DEC_ROUND_1_INV_SUB_NIBBLES = 'Round 1: Inv Sub Nibbles',
  DEC_ROUND_1_ADD_ROUND_KEY = 'Round 1: Add Round Key 1 (Dec)',
  DEC_ROUND_1_INV_MIX_COLUMNS = 'Round 1: Inv Mix Columns',
  DEC_ROUND_2_SHIFT_ROW = 'Round 2: Shift Row (Inv)',
  DEC_ROUND_2_INV_SUB_NIBBLES = 'Round 2: Inv Sub Nibbles',
  DEC_ROUND_2_ADD_ROUND_KEY = 'Round 2: Add Round Key 0'
}

export interface SAESState {
  raw: number; // 16-bit integer
  matrix: number[][]; // 2x2 matrix of nibbles
}

export interface SAESTraceStep {
  id: SAESStep;
  description: string;
  state: SAESState;
  key?: number; // The key used in this step (if AddRoundKey)
  expandedWords?: number[]; // The 6 words generated during key expansion [w0, w1, w2, w3, w4, w5]
  highlight?: number[]; // Indices of nibbles to highlight
  details?: string; // Technical detail
}