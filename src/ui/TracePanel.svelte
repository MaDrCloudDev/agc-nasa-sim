<script lang="ts">
    interface Props {
        trace: {
            cycle: number;
            address: number;
            raw: number;
            mnemonic: string;
            operand: number;
            result: string;
        }[];
        format?: 'hex16' | 'octal15';
    }

    let { trace, format = 'hex16' }: Props = $props();
    
    // Derived: compress trace into runs
    let runs = $derived.by(() => {
        if (!trace || trace.length === 0) return [];
        const result: {cycle: number; address: number; mnemonic: string; result: string; count: number}[] = [];
        for (const entry of trace) {
            const last = result[result.length - 1];
            if (last && last.mnemonic === entry.mnemonic && last.address === entry.address) {
                last.count++;
            } else {
                result.push({
                    cycle: entry.cycle,
                    address: entry.address,
                    mnemonic: entry.mnemonic,
                    result: entry.result,
                    count: 1
                });
            }
        }
        return result;
    });

    let scrollContainer = $state<HTMLDivElement | undefined>(undefined);

    function toHex(val: number): string {
        return val.toString(16).toUpperCase().padStart(4, "0");
    }

    function toOct(val: number, digits: number): string {
        return val.toString(8).toUpperCase().padStart(digits, "0");
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
                {#each runs as entry}
                    <div class="row">
                        <span class="cyc">{entry.cycle.toString().padStart(3)}</span>
                        <span class="adr">{format === 'octal15' ? toOct(entry.address, 4) : toHex(entry.address)}</span>
                        <span class="mnemonic">{entry.mnemonic}</span>
                        <span class="res">{entry.count > 1 ? '×' + entry.count : entry.result}</span>
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
        padding: 0.3rem;
        box-sizing: border-box;
    }

    h2 {
        margin: 0 0 0.2rem 0;
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
        font-size: 0.55rem;
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
        width: 35px;
        color: #888;
        flex-shrink: 0;
        text-align: right;
        padding-right: 8px;
        box-sizing: border-box;
    }

    .adr {
        width: 35px;
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
