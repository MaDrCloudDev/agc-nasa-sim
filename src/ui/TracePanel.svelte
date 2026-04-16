<script lang="ts">
    interface TraceEntry {
        cycle: number;
        address: number;
        raw: number;
        mnemonic: string;
        operand: number;
        result: string;
    }

    interface Props {
        trace: TraceEntry[];
        format?: "hex16" | "octal15";
    }

    let { trace, format = "hex16" }: Props = $props();

    interface DisplayEntry {
        cycle: number;
        address: string;
        mnemonic: string;
        result: string;
        count: number;
    }

    let displayEntries = $derived.by((): DisplayEntry[] => {
        if (!trace || trace.length === 0) return [];

        const entries: DisplayEntry[] = [];
        
        for (const entry of trace) {
            const addrStr = format === "octal15" 
                ? entry.address.toString(8).padStart(4, "0")
                : entry.address.toString(16).padStart(4, "0");

            const last = entries[entries.length - 1];
            if (
                last &&
                last.mnemonic === entry.mnemonic &&
                last.address === addrStr &&
                last.result === entry.result
            ) {
                last.count++;
            } else {
                entries.push({
                    cycle: entry.cycle,
                    address: addrStr,
                    mnemonic: entry.mnemonic,
                    result: entry.result,
                    count: 1
                });
            }
        }
        
        return entries;
    });
</script>

<div class="trace-panel">
    <div class="trace-header">
        <span class="col-cycle">CY</span>
        <span class="col-addr">ADDR</span>
        <span class="col-mnem">OP</span>
        <span class="col-result">RESULT</span>
    </div>
    <div class="trace-list">
        {#each displayEntries as entry, i}
            <div class="trace-row" class:alt={i % 2 === 1}>
                <span class="col-cycle">{entry.cycle}</span>
                <span class="col-addr">{entry.address}</span>
                <span class="col-mnem">{entry.mnemonic}</span>
                <span class="col-result">
                    {entry.result}
                    {#if entry.count > 1}
                        <span class="count">×{entry.count}</span>
                    {/if}
                </span>
            </div>
        {/each}
    </div>
</div>

<style>
    .trace-panel {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: #0a0a0a;
        font-family: "Courier New", monospace;
        font-size: 0.75rem;
        overflow: hidden;
    }

    .trace-header {
        display: flex;
        padding: 0.4rem 0.5rem;
        background: #111;
        border-bottom: 1px solid #333;
        color: #00ff88;
        font-weight: bold;
        font-size: 0.7rem;
        letter-spacing: 0.05em;
    }

    .trace-list {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
    }

    .trace-row {
        display: flex;
        padding: 0.2rem 0.5rem;
        border-bottom: 1px solid #1a1a1a;
        color: #ccc;
    }

    .trace-row.alt {
        background: #0d0d0d;
    }

    .trace-row:hover {
        background: #1a1a1a;
    }

    .col-cycle {
        width: 50px;
        color: #666;
        flex-shrink: 0;
    }

    .col-addr {
        width: 50px;
        color: #88aaff;
        flex-shrink: 0;
    }

    .col-mnem {
        width: 80px;
        color: #00ff88;
        flex-shrink: 0;
        font-weight: bold;
    }

    .col-result {
        flex: 1;
        color: #aaa;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .count {
        color: #666;
        margin-left: 0.3rem;
    }
</style>
