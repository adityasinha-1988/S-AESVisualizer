import { SAESStep, SAESTraceStep, SAESState, SAESMode } from '../types';

// Constants
export const SBOX = [0x9, 0x4, 0xA, 0xB, 0xD, 0x1, 0x8, 0x5, 0x6, 0x2, 0x0, 0x3, 0xC, 0xE, 0xF, 0x7];
export const ISBOX = [0xA, 0x5, 0x9, 0xB, 0x1, 0x7, 0x8, 0xF, 0x6, 0x0, 0x2, 0x3, 0xC, 0x4, 0xD, 0xE];

export const RCON1 = 0x80;
export const RCON2 = 0x30;

// Helpers
const toNibbles = (val: number): number[] => {
  return [
    (val >> 12) & 0xF,
    (val >> 8) & 0xF,
    (val >> 4) & 0xF,
    val & 0xF
  ];
};

const fromNibbles = (n: number[]): number => {
  return (n[0] << 12) | (n[1] << 8) | (n[2] << 4) | n[3];
};

const toMatrix = (val: number): number[][] => {
  const n = toNibbles(val);
  return [
    [n[0], n[2]],
    [n[1], n[3]]
  ];
};

const fromMatrix = (m: number[][]): number => {
  const n0 = m[0][0];
  const n1 = m[1][0];
  const n2 = m[0][1];
  const n3 = m[1][1];
  return (n0 << 12) | (n1 << 8) | (n2 << 4) | n3;
};

// Math
export const subNibble = (nib: number): number => SBOX[nib];
export const invSubNibble = (nib: number): number => ISBOX[nib];

export const rotNib = (byteVal: number): number => {
  const left = (byteVal >> 4) & 0xF;
  const right = byteVal & 0xF;
  return (right << 4) | left;
};

export const subByte = (byteVal: number): number => {
  const left = (byteVal >> 4) & 0xF;
  const right = byteVal & 0xF;
  return (SBOX[left] << 4) | SBOX[right];
};

const gfMult = (a: number, b: number): number => {
  let p = 0;
  for (let i = 0; i < 4; i++) {
    if ((b & 1) !== 0) p ^= a;
    const hiBitSet = (a & 0x8) !== 0;
    a = (a << 1) & 0xF;
    if (hiBitSet) a ^= 0x3; // x^4 + x + 1 => 0x13 => reduce by 0x3 since high bit implies 0x10
    b >>= 1;
  }
  return p;
};

// Core Operations
export const generateKeySchedule = (key: number): { keys: number[], words: number[] } => {
  const w = new Array(6).fill(0);
  w[0] = (key >> 8) & 0xFF;
  w[1] = key & 0xFF;

  // Round 1 Generation
  // w2 = w0 ^ RCON1 ^ SubNib(RotNib(w1))
  const t2 = subByte(rotNib(w[1])) ^ RCON1;
  w[2] = w[0] ^ t2;
  w[3] = w[2] ^ w[1];

  // Round 2 Generation
  const t4 = subByte(rotNib(w[3])) ^ RCON2;
  w[4] = w[2] ^ t4;
  w[5] = w[4] ^ w[3];

  const k0 = (w[0] << 8) | w[1];
  const k1 = (w[2] << 8) | w[3];
  const k2 = (w[4] << 8) | w[5];

  return { keys: [k0, k1, k2], words: w };
};

export const generateKeys = (key: number): number[] => {
  return generateKeySchedule(key).keys;
};

const addRoundKey = (state: number, key: number): number => state ^ key;

const shiftRow = (state: number): number => {
  // [n0 n2]
  // [n1 n3]
  // Shift row 1 left by 1 (which is same as right by 1 for len 2). n1 swaps with n3.
  const m = toMatrix(state);
  const temp = m[1][0];
  m[1][0] = m[1][1];
  m[1][1] = temp;
  return fromMatrix(m);
};

const subNibblesState = (state: number): number => {
  const n = toNibbles(state);
  return fromNibbles(n.map(subNibble));
};

const invSubNibblesState = (state: number): number => {
  const n = toNibbles(state);
  return fromNibbles(n.map(invSubNibble));
};

const mixColumns = (state: number): number => {
  const m = toMatrix(state);
  // [ 1 4 ]
  // [ 4 1 ]
  const mOut = [[0,0],[0,0]];
  for(let c=0; c<2; c++) {
    mOut[0][c] = gfMult(1, m[0][c]) ^ gfMult(4, m[1][c]);
    mOut[1][c] = gfMult(4, m[0][c]) ^ gfMult(1, m[1][c]);
  }
  return fromMatrix(mOut);
};

const invMixColumns = (state: number): number => {
  const m = toMatrix(state);
  // [ 9 2 ]
  // [ 2 9 ]
  const mOut = [[0,0],[0,0]];
  for(let c=0; c<2; c++) {
    mOut[0][c] = gfMult(9, m[0][c]) ^ gfMult(2, m[1][c]);
    mOut[1][c] = gfMult(2, m[0][c]) ^ gfMult(9, m[1][c]);
  }
  return fromMatrix(mOut);
};

export const generateTrace = (input: number, key: number, mode: SAESMode = SAESMode.ENCRYPTION): SAESTraceStep[] => {
  const steps: SAESTraceStep[] = [];
  const { keys, words } = generateKeySchedule(key);

  const pushStep = (id: SAESStep, val: number, desc: string, details: string, stepKey?: number, expandedWords?: number[]) => {
    steps.push({
      id,
      description: desc,
      state: { raw: val, matrix: toMatrix(val) },
      details,
      key: stepKey,
      expandedWords
    });
  };

  // 1. Input & Key Expansion (Common)
  let state = input;
  pushStep(SAESStep.INPUTS, state, 
    mode === SAESMode.ENCRYPTION ? "Input (Plaintext)" : "Input (Ciphertext)", 
    "The 16-bit input is arranged into a 2x2 matrix of 4-bit nibbles."
  );

  pushStep(SAESStep.KEY_EXPANSION, state, "Key Expansion", 
    `Key expansion generates three 16-bit round keys from the original key.\nK0: ${keys[0].toString(16).toUpperCase().padStart(4,'0')}\nK1: ${keys[1].toString(16).toUpperCase().padStart(4,'0')}\nK2: ${keys[2].toString(16).toUpperCase().padStart(4,'0')}`,
    undefined,
    words
  );

  if (mode === SAESMode.ENCRYPTION) {
    // ENCRYPTION
    
    // Add Round Key 0
    state = addRoundKey(state, keys[0]);
    pushStep(SAESStep.INITIAL_ADD_ROUND_KEY, state, "Add Round Key 0", "Bitwise XOR the state with Round Key 0 (K0).", keys[0]);

    // -- ROUND 1 --
    state = subNibblesState(state);
    pushStep(SAESStep.ROUND_1_SUB_NIBBLES, state, "SubNibbles (Round 1)", "Substitute each nibble using the S-Box.");

    state = shiftRow(state);
    pushStep(SAESStep.ROUND_1_SHIFT_ROW, state, "ShiftRow (Round 1)", "Swap the nibbles in the second row.");

    state = mixColumns(state);
    pushStep(SAESStep.ROUND_1_MIX_COLUMNS, state, "MixColumns (Round 1)", "Multiply columns by the constant matrix over GF(2^4).");

    state = addRoundKey(state, keys[1]);
    pushStep(SAESStep.ROUND_1_ADD_ROUND_KEY, state, "Add Round Key 1", "Bitwise XOR the state with Round Key 1 (K1).", keys[1]);

    // -- ROUND 2 --
    state = subNibblesState(state);
    pushStep(SAESStep.ROUND_2_SUB_NIBBLES, state, "SubNibbles (Round 2)", "Substitute each nibble using the S-Box again.");

    state = shiftRow(state);
    pushStep(SAESStep.ROUND_2_SHIFT_ROW, state, "ShiftRow (Round 2)", "Swap the nibbles in the second row.");

    state = addRoundKey(state, keys[2]);
    pushStep(SAESStep.ROUND_2_ADD_ROUND_KEY, state, "Add Round Key 2", "Bitwise XOR the state with Round Key 2 (K2).", keys[2]);

    // Output
    pushStep(SAESStep.OUTPUT, state, "Ciphertext Output", "The final state is the encrypted ciphertext.");

  } else {
    // DECRYPTION

    // Add Round Key 2
    state = addRoundKey(state, keys[2]);
    pushStep(SAESStep.DEC_INITIAL_ADD_ROUND_KEY, state, "Add Round Key 2", "Bitwise XOR the state with Round Key 2 (K2).", keys[2]);

    // -- ROUND 1 (Inverse of Round 2) --
    state = shiftRow(state);
    pushStep(SAESStep.DEC_ROUND_1_SHIFT_ROW, state, "ShiftRow (Inverse)", "Swap the nibbles in the second row (Self-inverse).");

    state = invSubNibblesState(state);
    pushStep(SAESStep.DEC_ROUND_1_INV_SUB_NIBBLES, state, "InvSubNibbles (Round 1)", "Substitute each nibble using the Inverse S-Box.");

    state = addRoundKey(state, keys[1]);
    pushStep(SAESStep.DEC_ROUND_1_ADD_ROUND_KEY, state, "Add Round Key 1", "Bitwise XOR the state with Round Key 1 (K1).", keys[1]);

    state = invMixColumns(state);
    pushStep(SAESStep.DEC_ROUND_1_INV_MIX_COLUMNS, state, "InvMixColumns", "Multiply columns by the inverse constant matrix over GF(2^4).");

    // -- ROUND 2 (Inverse of Round 1) --
    state = shiftRow(state);
    pushStep(SAESStep.DEC_ROUND_2_SHIFT_ROW, state, "ShiftRow (Inverse)", "Swap the nibbles in the second row.");

    state = invSubNibblesState(state);
    pushStep(SAESStep.DEC_ROUND_2_INV_SUB_NIBBLES, state, "InvSubNibbles (Round 2)", "Substitute each nibble using the Inverse S-Box.");

    state = addRoundKey(state, keys[0]);
    pushStep(SAESStep.DEC_ROUND_2_ADD_ROUND_KEY, state, "Add Round Key 0", "Bitwise XOR the state with Round Key 0 (K0).", keys[0]);

    // Output
    pushStep(SAESStep.OUTPUT, state, "Plaintext Output", "The final state is the decrypted plaintext.");
  }

  return steps;
};