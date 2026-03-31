<script lang="ts">
  interface Props {
    trace: { cycle: number; address: number; raw: number; mnemonic: string; operand: number; result: string }[];
  }

  let { trace }: Props = $props();

  let scrollContainer = $state<HTMLDivElement | undefined>(undefined);

  function toHex(val: number): string {
    return val.toString(16).toUpperCase().padStart(4, "0");
  }

  $effect(() => {
    if (trace.length > 0 && scrollContainer) {
      setTimeout(() => {
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }, 0);
    }
  });
</script>

<div class="trace-panel">
  <h2>Trace</h2>

  <div class="trace-wrapper">
    <div class="trace-table" bind:this={scrollContainer}>
      <div class="header">
        <span class="cyc">CYC</span>
        <span class="adr">ADR</span>
        <span class="inst">INST</span>
        <span class="res">RESULT</span>
      </div>
      <div class="rows">
        {#each trace as entry}
          <div class="row">
            <span class="cyc">{entry.cycle.toString().padStart(4)}</span>
            <span class="adr">{toHex(entry.address)}</span>
            <span class="inst">
              <span class="mnemonic">{entry.mnemonic}</span>
              {#if entry.operand > 0}
                <span class="operand">{entry.operand}</span>
              {/if}
            </span>
            <span class="res">{entry.result}</span>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  .trace-panel {
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 0.5rem;
    box-sizing: border-box;
  }

  h2 {
    margin: 0 0 0.3rem 0;
    font-size: 0.9rem;
    color: #00ff88;
    text-align: right;
    flex-shrink: 0;
  }

  .trace-wrapper {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .trace-table {
    height: 100%;
    background: #1a1a1a;
    border: 1px solid #333;
    overflow-y: auto;
    overflow-x: hidden;
    font-size: 0.75rem;
    box-sizing: border-box;
  }

  .header {
    display: flex;
    padding: 0.2rem;
    background: #252525;
    position: sticky;
    top: 0;
    font-size: 0.7rem;
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
    flex-wrap: nowrap;
    padding: 0.1rem 0.2rem;
    border-bottom: 1px solid #1a1a1a;
    min-height: 1.2em;
  }

  .row:hover {
    background: #252525;
  }

  .cyc {
    width: 50px;
    color: #888;
    flex-shrink: 0;
    text-align: right;
    padding-right: 8px;
    box-sizing: border-box;
  }

  .adr {
    width: 50px;
    color: #888;
    flex-shrink: 0;
    padding-right: 8px;
    box-sizing: border-box;
  }

  .inst {
    width: 90px;
    color: #e0e0e0;
    flex-shrink: 0;
    white-space: nowrap;
    padding-right: 8px;
    box-sizing: border-box;
  }

  .mnemonic {
    color: #ff00ff;
    font-weight: bold;
  }

  .operand {
    color: #ffff00;
    margin-left: 4px;
  }

  .res {
    flex: 1;
    color: #00ffff;
    text-align: right;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
