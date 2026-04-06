<script lang="ts">
  import type { ProgramData } from "../core/types.js";
  import { toSigned16 } from "../utils/bit.js";

  interface Props {
    program: ProgramData;
    onStep: () => void;
    onRun: () => void;
    onStop: () => void;
    onReset: () => void;
    onProgramChange: (p: ProgramData) => void;
    programs: { id: 'counter' | 'loop'; name: string; description: string; data: ProgramData }[];
    running: boolean;
    halted: boolean;
    cycleCount: number;
    pc: number;
    acc: number;
  }

  let { program, onStep, onRun, onStop, onReset, onProgramChange, programs, running, halted, cycleCount, pc, acc }: Props = $props();

  let selectedProgram = $state<'counter' | 'loop'>(programs[0]?.id ?? 'counter');

  let currentProgram = $derived(programs.find(p => p.id === selectedProgram));

  function handleChange() {
    const p = programs.find(x => x.id === selectedProgram);
    if (p) onProgramChange(p.data);
  }

  function formatWord(w: number): string {
    const signed = toSigned16(w);
    if (signed < 0) return signed.toString();
    return "+" + signed.toString().padStart(2, "0");
  }
</script>

<div class="demo-panel">
  <div class="selector">
    <select bind:value={selectedProgram} onchange={handleChange}>
      {#each programs as p}
        <option value={p.id}>{p.name}</option>
      {/each}
    </select>
  </div>

  {#if currentProgram}
    <div class="info">
      <div class="desc">{currentProgram.data.name}</div>
      <div class="detail">{currentProgram.description}</div>
    </div>
  {/if}

  <div class="title">Demo: {program.name}</div>

  <div class="buttons">
    <button type="button" onclick={onStep} disabled={halted}>STEP</button>
    <button type="button" onclick={onRun} disabled={running || halted}>RUN</button>
    <button type="button" onclick={onStop}>STOP</button>
    <button type="button" onclick={onReset}>RESET</button>
  </div>

  <div class="status">
    <div class="stat">
      <span class="label">PC:</span>
      <span class="value">{pc}</span>
    </div>
    <div class="stat">
      <span class="label">ACC:</span>
      <span class="value">{formatWord(acc)}</span>
    </div>
    <div class="stat">
      <span class="label">CYCLES:</span>
      <span class="value">{cycleCount}</span>
    </div>
    <div class="stat">
      <span class="label">STATUS:</span>
      <span class="value" class:halted class:running>{halted ? "HALTED" : running ? "RUNNING" : "LOADED"}</span>
    </div>
  </div>
</div>

<style>
  .demo-panel {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .selector select {
    background: #1a1a1a;
    border: 1px solid #333;
    color: #e0e0e0;
    padding: 0.25rem 0.5rem;
    font-family: "Courier New", monospace;
    font-size: 0.85rem;
    width: 100%;
  }

  .info {
    background: #1a1a1a;
    border: 1px solid #333;
    padding: 0.5rem;
    font-size: 0.8rem;
  }

  .desc {
    color: #00ff88;
    margin-bottom: 0.2rem;
  }

  .detail {
    color: #888;
    font-size: 0.75rem;
  }

  .title {
    font-size: 1rem;
    color: #00ff88;
    font-family: "Courier New", monospace;
  }

  h3 {
    margin: 0 0 0.5rem 0;
    font-size: 0.8rem;
    color: #888;
    font-family: "Courier New", monospace;
    text-transform: uppercase;
  }

  .buttons {
    display: flex;
    gap: 0.25rem;
  }

  .buttons button {
    background: #1a1a1a;
    border: 1px solid #333;
    color: #e0e0e0;
    padding: 0.5rem 1rem;
    font-family: "Courier New", monospace;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .buttons button:hover:not(:disabled) {
    background: #252525;
    border-color: #00ff88;
  }

  .buttons button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .status {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .stat {
    display: flex;
    gap: 0.5rem;
    font-family: "Courier New", monospace;
    font-size: 0.85rem;
  }

  .stat .label {
    color: #666;
    min-width: 60px;
  }

  .stat .value {
    color: #00ff88;
  }

  .stat .value.halted {
    color: #ff4444;
  }
</style>