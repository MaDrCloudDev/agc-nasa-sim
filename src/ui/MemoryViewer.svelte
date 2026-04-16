<script lang="ts">
  interface Props {
    memory: Uint16Array;
    pc: number;
    loadedProgramStart?: number | null;
    loadedProgramLength?: number | null;
    format?: 'hex16' | 'octal15';
  }

  let {
    memory,
    pc,
    loadedProgramStart = null,
    loadedProgramLength = null,
    format = 'hex16'
  }: Props = $props();
  let programStart = $derived(loadedProgramStart);
  let programLength = $derived(loadedProgramLength);

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

  function formatAddr(val: number): string {
    return format === 'octal15' ? toOctAddr(val) : toHex(val);
  }

  let programEnd = $derived.by(() => {
    if (programStart === null || programLength === null || programLength <= 0) return null;
    return programStart + programLength - 1;
  });

  let programRangeLabel = $derived.by(() => {
    if (programStart === null || programLength === null) return "No program loaded";
    if (programLength <= 0) return "Empty program";
    const start = formatAddr(programStart);
    const end = formatAddr(programStart + programLength - 1);
    return programStart === programEnd ? `Program @ ${start}` : `Program @ ${start} - ${end}`;
  });

  let pcLabel = $derived.by(() => `PC ${formatAddr(pc)}`);
</script>

<div class="memory-viewer">
  <div class="memory-header">
    <div class="title-row">
      <h2>Memory</h2>
      <span class="pc-chip">{pcLabel}</span>
    </div>
    <div class="meta-row">
      <span>{programRangeLabel}</span>
      <span>0000-1777 is erasable RAM; 2000-3777 is the fixed-bank window.</span>
    </div>
    <div class="legend">
      <span class="legend-item"><span class="swatch current"></span> current PC</span>
      <span class="legend-item"><span class="swatch program"></span> loaded program</span>
    </div>
  </div>

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
        <div
          class="row"
          class:current={addr <= pc && pc < addr + 8}
          class:program={programStart !== null && programEnd !== null && addr + 7 >= programStart && addr <= programEnd}
        >
          <span class="addr">{formatAddr(addr)}</span>
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

  .memory-header {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin-bottom: 0.4rem;
  }

  .title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  h2 {
    margin: 0;
    font-size: 0.8rem;
    color: #00ff88;
    text-align: left;
  }

  .pc-chip {
    font-family: monospace;
    font-size: 0.55rem;
    letter-spacing: 0.05em;
    color: #aaf;
    background: #121a2a;
    border: 1px solid #2b3e5f;
    border-radius: 999px;
    padding: 0.18rem 0.45rem;
    white-space: nowrap;
  }

  .meta-row {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    color: #8f8f8f;
    font-size: 0.65rem;
    line-height: 1.1rem;
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    color: #666;
    font-size: 0.55rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .legend-item {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  }

  .swatch {
    width: 0.55rem;
    height: 0.55rem;
    border-radius: 0.12rem;
    border: 1px solid #333;
    display: inline-block;
  }

  .swatch.current {
    background: #00ff88;
    border-color: #00ff88;
  }

  .swatch.program {
    background: rgba(0, 255, 255, 0.22);
    border-color: #00ffff;
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

  .row.program {
    background: rgba(0, 255, 255, 0.05);
  }

  .row.current.program {
    background: linear-gradient(90deg, rgba(0, 255, 136, 0.18), rgba(0, 255, 255, 0.1));
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
