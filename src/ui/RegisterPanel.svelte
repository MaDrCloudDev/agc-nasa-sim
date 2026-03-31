<script lang="ts">
  import { getState } from '../stores/emulator.js';

  const state = $derived(getState());

  function toHex(val: number): string {
    return val.toString(16).toUpperCase().padStart(4, '0');
  }

  function toSigned(val: number): string {
    const v = val & 0x8000 ? val - 0x10000 : val;
    return v.toString();
  }
</script>

<div class="register-panel">
  <h2>Registers</h2>
  
  <div class="registers">
    <div class="reg">
      <span class="name">PC</span>
      <span class="value">{toHex(state?.pc ?? 0)}</span>
    </div>
    <div class="reg">
      <span class="name">ACC</span>
      <span class="value">{toHex(state?.acc ?? 0)}</span>
    </div>
    <div class="reg">
      <span class="name">Z</span>
      <span class="value">{toHex(state?.z ?? 0)}</span>
    </div>
    <div class="reg">
      <span class="name">L</span>
      <span class="value">{toHex(state?.l ?? 0)}</span>
    </div>
    <div class="reg">
      <span class="name">Q</span>
      <span class="value">{toHex(state?.q ?? 0)}</span>
    </div>
  </div>

  <h2>Current Instruction</h2>
  <div class="instruction">
    {#if state?.currentInstruction}
      <span class="mnemonic">{state.currentInstruction.mnemonic}</span>
      <span class="operand">{toHex(state.currentInstruction.operand)}</span>
      <span class="raw">(0x{toHex(state.currentInstruction.raw)})</span>
    {:else}
      <span class="none">—</span>
    {/if}
  </div>

  <div class="stats">
    <div class="stat">
      <span class="name">Cycles:</span>
      <span class="value">{state?.cycleCount ?? 0}</span>
    </div>
  </div>
</div>

<style>
  .register-panel {
    padding: 1rem;
    border-bottom: 1px solid #333;
  }

  h2 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    color: #00ff88;
  }

  .registers {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .reg {
    display: flex;
    justify-content: space-between;
    background: #1a1a1a;
    padding: 0.5rem;
    border: 1px solid #333;
  }

  .name {
    color: #888;
  }

  .value {
    color: #00ffff;
    font-weight: bold;
  }

  .instruction {
    background: #1a1a1a;
    padding: 0.5rem;
    border: 1px solid #333;
    margin-bottom: 1rem;
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .mnemonic {
    color: #ff00ff;
    font-weight: bold;
  }

  .operand {
    color: #ffff00;
  }

  .raw {
    color: #888;
    font-size: 0.8rem;
  }

  .none {
    color: #888;
  }

  .stats {
    display: flex;
    gap: 1rem;
  }

  .stat {
    display: flex;
    gap: 0.5rem;
  }
</style>
