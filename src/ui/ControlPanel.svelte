<script lang="ts">
  import counterDemo from '../programs/counter-demo.json';
  import loopDemo from '../programs/loop-demo.json';
  import { getState, isRunning, reset, step, run, stop, loadProgram } from '../stores/emulator.js';
  import type { ProgramData } from '../core/types.js';

  const programs: { name: string; program: ProgramData }[] = [
    { name: 'Counter Demo', program: counterDemo as ProgramData },
    { name: 'Loop Demo', program: loopDemo as ProgramData },
  ];

  let selectedProgram = $state(programs[0].name);

  function handleLoad() {
    const prog = programs.find(p => p.name === selectedProgram);
    if (prog) {
      loadProgram(prog.program);
    }
  }

  function handleReset() {
    reset();
  }

  function handleStep() {
    step();
  }

  function handleRun() {
    run(1000);
  }

  function handleStop() {
    stop();
  }

  const state = $derived(getState());
  const running = $derived(isRunning());
</script>

<div class="control-panel">
  <h2>Control Panel</h2>
  
  <div class="program-select">
    <label for="program">Program:</label>
    <select id="program" bind:value={selectedProgram} disabled={running}>
      {#each programs as prog}
        <option value={prog.name}>{prog.name}</option>
      {/each}
    </select>
  </div>

  <div class="buttons">
    <button onclick={handleLoad} disabled={running}>Load</button>
    <button onclick={handleReset} disabled={running}>Reset</button>
    <button onclick={handleStep} disabled={running || state?.halted}>Step</button>
    <button onclick={running ? handleStop : handleRun} disabled={state?.halted}>
      {running ? 'Pause' : 'Run'}
    </button>
  </div>

  <div class="status">
    <span class="label">Status:</span>
    <span class="value" class:halted={state?.halted} class:running={running && !state?.halted}>
      {state?.halted ? 'HALTED' : running ? 'RUNNING' : 'IDLE'}
    </span>
  </div>
</div>

<style>
  .control-panel {
    padding: 1rem;
    border-bottom: 1px solid #333;
  }

  h2 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    color: #00ff88;
  }

  .program-select {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    margin-bottom: 1rem;
  }

  select {
    background: #1a1a1a;
    color: #e0e0e0;
    border: 1px solid #333;
    padding: 0.25rem 0.5rem;
    font-family: inherit;
  }

  .buttons {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  button {
    background: #1a1a1a;
    color: #e0e0e0;
    border: 1px solid #00ff88;
    padding: 0.5rem 1rem;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.2s;
  }

  button:hover:not(:disabled) {
    background: #00ff88;
    color: #0a0a0a;
  }

  button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .status {
    display: flex;
    gap: 0.5rem;
  }

  .label {
    color: #888;
  }

  .value {
    font-weight: bold;
  }

  .value.halted {
    color: #ff4444;
  }

  .value.running {
    color: #00ff88;
  }
</style>
