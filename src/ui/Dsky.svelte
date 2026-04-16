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
    numericBase?: 'dec' | 'oct';
    inputPhase: 'IDLE' | 'VERB' | 'NOUN' | 'DATA1' | 'DATA2' | 'DATA3' | 'ERROR';
    inputBuffer: string;
    lamps?: Partial<Record<LampId, boolean>>;
    simControls?: boolean;
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
    numericBase = 'dec',
    inputPhase,
    inputBuffer,
    lamps = {},
    simControls = true,
    onDskyKey,
    onStep,
    onRun,
    onStop,
    onReset
  }: Props = $props();

  type DskyKey =
    | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
    | 'VERB' | 'NOUN'
    | 'PLUS' | 'MINUS'
    | 'CLEAR' | 'ENTER'
    | 'PROCEED' | 'KEYREL' | 'RESET';

  type LampId =
    | 'UPLINK_ACTY'
    | 'TEMP'
    | 'NO_ATT'
    | 'GIMBAL_LOCK'
    | 'STBY'
    | 'PROG'
    | 'KEY_REL'
    | 'RESTART'
    | 'OPR_ERR'
    | 'TRACKER'
    | 'ALT'
    | 'VEL';

  function handleKeyClick(key: DskyKey) {
    onDskyKey(key);
  }

  function formatReg(val: number | null): string {
    if (val === null) return "+00000";
    const abs = Math.abs(val);
    const digits = (numericBase === 'oct' ? abs.toString(8) : abs.toString()).padStart(5, "0");
    const sign = val < 0 ? "-" : "+";
    return sign + digits;
  }

  function formatProg(val: number | null): string {
    if (val === null) return "00";
    return (numericBase === 'oct' ? val.toString(8) : val.toString()).padStart(2, "0");
  }

  const KEYS_ROW0 = ["VERB", "NOUN", "PLUS", "MINUS"];
  const KEYS_ROW1 = ["7", "8", "9"];
  const KEYS_ROW2 = ["4", "5", "6"];
  const KEYS_ROW3 = ["1", "2", "3"];
  const KEYS_ROW4 = ["0", "CLEAR", "ENTER"];
  const KEYS_ROW5 = ["KEYREL", "PROCEED", "RESET"];

  function keyType(k: string): string {
    if (["0","1","2","3","4","5","6","7","8","9","PLUS","MINUS"].includes(k)) return "num";
    if (["VERB","NOUN","CLEAR"].includes(k)) return "cmd";
    return "action";
  }

  const LAMP_LEFT: LampId[] = ['UPLINK_ACTY', 'TEMP', 'NO_ATT', 'GIMBAL_LOCK', 'STBY', 'PROG'];
  const LAMP_RIGHT: LampId[] = ['KEY_REL', 'RESTART', 'OPR_ERR', 'TRACKER', 'ALT', 'VEL'];

  function lampLabel(id: LampId): string {
    switch (id) {
      case 'UPLINK_ACTY': return 'UPLINK\nACTY';
      case 'GIMBAL_LOCK': return 'GIMBAL\nLOCK';
      case 'KEY_REL': return 'KEY\nREL';
      case 'OPR_ERR': return 'OPR\nERR';
      default: return id.replace('_', '\n');
    }
  }
</script>

<div class="dsky">
  <div class="top">
    <div class="lamps" aria-label="Indicator lamps">
      <div class="lamp-col">
        {#each LAMP_LEFT as id}
          <div class="lamp" class:on={!!lamps[id]}>
            <div class="lamp-light"></div>
            <div class="lamp-label">{lampLabel(id)}</div>
          </div>
        {/each}
      </div>
      <div class="lamp-col">
        {#each LAMP_RIGHT as id}
          <div class="lamp" class:on={!!lamps[id]}>
            <div class="lamp-light"></div>
            <div class="lamp-label">{lampLabel(id)}</div>
          </div>
        {/each}
      </div>
    </div>

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
  </div>

  <div class="keyboard-panel" aria-label="Keypad">
    <div class="key-row row0">
      {#each KEYS_ROW0 as key}
        <button class="key {keyType(key)}" onclick={() => handleKeyClick(key as DskyKey)}>
          {key === 'PLUS' ? '+' : key === 'MINUS' ? '-' : key}
        </button>
      {/each}
    </div>
    <div class="key-row">
      {#each KEYS_ROW1 as key}
        <button class="key {keyType(key)}" onclick={() => handleKeyClick(key as DskyKey)}>{key}</button>
      {/each}
    </div>
    <div class="key-row">
      {#each KEYS_ROW2 as key}
        <button class="key {keyType(key)}" onclick={() => handleKeyClick(key as DskyKey)}>{key}</button>
      {/each}
    </div>
    <div class="key-row">
      {#each KEYS_ROW3 as key}
        <button class="key {keyType(key)}" onclick={() => handleKeyClick(key as DskyKey)}>{key}</button>
      {/each}
    </div>
    <div class="key-row row4">
      {#each KEYS_ROW4 as key}
        <button class="key {keyType(key)}" onclick={() => handleKeyClick(key as DskyKey)}>
          {key === 'CLEAR' ? 'CLR' : key === 'ENTER' ? 'ENTR' : key}
        </button>
      {/each}
    </div>
    <div class="key-row row5">
      {#each KEYS_ROW5 as key}
        <button class="key {keyType(key)}" onclick={() => handleKeyClick(key as DskyKey)}>
          {key === 'KEYREL' ? 'KEY REL' : key === 'PROCEED' ? 'PRO' : key === 'RESET' ? 'RSET' : key}
        </button>
      {/each}
    </div>
  </div>

  {#if simControls}
    <div class="control-panel">
      <div class="control-row">
        <button class="ctrl-btn" onclick={onReset} disabled={running}>
          RSET
        </button>
        <button class="ctrl-btn" onclick={onStep} disabled={running || halted}>
          EXEC
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
  {/if}

  <div class="help-section">
    <div class="help-title">DSKY CONTROLS</div>
    <div><strong>VERB</strong> — Enter verb</div>
    <div><strong>NOUN</strong> — Enter noun</div>
    <div><strong>ENTER</strong> — Confirm</div>
    <div><strong>CLEAR</strong> — Clear</div>
    <div><strong>RESET</strong> — Reset CPU</div>
  </div>

  <div class="help-section">
    <div class="help-title">CHANNELS</div>
    <div>CH0 — Keyboard IN</div>
    <div>CH1 — R1</div>
    <div>CH2 — R2</div>
    <div>CH3 — R3</div>
  </div>
</div>

<style>
  .dsky {
    display: flex;
    flex-direction: column;
    background: linear-gradient(180deg, #2a2a2a, #1d1d1d);
    border: 2px solid #3a3a3a;
    border-radius: 4px;
    padding: 0.4rem;
    gap: 0.4rem;
    user-select: none;
    width: 100%;
    min-width: 0;
    overflow: hidden;
    box-sizing: border-box;
  }

  .top {
    display: flex;
    gap: 0.4rem;
    align-items: stretch;
  }

  .lamps {
    background: #141414;
    border: 2px solid #3a3a3a;
    border-radius: 2px;
    padding: 0.3rem 0.25rem;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.25rem;
    flex-shrink: 0;
    align-content: start;
  }

  .lamp-col {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .lamp {
    display: grid;
    grid-template-columns: 10px 1fr;
    gap: 0.2rem;
    align-items: center;
  }

  .lamp-light {
    width: 10px;
    height: 10px;
    border-radius: 2px;
    background: #0b0b0b;
    border: 1px solid #2a2a2a;
    box-shadow: inset 0 0 2px #000;
  }

  .lamp.on .lamp-light {
    background: #ffd34d;
    border-color: #ffea9a;
    box-shadow: 0 0 8px #ffd34d66;
  }

  .lamp-label {
    font-size: 0.45rem;
    line-height: 0.55rem;
    color: #cfcfcf;
    font-family: ui-monospace, "Courier New", monospace;
    letter-spacing: 0.03em;
    white-space: pre-line;
  }

  .display-panel {
    background: #0a0a0a;
    border: 2px solid #3a3a3a;
    border-radius: 2px;
    padding: 0.4rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    min-width: 0;
    flex: 1;
    overflow: hidden;
  }

  .display-row {
    display: flex;
    gap: 0.3rem;
  }

  .disp-block {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.15rem;
    min-width: 0;
  }

  .disp-label {
    font-size: 0.5rem;
    color: #888;
    letter-spacing: 0.05em;
  }

  .disp-value {
    background: #071107;
    color: #47ff9c;
    font-family: ui-monospace, "Courier New", monospace;
    font-size: 0.9rem;
    font-weight: bold;
    padding: 0.15rem 0.25rem;
    border: 1px solid #1a3a1a;
    border-radius: 2px;
    min-width: 2rem;
    text-align: center;
    text-shadow: 0 0 8px #47ff9c66;
    letter-spacing: 0.1em;
  }

  .register-row {
    display: flex;
    gap: 0.25rem;
  }

  .reg-block {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.1rem;
    min-width: 0;
  }

  .reg-label {
    font-size: 0.45rem;
    color: #888;
    letter-spacing: 0.05em;
  }

  .reg-value {
    background: #071107;
    color: #47ff9c;
    font-family: ui-monospace, "Courier New", monospace;
    font-size: 0.7rem;
    font-weight: bold;
    padding: 0.1rem 0.2rem;
    border: 1px solid #1a3a1a;
    border-radius: 2px;
    min-width: 2.8rem;
    text-align: center;
    text-shadow: 0 0 8px #47ff9c66;
    letter-spacing: 0.05em;
    white-space: nowrap;
  }

  .input-display {
    background: #0d1a0d;
    border: 1px solid #1a3a1a;
    border-radius: 2px;
    padding: 0.25rem 0.4rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.15rem;
  }

  .input-label {
    font-size: 0.45rem;
    color: #00ff8888;
    letter-spacing: 0.1em;
  }

  .input-digits {
    color: #00ff88;
    font-family: "Courier New", monospace;
    font-size: 0.85rem;
    font-weight: bold;
    text-shadow: 0 0 6px #00ff88aa;
    letter-spacing: 0.15em;
    min-height: 1.2rem;
  }

  .error-flash {
    color: #ff4444;
    text-shadow: 0 0 6px #ff4444aa;
  }

  .idle {
    color: #448844;
  }

  .keyboard-panel {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    background: #141414;
    border: 2px solid #3a3a3a;
    border-radius: 2px;
    padding: 0.4rem;
  }

  .key-row {
    display: flex;
    gap: 0.2rem;
  }

  .key-row.row0 .key {
    padding: 0.4rem 0.15rem;
  }

  .key-row.row5 .key {
    padding: 0.4rem 0.15rem;
  }

  .key {
    flex: 1;
    padding: 0.4rem 0.15rem;
    border-radius: 2px;
    font-family: ui-monospace, "Courier New", monospace;
    font-size: 0.65rem;
    font-weight: bold;
    cursor: pointer;
    border: 2px solid;
    transition: all 0.1s;
    letter-spacing: 0.03em;
  }

  .key.num {
    background: #2b2b2b;
    border-color: #4a4a4a;
    color: #e6e6e6;
  }

  .key.num:hover {
    background: #343434;
    border-color: #5a5a5a;
  }

  .key.num:active {
    background: #334466;
    box-shadow: 0 0 10px #4466ff88;
    color: #ffffff;
  }

  .key.cmd {
    background: #2b2b2b;
    border-color: #4a4a4a;
    color: #ffd34d;
  }

  .key.cmd:hover {
    background: #3a2a1a;
    border-color: #654;
    box-shadow: 0 0 5px #ff884444;
  }

  .key.cmd:active {
    background: #664422;
    box-shadow: 0 0 10px #ff884488;
    color: #ffffff;
  }

  .key.action {
    background: #2b2b2b;
    border-color: #4a4a4a;
    color: #47ff9c;
  }

  .key.action:hover {
    background: #2a3a2a;
    border-color: #565;
    box-shadow: 0 0 5px #44ff4444;
  }

  .key.action:active {
    background: #446644;
    box-shadow: 0 0 10px #44ff4488;
    color: #ffffff;
  }

  .control-panel {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .control-row {
    display: flex;
    gap: 0.2rem;
  }

  .ctrl-btn {
    flex: 1;
    padding: 0.35rem 0.15rem;
    background: #232323;
    color: #e0e0e0;
    border: 1px solid #4a4a4a;
    border-radius: 2px;
    font-family: ui-monospace, "Courier New", monospace;
    font-size: 0.6rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.15s;
  }

  .ctrl-btn:hover:not(:disabled) {
    background: #2c2c2c;
    border-color: #47ff9c;
    color: #ffffff;
  }

  .ctrl-btn:active:not(:disabled) {
    transform: scale(0.95);
  }

  .ctrl-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .ctrl-btn.run {
    border-color: #ffd34d;
  }

  .ctrl-btn.run:hover:not(:disabled) {
    background: #ffaa44;
  }

  .status-row {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.55rem;
    padding: 0.25rem 0.4rem;
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

  .help-section {
    background: #1a1a1a;
    border: 1px solid #333;
    padding: 0.3rem;
    font-size: 0.55rem;
  }

  .help-section .help-title {
    color: #00ff88;
    font-family: "Courier New", monospace;
    margin-bottom: 0.25rem;
    font-size: 0.5rem;
    letter-spacing: 0.05em;
  }

  .help-section div {
    color: #888;
    margin-bottom: 0.1rem;
  }

  .help-section strong {
    color: #aaa;
  }
</style>
