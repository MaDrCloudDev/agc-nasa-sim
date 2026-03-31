<script lang="ts">
  import { getState } from '../stores/emulator.svelte.js';

  const state = $derived(getState());

  function toHex(val: number): string {
    return val.toString(16).toUpperCase().padStart(4, '0');
  }

  function charDisplay(val: number): string {
    if (val >= 32 && val <= 126) {
      return String.fromCharCode(val);
    }
    return '.';
  }
</script>

<div class="memory-viewer">
  <h2>Memory</h2>
  
  <div class="memory-table">
    <div class="header">
      <span class="addr">ADDR</span>
      <span class="data">DATA</span>
      <span class="chars">CH</span>
    </div>
    <div class="rows">
      {#each { length: 20 } as _, i}
        {@const addr = i * 8}
        {@const words = state?.memory ? Array.from(state.memory.slice(addr, addr + 8)) : []}
        <div class="row" class:current={state && addr <= state.pc && state.pc < addr + 8}>
          <span class="addr">{toHex(addr)}</span>
          <span class="data">{words.map(w => toHex(w)).join(' ')}</span>
          <span class="chars">{words.map(w => charDisplay(w)).join('')}</span>
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .memory-viewer {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 0.5rem;
    overflow: hidden;
  }

  h2 {
    margin: 0 0 0.3rem 0;
    font-size: 0.9rem;
    color: #00ff88;
    text-align: left;
  }

  .memory-table {
    flex: 1;
    background: #1a1a1a;
    border: 1px solid #333;
    overflow: auto;
    font-size: 0.7rem;
    font-family: monospace;
  }

  .header {
    display: flex;
    padding: 0.15rem 0.2rem;
    background: #252525;
    position: sticky;
    top: 0;
    font-size: 0.65rem;
  }

  .header span {
    color: #888;
  }

  .rows {
    display: flex;
    flex-direction: column;
  }

  .row {
    display: flex;
    padding: 0.08rem 0.15rem;
  }

  .row:hover {
    background: #252525;
  }

  .row.current {
    background: #003300;
    border-left: 2px solid #00ff88;
  }

  .addr {
    width: 45px;
    color: #888;
    flex-shrink: 0;
  }

  .data {
    flex: 1;
    color: #00ffff;
    letter-spacing: 0.02em;
    overflow: hidden;
  }

  .chars {
    width: 60px;
    color: #666;
    flex-shrink: 0;
  }
</style>
