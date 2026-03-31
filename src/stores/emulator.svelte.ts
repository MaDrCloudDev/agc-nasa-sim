import { AgcCpu } from '../core/cpu.js';
import type { MachineState, ProgramData } from '../core/types.js';

let cpu: AgcCpu | null = null;
let animationFrameId: number | null = null;

const emulatorState = $state({
  machine: null as MachineState | null,
  running: false,
});

function ensureCpu(): AgcCpu {
  if (!cpu) {
    cpu = new AgcCpu();
    emulatorState.machine = cpu.getState();
  }
  return cpu;
}

function sync(): void {
  if (cpu) {
    emulatorState.machine = cpu.getState();
  }
}

export function getState(): MachineState | null {
  return emulatorState.machine;
}

export function isRunning(): boolean {
  return emulatorState.running;
}

export function reset(): void {
  stop();
  const c = ensureCpu();
  c.reset();
  sync();
}

export function step(): void {
  const c = ensureCpu();
  c.step();
  sync();
}

export function run(speed: number = 1000): void {
  if (emulatorState.running) return;
  emulatorState.running = true;

  const tick = () => {
    if (!emulatorState.running || !cpu || cpu.halted) {
      emulatorState.running = false;
      sync();
      return;
    }
    const stepsPerFrame = Math.ceil(speed / 60);
    for (let i = 0; i < stepsPerFrame && !cpu.halted; i++) {
      cpu.step();
    }
    sync();
    animationFrameId = requestAnimationFrame(tick);
  };

  animationFrameId = requestAnimationFrame(tick);
}

export function stop(): void {
  emulatorState.running = false;
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

export function loadProgram(program: ProgramData): void {
  stop();
  const c = ensureCpu();
  c.reset();
  c.loadProgram(program);
  sync();
}

export function setInput(channel: number, value: number): void {
  const c = ensureCpu();
  c.input[channel] = value;
}
