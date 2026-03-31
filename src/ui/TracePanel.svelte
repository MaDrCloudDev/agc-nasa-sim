<script lang="ts">
  import { getState } from '../stores/emulator.js';

  const state = $derived(getState());

  function toHex(val: number): string {
    return val.toString(16).toUpperCase().padStart(4, '0');
  }

  const trace = $derived(state?.trace ?? []);
</script>

<div class="trace-panel">
  <h2>Trace Log</h2>
  
  <div class="trace-table">
    <div class="header">
      <span class="cycle">CYCLE</span>
      <span class="addr">ADDR</span>
      <span class="raw">RAW</span>
      <span class="inst">INSTRUCTION</span>
      <span class="result">RESULT</span>
    </div>
    <div class="rows">
      {#each trace as entry}
        <div class="row">
          <span class="cycle">{entry.cycle.toString().padStart(5)}</span>
          <span class="addr">{toHex(entry.address)}</span>
          <span class="raw">0x{toHex(entry.raw)}</span>
          <span class="inst">
            <span class="mnemonic">{entry.mnemonic}</span>
            {#if entry.operand > 0}
              <span class="operand">{toHex(entry.operand)}</span>
            {/if}
          </span>
          <span class="result">{entry.result}</span>
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .trace-panel {
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

  .trace-table {
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
    border-bottom: 1px solid #1a1a1a;
  }

  .row:hover {
    background: #252525;
  }

  .cycle {
    width: 60px;
    color: #888;
  }

  .addr {
    width: 50px;
    color: #888;
  }

  .raw {
    width: 70px;
    color: #888;
  }

  .inst {
    width: 150px;
    color: #e0e0e0;
  }

  .mnemonic {
    color: #ff00ff;
    font-weight: bold;
    margin-right: 0.5rem;
  }

  .operand {
    color: #ffff00;
  }

  .result {
    flex: 1;
    color: #00ffff;
  }
</style>
