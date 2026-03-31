<script lang="ts">
  import counterDemo from "../programs/counter-demo.json";
  import loopDemo from "../programs/loop-demo.json";
  import {
    getState,
    isRunning,
    reset,
    step,
    run,
    stop,
    loadProgram,
  } from "../stores/emulator.svelte.js";
  import type { ProgramData } from "../core/types.js";

  const programs: {
    name: string;
    program: ProgramData;
    description: string;
    whatItDoes: string;
  }[] = [
    {
      name: "Counter",
      program: counterDemo as ProgramData,
      description: "Counts 0,1,2...100 then halts",
      whatItDoes:
        "Increments counter by 1 each step. Halts at 100. ~600 cycles.",
    },
    {
      name: "Loop",
      program: loopDemo as ProgramData,
      description: "Counts down 100 to 0, halts on underflow",
      whatItDoes:
        "Decrements counter by 1 each step. Halts at underflow. ~500 cycles.",
    },
  ];

  let selectedProgram = $state(programs[0]?.name);

  $effect(() => {
    const prog = programs.find((p) => p.name === selectedProgram);
    if (prog) {
      loadProgram(prog.program);
    }
  });

  function handleReset() {
    reset();
    const prog = programs.find((p) => p.name === selectedProgram);
    if (prog) {
      loadProgram(prog.program);
    }
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

  let machineState = $derived(getState());
  let running = $derived(isRunning());
  let currentProgram = $derived(
    programs.find((p) => p.name === selectedProgram),
  );
</script>

<div class="control-panel">
  <h2>Control</h2>

  <div class="section">
    <label for="program">Program</label>
    <select id="program" bind:value={selectedProgram} disabled={running}>
      {#each programs as prog}
        <option value={prog.name}>{prog.name}</option>
      {/each}
    </select>
  </div>

  {#if currentProgram}
    <div class="info">
      <div class="desc">{currentProgram.description}</div>
      <div class="detail">{currentProgram.whatItDoes}</div>
    </div>
  {/if}

  <div class="buttons">
    <button onclick={handleReset} disabled={running}>Reset</button>
  </div>

  <div class="buttons">
    <button onclick={handleStep} disabled={running || machineState?.halted}>
      Step
    </button>
    <button
      onclick={running ? handleStop : handleRun}
      disabled={machineState?.halted}
    >
      {running ? "Pause" : "Run"}
    </button>
  </div>

  <div class="status">
    <span class="label">Status:</span>
    <span
      class="value"
      class:halted={machineState?.halted}
      class:running={running && !machineState?.halted}
    >
      {machineState?.halted ? "HALTED" : running ? "RUNNING" : "IDLE"}
    </span>
  </div>

  <div class="help">
    <div class="help-title">Controls</div>
    <div><strong>Load</strong> — Load program</div>
    <div><strong>Reset</strong> — Clear all</div>
    <div><strong>Step</strong> — One instruction</div>
    <div><strong>Run</strong> — Execute all</div>
  </div>

  <div class="help">
    <div class="help-title">Registers</div>
    <div><strong>PC</strong> — Next instruction</div>
    <div><strong>ACC</strong> — Accumulator</div>
    <div><strong>Z</strong> — Previous PC</div>
  </div>
</div>

<style>
  .control-panel {
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  h2 {
    margin: 0;
    font-size: 1rem;
    color: #00ff88;
    text-align: left;
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  label {
    font-size: 0.75rem;
    color: #888;
    text-align: left;
  }

  select {
    background: #1a1a1a;
    color: #e0e0e0;
    border: 1px solid #333;
    padding: 0.4rem;
    font-family: inherit;
    font-size: 0.85rem;
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

  .buttons {
    display: flex;
    gap: 0.3rem;
  }

  button {
    flex: 1;
    background: #1a1a1a;
    color: #e0e0e0;
    border: 1px solid #00ff88;
    padding: 0.5rem;
    cursor: pointer;
    font-family: inherit;
    font-size: 0.85rem;
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
    font-size: 0.85rem;
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

  .help {
    font-size: 0.75rem;
    color: #888;
  }

  .help-title {
    color: #666;
    margin-bottom: 0.2rem;
  }

  .help strong {
    color: #e0e0e0;
  }
</style>
