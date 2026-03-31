<script lang="ts">
  import { getState } from '../stores/emulator.js';

  const state = $derived(getState());
  const displayRows = 32;
  const bytesPerRow = 16;

  function toHex(val: number): string {
    return val.toString(16).toUpperCase().padStart(4, '0');
  }

  function charDisplay(val: number): string {
    if (val >= 32 && val <= 126) {
      return String.fromCharCode(val);
    }
    return '.';
  }

  const memoryView = $derived.by(() => {
    if (!state?.memory) return [];
    const rows: { addr: number; words: string[]; chars: string }[] = [];
    for (let i = 0; i < displayRows * bytesPerRow; i += bytesPerRow) {
      rows.push({
        addr: i,
        words: Array.from(state.memory.slice(i, i + bytesPerRow)).map(toHex),
        chars: Array.from(state.memory.slice(i, i + bytesPerRow)).map(charDisplay).join(''),
      });
    }
    return rows;
  });
</script>

<div class="memory-viewer">
  <h2>Memory</h2>
  
  <div class="memory-table">
    <div class="header">
      <span class="addr">ADDR</span>
      <span class="data">DATA</span>
      <span class="chars">CHARS</span>
    </div>
    <div class="rows">
      {#each memoryView as row}
        <div class="row" class:current={state && row.addr <= state.pc && state.pc < row.addr + bytesPerRow}>
          <span class="addr">{toHex(row.addr)}</span>
          <span class="data">{row.words.join(' ')}</span>
          <span class="chars">{row.chars}</span>
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
    padding: 1rem;
    overflow: hidden;
  }

  h2 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    color: #00ff88;
  }

  .memory-table {
    flex: 1;
    background: #1a1a1a;
    border: 1px solid #333;
    overflow: auto;
    font-size: 0.75rem;
  }

  .header {
    display: flex;
    padding: 0.25rem;
    background: #252525;
    position: sticky;
    top: 0;
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
    padding: 0.1rem 0.25rem;
  }

  .row:hover {
    background: #252525;
  }

  .row.current {
    background: #003300;
    border-left: 2px solid #00ff88;
  }

  .addr {
    width: 50px;
    color: #888;
  }

  .data {
    width: 400px;
    color: #00ffff;
    letter-spacing: 0.1em;
  }

  .chars {
    color: #888;
  }
</style>
