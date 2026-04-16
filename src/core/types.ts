export interface ProgramData {
  name: string;
  startAddress: number;
  entryPoint: number;
  words: number[];
}

export class InvalidMemoryAccess extends Error {
  constructor(address: number, size: number) {
    super(`Invalid memory access: address ${address} (size ${size})`);
    this.name = 'InvalidMemoryAccess';
  }
}

export class WriteToFixedMemory extends Error {
  constructor(address: number) {
    super(`Write to fixed memory: address ${address}`);
    this.name = 'WriteToFixedMemory';
  }
}
