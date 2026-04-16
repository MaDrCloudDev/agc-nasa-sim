<script lang="ts">
  interface Props {
    memory: Uint16Array;
    pc: number;
    format?: 'hex16' | 'octal15';
  }

  let { memory, pc, format = 'hex16' }: Props = $props();

  function toHex(val: number): string {
    return val.toString(16).toUpperCase().padStart(4, "0");
  }

  function toOctAddr(val: number): string {
    return val.toString(8).toUpperCase().padStart(4, "0");
  }

  function toOctData15(word16: number): string {
    const data15 = word16 & 0x7fff;
    return data15.toString(8).toUpperCase().padStart(5, "0");
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
      {#if format === 'hex16'}
        <span class="chars">CH</span>
      {/if}
    </div>
    <div class="rows">
      {#each { length: 20 } as _, i}
        {@const addr = i * 8}
        {@const words = Array.from(memory.slice(addr, addr + 8))}
        <div class="row" class:current={addr <= pc && pc < addr + 8}>
          <span class="addr">{format === 'octal15' ? toOctAddr(addr) : toHex(addr)}</span>
          <span class="data">
            {#if format === 'octal15'}
              {words.map(w => toOctData15(w)).join(' ')}
            {:else}
              {words.map(w => toHex(w)).join(' ')}
            {/if}
          </span>
          {#if format === 'hex16'}
            <span class="chars">{words.map(w => charDisplay(w)).join('')}</span>
          {/if}
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
    margin: 0;
    font-size: 0.8rem;
    color: #00ff88;
    text-align: left;
  }

  .memory-table {
    flex: 1;
    background: #1a1a1a;
    border: 1px solid #333;
    overflow: auto;
    font-size: 0.6rem;
    font-family: monospace;
  }

  .header {
    display: flex;
    padding: 0.1rem 0.15rem;
    background: #252525;
    position: sticky;
    top: 0;
    font-size: 0.5rem;
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
    padding: 0.05rem 0.1rem;
  }

  .row:hover {
    background: #252525;
  }

  .row.current {
    background: #003300;
    border-left: 2px solid #00ff88;
  }

  .addr {
    width: 38px;
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
    width: 45px;
    color: #666;
    flex-shrink: 0;
  }
</style>
