<script lang="ts">
  interface Props {
    running: boolean;
    halted: boolean;
    cycleCount: number;
    prog: number | null;
    verb: number | null;
    noun: number | null;
    r1: number | null;
    r2: number | null;
    r3: number | null;
    inputPhase: 'IDLE' | 'VERB' | 'NOUN' | 'DATA1' | 'DATA2' | 'DATA3' | 'ERROR';
    inputBuffer: string;
    onDskyKey: (key: DskyKey) => void;
    onStep: () => void;
    onRun: () => void;
    onStop: () => void;
    onReset: () => void;
  }

  let {
    running,
    halted,
    cycleCount,
    prog,
    verb,
    noun,
    r1,
    r2,
    r3,
    inputPhase,
    inputBuffer,
    onDskyKey,
    onStep,
    onRun,
    onStop,
    onReset
  }: Props = $props();

  type DskyKey = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
    | 'VERB' | 'NOUN' | 'CLEAR' | 'ENTER'
    | 'PROCEED' | 'KEYREL' | 'RESET' | 'MINUS';

  function handleKeyClick(key: DskyKey) {
    onDskyKey(key);
  }

  function formatReg(val: number | null): string {
    if (val === null) return " +00";
    const abs = Math.abs(val);
    const digits = abs.toString().padStart(2, "0");
    const sign = val < 0 ? "-" : "+";
    return sign + digits;
  }

  function formatProg(val: number | null): string {
    if (val === null) return "00";
    return val.toString().padStart(2, "0");
  }

  const KEYS_TOP = ["1", "2", "3", "VERB", "NOUN", "CLEAR"];
  const KEYS_MID = ["4", "5", "6", "7", "8", "9"];
  const KEYS_BOT = ["0", "MINUS", "RESET", "ENTER", "PROCEED", "KEYREL"];

  function keyType(k: string): string {
    if (["0","1","2","3","4","5","6","7","8","9","MINUS"].includes(k)) return "num";
    if (["VERB","NOUN","CLEAR"].includes(k)) return "cmd";
    return "action";
  }
</script>

<div class="dsky">
  <div class="display-panel">
    <div class="display-row">
      <div class="disp-block">
        <div class="disp-label">PROG</div>
        <div class="disp-value">{formatProg(prog)}</div>
      </div>
      <div class="disp-block">
        <div class="disp-label">VERB</div>
        <div class="disp-value">{formatReg(verb)}</div>
      </div>
      <div class="disp-block">
        <div class="disp-label">NOUN</div>
        <div class="disp-value">{formatReg(noun)}</div>
      </div>
    </div>

    <div class="register-row">
      <div class="reg-block">
        <div class="reg-label">R1</div>
        <div class="reg-value">{formatReg(r1)}</div>
      </div>
      <div class="reg-block">
        <div class="reg-label">R2</div>
        <div class="reg-value">{formatReg(r2)}</div>
      </div>
      <div class="reg-block">
        <div class="reg-label">R3</div>
        <div class="reg-value">{formatReg(r3)}</div>
      </div>
    </div>

    <div class="input-display">
      <div class="input-label">
        {#if inputPhase === "VERB"}ENTER VERB
        {:else if inputPhase === "NOUN"}ENTER NOUN
        {:else if inputPhase === "DATA1"}ENTER R1
        {:else if inputPhase === "DATA2"}ENTER R2
        {:else if inputPhase === "DATA3"}ENTER R3
        {:else if inputPhase === "ERROR"}<span class="error-flash">ERROR</span>
        {:else}<span class="idle">SELECT VERB OR NOUN</span>{/if}
      </div>
      <div class="input-digits">
        {inputBuffer || "_"}
      </div>
    </div>
  </div>

  <div class="keyboard-panel">
    <div class="key-row">
      {#each KEYS_TOP as key}
        <button
          class="key {keyType(key)}"
          onclick={() => handleKeyClick(key as DskyKey)}
        >
          {key}
        </button>
      {/each}
    </div>
    <div class="key-row">
      {#each KEYS_MID as key}
        <button
          class="key {keyType(key)}"
          onclick={() => handleKeyClick(key as DskyKey)}
        >
          {key}
        </button>
      {/each}
    </div>
    <div class="key-row">
      {#each KEYS_BOT as key}
        <button
          class="key {keyType(key)}"
          onclick={() => handleKeyClick(key as DskyKey)}
        >
          {key === "KEYREL" ? "KEY REL" : key}
        </button>
      {/each}
    </div>
  </div>

  <div class="control-panel">
    <div class="control-row">
      <button class="ctrl-btn" onclick={onReset} disabled={running}>
        RESET
      </button>
      <button class="ctrl-btn" onclick={onStep} disabled={running || halted}>
        STEP
      </button>
      <button
        class="ctrl-btn run"
        onclick={running ? onStop : onRun}
        disabled={halted}
      >
        {running ? "STOP" : "RUN"}
      </button>
    </div>
    <div class="status-row">
      <span class="label">STATUS:</span>
      <span class="value" class:halted={halted} class:running={running && !halted}>
        {halted ? "HALTED" : running ? "RUNNING" : "IDLE"}
      </span>
      <span class="cycles">CYC: {cycleCount}</span>
    </div>
  </div>
</div>

<style>
  .dsky {
    display: flex;
    flex-direction: column;
    background: #1a1a1a;
    border: 2px solid #333;
    border-radius: 4px;
    padding: 0.5rem;
    gap: 0.5rem;
    user-select: none;
  }

  .display-panel {
    background: #0a0a0a;
    border: 2px solid #2a2a2a;
    border-radius: 2px;
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .display-row {
    display: flex;
    gap: 0.5rem;
  }

  .disp-block {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.2rem;
  }

  .disp-label {
    font-size: 0.6rem;
    color: #888;
    letter-spacing: 0.05em;
  }

  .disp-value {
    background: #0d1a0d;
    color: #00ff88;
    font-family: "Courier New", monospace;
    font-size: 1.4rem;
    font-weight: bold;
    padding: 0.2rem 0.4rem;
    border: 1px solid #1a3a1a;
    border-radius: 2px;
    min-width: 2.5rem;
    text-align: center;
    text-shadow: 0 0 8px #00ff88aa;
    letter-spacing: 0.1em;
  }

  .register-row {
    display: flex;
    gap: 0.4rem;
  }

  .reg-block {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.15rem;
  }

  .reg-label {
    font-size: 0.55rem;
    color: #888;
    letter-spacing: 0.05em;
  }

  .reg-value {
    background: #0d1a0d;
    color: #00ff88;
    font-family: "Courier New", monospace;
    font-size: 1rem;
    font-weight: bold;
    padding: 0.15rem 0.3rem;
    border: 1px solid #1a3a1a;
    border-radius: 2px;
    min-width: 2.2rem;
    text-align: center;
    text-shadow: 0 0 6px #00ff88aa;
    letter-spacing: 0.08em;
  }

  .input-display {
    background: #0d1a0d;
    border: 1px solid #1a3a1a;
    border-radius: 2px;
    padding: 0.3rem 0.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.2rem;
  }

  .input-label {
    font-size: 0.55rem;
    color: #00ff8888;
    letter-spacing: 0.1em;
  }

  .input-digits {
    color: #00ff88;
    font-family: "Courier New", monospace;
    font-size: 1.2rem;
    font-weight: bold;
    text-shadow: 0 0 8px #00ff88aa;
    letter-spacing: 0.2em;
    min-height: 1.5rem;
  }

  .error-flash {
    color: #ff4444;
    text-shadow: 0 0 8px #ff4444aa;
  }

  .idle {
    color: #448844;
  }

  .keyboard-panel {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    background: #111;
    border: 2px solid #2a2a2a;
    border-radius: 2px;
    padding: 0.5rem;
  }

  .key-row {
    display: flex;
    gap: 0.3rem;
  }

  .key {
    flex: 1;
    padding: 0.5rem 0.2rem;
    border-radius: 3px;
    font-family: "Courier New", monospace;
    font-size: 0.75rem;
    font-weight: bold;
    cursor: pointer;
    border: 2px solid;
    transition: all 0.1s;
    letter-spacing: 0.05em;
  }

  .key.num {
    background: #1a1a2a;
    border-color: #334;
    color: #88aaff;
  }

  .key.num:hover {
    background: #2a2a4a;
    border-color: #558;
    box-shadow: 0 0 6px #4466ff44;
  }

  .key.num:active {
    background: #334466;
    box-shadow: 0 0 12px #4466ff88;
    color: #ffffff;
  }

  .key.cmd {
    background: #2a1a1a;
    border-color: #433;
    color: #ffaa44;
  }

  .key.cmd:hover {
    background: #3a2a1a;
    border-color: #654;
    box-shadow: 0 0 6px #ff884444;
  }

  .key.cmd:active {
    background: #664422;
    box-shadow: 0 0 12px #ff884488;
    color: #ffffff;
  }

  .key.action {
    background: #1a2a1a;
    border-color: #343;
    color: #88ff88;
  }

  .key.action:hover {
    background: #2a3a2a;
    border-color: #565;
    box-shadow: 0 0 6px #44ff4444;
  }

  .key.action:active {
    background: #446644;
    box-shadow: 0 0 12px #44ff4488;
    color: #ffffff;
  }

  .control-panel {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .control-row {
    display: flex;
    gap: 0.3rem;
  }

  .ctrl-btn {
    flex: 1;
    padding: 0.4rem 0.2rem;
    background: #1a1a1a;
    color: #e0e0e0;
    border: 1px solid #00ff88;
    border-radius: 3px;
    font-family: "Courier New", monospace;
    font-size: 0.7rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.15s;
  }

  .ctrl-btn:hover:not(:disabled) {
    background: #00ff88;
    color: #0a0a0a;
  }

  .ctrl-btn:active:not(:disabled) {
    transform: scale(0.95);
  }

  .ctrl-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .ctrl-btn.run {
    border-color: #ffaa44;
  }

  .ctrl-btn.run:hover:not(:disabled) {
    background: #ffaa44;
  }

  .status-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.65rem;
    padding: 0.3rem 0.5rem;
    background: #0a0a0a;
    border: 1px solid #2a2a2a;
    border-radius: 2px;
  }

  .label {
    color: #888;
  }

  .value {
    font-weight: bold;
  }

  .value.halted {
    color: #ff4444;
  }

  .value.running {
    color: #00ff88;
  }

  .cycles {
    margin-left: auto;
    color: #666;
  }
</style>
