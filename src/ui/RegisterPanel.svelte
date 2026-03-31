<script lang="ts">
  import { getState } from "../stores/emulator.svelte.js";

  const state = $derived(getState());

  function toHex(val: number): string {
    return val.toString(16).toUpperCase().padStart(4, "0");
  }
</script>

<div class="register-panel">
  <h2>Registers</h2>

  <div class="reg-row">
    <div class="reg">
      <span class="name">PC</span>
      <span class="value">{toHex(state?.pc ?? 0)}</span>
    </div>
    <div class="reg">
      <span class="name">ACC</span>
      <span class="value">{toHex(state?.acc ?? 0)}</span>
    </div>
  </div>

  <div class="reg-row">
    <div class="reg">
      <span class="name">Z</span>
      <span class="value">{toHex(state?.z ?? 0)}</span>
    </div>
    <div class="reg">
      <span class="name">L</span>
      <span class="value">{toHex(state?.l ?? 0)}</span>
    </div>
  </div>

  <div class="reg-row">
    <div class="reg">
      <span class="name">Q</span>
      <span class="value">{toHex(state?.q ?? 0)}</span>
    </div>
    <div class="reg stat">
      <span class="name">Cycles</span>
      <span class="value">{state?.cycleCount ?? 0}</span>
    </div>
  </div>

  <h2>Instruction</h2>
  <div class="instruction">
    {#if state?.currentInstruction}
      <span class="mnemonic">{state.currentInstruction.mnemonic}</span>
      <span class="operand">{toHex(state.currentInstruction.operand)}</span>
    {:else}
      <span class="none">—</span>
    {/if}
  </div>
</div>

<style>
  .register-panel {
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  h2 {
    margin: 0;
    font-size: 0.9rem;
    color: #00ff88;
    text-align: left;
  }

  .reg-row {
    display: flex;
    gap: 0.3rem;
  }

  .reg {
    flex: 1;
    display: flex;
    justify-content: space-between;
    background: #1a1a1a;
    padding: 0.3rem 0.4rem;
    border: 1px solid #333;
    font-size: 0.75rem;
  }

  .stat {
    justify-content: space-between;
  }

  .name {
    color: #888;
  }

  .value {
    color: #00ffff;
    font-weight: bold;
    font-family: monospace;
  }

  .instruction {
    background: #1a1a1a;
    padding: 0.3rem 0.4rem;
    border: 1px solid #333;
    font-size: 0.75rem;
    font-family: monospace;
  }

  .mnemonic {
    color: #ff00ff;
    font-weight: bold;
    margin-right: 0.5rem;
  }

  .operand {
    color: #ffff00;
  }

  .none {
    color: #888;
  }
</style>
