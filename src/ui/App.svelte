<script lang="ts">
  import Dsky from "./Dsky.svelte";
  import MemoryViewer from "./MemoryViewer.svelte";
  import TracePanel from "./TracePanel.svelte";
  import Guidance from "./Guidance.svelte";
  import AboutModal from "./AboutModal.svelte";
  import { AgcBlock2Cpu } from "../core/block2/cpu.js";
  import type { ProgramData } from "../core/types.js";
  import block2KeyEcho from "../programs/block2-key-echo.json";
  import { onMount } from "svelte";

  type Page = "AGC";
  let currentPage = $state<Page>("AGC");
  let showGuidance = $state(true);
  let showAbout = $state(false);

  let cpuB2: AgcBlock2Cpu | null = null;
  let animationFrameId: number | null = null;
  let running = $state(false);
  let halted = $state(false);
  let cycleCount = $state(0);
  let pc = $state(0);
  let acc = $state(0);
  let trace: {
    cycle: number;
    address: number;
    raw: number;
    mnemonic: string;
    operand: number;
    result: string;
  }[] = $state([]);
  let memory = $state<Uint16Array>(new Uint16Array(4096));

  let dispProg = $state<number | null>(null);
  let loadedProgramStart = $state<number | null>(null);
  let loadedProgramLength = $state<number | null>(null);
  let dispVerb = $state<number | null>(null);
  let dispNoun = $state<number | null>(null);
  let dispR1 = $state<number | null>(null);
  let dispR2 = $state<number | null>(null);
  let dispR3 = $state<number | null>(null);

  let inputPhase = $state<
    "IDLE" | "VERB" | "NOUN" | "DATA1" | "DATA2" | "DATA3" | "ERROR"
  >("IDLE");
  let inputBuffer = $state("");

  let lampKeyRel = $state(false);
  let lampRestart = $state(false);
  let lampUplinkActy = $state(false);

  function pulseLamp(setter: (v: boolean) => void, ms: number = 300) {
    setter(true);
    setTimeout(() => setter(false), ms);
  }

  let leftWidth = $state(34);
  let rightWidth = $state(28);
  let isDraggingLeft = $state(false);
  let isDraggingRight = $state(false);

  function startDragLeft(e: MouseEvent) {
    isDraggingLeft = true;
    document.addEventListener("mousemove", onDragLeft);
    document.addEventListener("mouseup", stopDrag);
  }

  function startDragRight(e: MouseEvent) {
    isDraggingRight = true;
    document.addEventListener("mousemove", onDragRight);
    document.addEventListener("mouseup", stopDrag);
  }

  function onDragLeft(e: MouseEvent) {
    if (!isDraggingLeft) return;
    const totalWidth = window.innerWidth;
    const newPercent = (e.clientX / totalWidth) * 100;
    leftWidth = Math.max(20, Math.min(45, newPercent));
  }

  function onDragRight(e: MouseEvent) {
    if (!isDraggingRight) return;
    const totalWidth = window.innerWidth;
    const newPercent = ((totalWidth - e.clientX) / totalWidth) * 100;
    rightWidth = Math.max(20, Math.min(45, newPercent));
  }

  function stopDrag() {
    isDraggingLeft = false;
    isDraggingRight = false;
    document.removeEventListener("mousemove", onDragLeft);
    document.removeEventListener("mousemove", onDragRight);
    document.removeEventListener("mouseup", stopDrag);
  }

  let keyboardBuffer = $state<number[]>([]);

  function initCpu() {
    if (!cpuB2) {
      cpuB2 = new AgcBlock2Cpu();
      loadProgram(block2KeyEcho as ProgramData);
    }
  }

  function sync() {
    if (!cpuB2) return;
    const state = cpuB2.getState();
    pc = cpuB2.pc;
    acc = cpuB2.acc;
    halted = cpuB2.halted;
    cycleCount = cpuB2.cycleCount;
    trace = cpuB2.trace.map((t) => ({
      cycle: t.cycle,
      address: t.address,
      raw: t.raw,
      mnemonic: t.mnemonic,
      operand: t.operand ?? 0,
      result: t.result,
    }));
    const mem = new Uint16Array(4096);
    mem.set(state.memoryErasable, 0);
    mem.set(state.fixedBank0, 0o2000);
    memory = mem;
    // Update R1/R2/R3 from channels 0o11/0o12/0o13 (display registers)
    dispR1 = cpuB2.readChannel(0o11);
    dispR2 = cpuB2.readChannel(0o12);
    dispR3 = cpuB2.readChannel(0o13);
  }

  function loadProgram(program: ProgramData) {
    stop();
    initCpu();
    if (!cpuB2) return;
    cpuB2.reset();
    keyboardBuffer.length = 0;
    cpuB2.loadProgram(program);
    loadedProgramStart = program.startAddress;
    loadedProgramLength = program.words.length;
    dispProg = program.entryPoint;
    dispVerb = null;
    dispNoun = null;
    dispR1 = null;
    dispR2 = null;
    dispR3 = null;
    inputPhase = "IDLE";
    inputBuffer = "";
    // Sync but don't auto-run
    trace = [];
    sync();
  }

  function step() {
    initCpu();
    if (!cpuB2 || cpuB2.halted) return;
    if (keyboardBuffer.length > 0) {
      cpuB2.writeChannel(0o10, keyboardBuffer.shift()!);
      pulseLamp((v) => (lampUplinkActy = v), 120);
      // Execute two instructions so READ+WRITE complete in one step
      cpuB2.step(); // READ key from channel 10 into A
    }
    cpuB2.step(); // WRITE A to channel 11 (display)
    sync();
  }

  function run() {
    initCpu();
    if (running || !cpuB2 || cpuB2.halted) return;
    running = true;

    const tick = () => {
      if (!running || !cpuB2 || cpuB2.halted) {
        running = false;
        sync();
        return;
      }
      if (keyboardBuffer.length > 0) {
        cpuB2!.writeChannel(0o10, keyboardBuffer.shift()!);
        pulseLamp((v) => (lampUplinkActy = v), 120);
      }
      for (let i = 0; i < 10 && !cpuB2!.halted; i++) cpuB2!.step();
      sync();
      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);
  }

  function stop() {
    running = false;
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  function reset() {
    stop();
    pulseLamp((v) => (lampRestart = v), 400);
    loadProgram(block2KeyEcho as ProgramData);
  }

  type DskyKey =
    | "0"
    | "1"
    | "2"
    | "3"
    | "4"
    | "5"
    | "6"
    | "7"
    | "8"
    | "9"
    | "VERB"
    | "NOUN"
    | "PLUS"
    | "MINUS"
    | "CLEAR"
    | "ENTER"
    | "PROCEED"
    | "KEYREL"
    | "RESET";

  function dskyKeypress(key: DskyKey) {
    const KEY_ENTER = 10,
      KEY_PROCEED = 11,
      KEY_CLEAR = 12,
      KEY_RESET = 13;
    const KEY_VERB = 14,
      KEY_NOUN = 15,
      KEY_KEYREL = 16,
      KEY_MINUS = 17;

    if (key === "RESET") {
      reset();
      return;
    }

    if (key === "CLEAR") {
      keyboardBuffer.push(KEY_CLEAR);
      if (inputBuffer.length > 0) {
        inputBuffer = inputBuffer.slice(0, -1);
      } else {
        inputPhase = "IDLE";
        inputBuffer = "";
      }
      return;
    }

    if (key === "VERB") {
      keyboardBuffer.push(KEY_VERB);
      inputPhase = "VERB";
      inputBuffer = "";
      return;
    }

    if (key === "NOUN") {
      keyboardBuffer.push(KEY_NOUN);
      inputPhase = "NOUN";
      inputBuffer = "";
      return;
    }

    if (key === "ENTER") {
      keyboardBuffer.push(KEY_ENTER);
      if (inputPhase === "VERB" && inputBuffer.length > 0) {
        const val = parseInt(inputBuffer, 10);
        dispVerb = val;
        inputPhase = "IDLE";
        inputBuffer = "";
      } else if (inputPhase === "NOUN" && inputBuffer.length > 0) {
        const val = parseInt(inputBuffer, 10);
        dispNoun = val;
        inputPhase = "IDLE";
        inputBuffer = "";
      } else if (inputPhase === "DATA1") {
        dispR1 = parseInt(inputBuffer || "0", 10);
        inputPhase = "DATA2";
        inputBuffer = "";
      } else if (inputPhase === "DATA2") {
        dispR2 = parseInt(inputBuffer || "0", 10);
        inputPhase = "DATA3";
        inputBuffer = "";
      } else if (inputPhase === "DATA3") {
        dispR3 = parseInt(inputBuffer || "0", 10);
        inputPhase = "IDLE";
        inputBuffer = "";
      }
      return;
    }

    if (key === "PROCEED") {
      keyboardBuffer.push(KEY_PROCEED);
      if (dispVerb !== null && dispNoun !== null) {
        inputPhase = "DATA1";
        inputBuffer = "";
      }
      if (dispVerb !== null && dispNoun !== null) {
        dispProg = 1;
        dispR1 = dispVerb + dispNoun;
      }
      step();
      return;
    }

    if (key === "KEYREL") {
      keyboardBuffer.push(KEY_KEYREL);
      pulseLamp((v) => (lampKeyRel = v), 400);
      return;
    }

    if (key === "MINUS") {
      keyboardBuffer.push(KEY_MINUS);
      if (!inputBuffer.startsWith("-")) {
        inputBuffer = "-" + inputBuffer;
      }
      return;
    }

    if (key === "PLUS") {
      if (inputBuffer.startsWith("-")) {
        inputBuffer = inputBuffer.slice(1);
      }
      return;
    }

    const numMatch = key.match(/^[0-9]$/);
    if (numMatch) {
      keyboardBuffer.push(parseInt(numMatch[0], 10));
      if (inputBuffer.length < 5) {
        inputBuffer += key;
      }
      step();
      return;
    }
  }

  onMount(() => {
    initCpu();
  });
</script>

<div class="app">
  <header>
    <nav class="nav">
      <button
        type="button"
        class="nav-link"
        class:active={currentPage === "AGC"}
        onclick={() => (currentPage = "AGC")}>AGC Emulator</button
      >
      {#if currentPage === "AGC"}
        <span class="nav-divider"></span>
      {/if}
      <span class="nav-spacer"></span>
      <button
        type="button"
        class="nav-link"
        class:active={showAbout}
        onclick={() => (showAbout = true)}>About</button
      >
      <button
        type="button"
        class="nav-link"
        class:active={showGuidance}
        onclick={() => (showGuidance = !showGuidance)}>Guide</button
      >
    </nav>
  </header>

  <AboutModal open={showAbout} onClose={() => (showAbout = false)} />

  <div class="main">
    <aside class="left-panel" style="width: {leftWidth}%">
      {#if currentPage === "AGC"}
        <Dsky
          {running}
          {halted}
          {cycleCount}
          prog={dispProg}
          verb={dispVerb}
          noun={dispNoun}
          r1={dispR1}
          r2={dispR2}
          r3={dispR3}
          numericBase="oct"
          {inputPhase}
          {inputBuffer}
          lamps={{
            UPLINK_ACTY: lampUplinkActy,
            RESTART: lampRestart,
            KEY_REL: lampKeyRel,
            OPR_ERR: inputPhase === "ERROR",
            PROG: running && !halted,
            STBY: !running && !halted,
          }}
          simControls={false}
          onDskyKey={dskyKeypress}
          onStep={step}
          onRun={run}
          onStop={stop}
          onReset={reset}
        />
      {/if}
    </aside>

    <button
      type="button"
      class="resize-handle"
      class:dragging={isDraggingLeft}
      onmousedown={startDragLeft}
      aria-label="Resize left panel"
    ></button>

    <main class="center-panel">
      {#if currentPage === "AGC" && showGuidance}
        <Guidance pendingKey={keyboardBuffer[0] ?? null} />
      {/if}

        <MemoryViewer
          {memory}
          {pc}
          format="octal15"
        loadedProgramStart={loadedProgramStart}
        loadedProgramLength={loadedProgramLength}
        />
    </main>

    <button
      type="button"
      class="resize-handle"
      class:dragging={isDraggingRight}
      onmousedown={startDragRight}
      aria-label="Resize right panel"
    ></button>

    <aside class="right-panel" style="width: {rightWidth}%">
      <TracePanel {trace} format="octal15" />
    </aside>
  </div>
</div>

<style>
  :global(*) {
    scrollbar-width: thin;
    scrollbar-color: #333 #0a0a0a;
  }

  :global(::-webkit-scrollbar) {
    width: 6px;
    height: 6px;
  }

  :global(::-webkit-scrollbar-track) {
    background: #0a0a0a;
  }

  :global(::-webkit-scrollbar-thumb) {
    background: #333;
    border-radius: 3px;
  }

  :global(::-webkit-scrollbar-thumb:hover) {
    background: #444;
  }

  .app {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: #0a0a0a;
    color: #e0e0e0;
    overflow: hidden;
  }

  header {
    background: #1a1a1a;
    border-bottom: 1px solid #333;
    padding: 0.5rem 1rem;
    flex-shrink: 0;
  }

  .nav {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .nav-spacer {
    flex: 1;
  }

  .nav-divider {
    width: 1px;
    height: 16px;
    background: #333;
    margin: 0 0.25rem;
    flex-shrink: 0;
  }

  .nav-link {
    background: transparent;
    border: none;
    color: #666;
    font-family: "Courier New", monospace;
    font-size: 0.9rem;
    padding: 0.25rem 0.5rem;
    cursor: pointer;
    transition: color 0.2s;
  }

  .nav-link:hover {
    color: #888;
  }

  .nav-link.active {
    color: #00ff88;
    border-bottom: 1px solid #00ff88;
  }

  .main {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .left-panel {
    overflow-y: auto;
    padding-right: 0.5rem;
    background: #0f0f0f;
    padding-left: 0.5rem;
    flex-shrink: 0;
    min-width: 280px;
  }

  /* .center-panel */
  .center-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-width: 250px;
  }
  .right-panel {
    overflow: hidden;
    background: #0f0f0f;
    padding-left: 0.5rem;
    flex-shrink: 0;
    min-width: 250px;
  }

  .resize-handle {
    width: 4px;
    background: #252525;
    cursor: col-resize;
    flex-shrink: 0;
    transition: background 0.2s;
    border: none;
    padding: 0;
    margin: 0;
    outline: none;
    min-width: 4px;
    min-height: 100%;
  }

  .resize-handle:hover,
  .resize-handle.dragging,
  .resize-handle:focus {
    background: #00ff88;
  }

  @media (max-width: 900px) {
    .main {
      flex-direction: column;
      overflow-y: auto;
    }

    .left-panel,
    .center-panel,
    .right-panel {
      width: 100% !important;
      min-width: 0;
      padding-left: 0.5rem;
      padding-right: 0.5rem;
    }

    .left-panel,
    .right-panel {
      padding-bottom: 0.5rem;
    }

    .center-panel {
      min-height: 20rem;
    }

    .right-panel {
      min-height: 16rem;
    }

    .resize-handle {
      display: none;
    }
  }
</style>
