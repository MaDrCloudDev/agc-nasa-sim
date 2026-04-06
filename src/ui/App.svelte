<script lang="ts">
  import Dsky from "./Dsky.svelte";
  import MemoryViewer from "./MemoryViewer.svelte";
  import TracePanel from "./TracePanel.svelte";
  import DemoPanel from "./DemoPanel.svelte";
  import { AgcCpu } from "../core/cpu.js";
  import type { ProgramData } from "../core/types.js";
  import keyboardEcho from "../programs/keyboard-echo.json";
  import counterDemo from "../programs/counter-demo.json";
  import loopDemo from "../programs/loop-demo.json";
  import { onMount } from "svelte";

  type Page = 'AGC' | 'DEMO';
  let currentPage = $state<Page>('AGC');

  let cpu: AgcCpu | null = null;
  let demoCpu: AgcCpu | null = null;
  let animationFrameId: number | null = null;
  let demoAnimationFrameId: number | null = null;
  let keyboardBuffer: number[] = [];
  let demoOutput: { channel: number; value: number }[] = $state([]);
  let running = $state(false);
  let demoRunning = $state(false);
  let halted = $state(false);
  let demoHalted = $state(false);
  let cycleCount = $state(0);
  let demoCycleCount = $state(0);
  let pc = $state(0);
  let acc = $state(0);
  let demoPc = $state(0);
  let demoAcc = $state(0);
  let trace: { cycle: number; address: number; raw: number; mnemonic: string; operand: number; result: string }[] = $state([]);
  let demoTrace: { cycle: number; address: number; raw: number; mnemonic: string; operand: number; result: string }[] = $state([]);
  let memory = $state<Uint16Array>(new Uint16Array(4096));
  let demoMemory = $state<Uint16Array>(new Uint16Array(4096));

  let dispProg = $state<number | null>(null);
  let dispVerb = $state<number | null>(null);
  let dispNoun = $state<number | null>(null);
  let dispR1 = $state<number | null>(null);
  let dispR2 = $state<number | null>(null);
  let dispR3 = $state<number | null>(null);

  let inputPhase = $state<'IDLE' | 'VERB' | 'NOUN' | 'DATA1' | 'DATA2' | 'DATA3' | 'ERROR'>('IDLE');
  let inputBuffer = $state('');

  let leftWidth = $state(30);
  let rightWidth = $state(25);
  let isDraggingLeft = $state(false);
  let isDraggingRight = $state(false);

  const demoPrograms = [
    { id: 'counter' as const, name: 'Counter', description: 'Increments counter by 1 each step. Halts at 100. ~600 cycles.', data: counterDemo as ProgramData },
    { id: 'loop' as const, name: 'Loop', description: 'Decrements counter by 1 each step. Halts at underflow. ~500 cycles.', data: loopDemo as ProgramData }
  ];
  let currentDemoProgram = $state<ProgramData>(counterDemo as ProgramData);

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
    leftWidth = Math.max(20, Math.min(50, newPercent));
  }

  function onDragRight(e: MouseEvent) {
    if (!isDraggingRight) return;
    const totalWidth = window.innerWidth;
    const newPercent = ((totalWidth - e.clientX) / totalWidth) * 100;
    rightWidth = Math.max(20, Math.min(50, newPercent));
  }

  function stopDrag() {
    isDraggingLeft = false;
    isDraggingRight = false;
    document.removeEventListener("mousemove", onDragLeft);
    document.removeEventListener("mousemove", onDragRight);
    document.removeEventListener("mouseup", stopDrag);
  }

  function initCpu() {
    if (!cpu) {
      cpu = new AgcCpu();
      cpu.setKeyboardReader(() => {
        if (keyboardBuffer.length > 0) {
          return keyboardBuffer.shift()!;
        }
        return 0;
      });
      loadProgram(keyboardEcho as ProgramData);
    }
  }

  function initDemoCpu() {
    if (!demoCpu) {
      demoCpu = new AgcCpu();
      demoCpu.setOutputWriter((channel, value) => {
        demoOutput = [...demoOutput, { channel, value }];
      });
      loadDemoProgram(currentDemoProgram);
    }
  }

  function sync() {
    if (!cpu) return;
    pc = cpu.pc;
    acc = cpu.acc;
    halted = cpu.halted;
    cycleCount = cpu.cycleCount;
    trace = [...cpu.trace];
    memory = new Uint16Array(cpu.memory.dump(0, cpu.memory.size));

    if (cpu.output[1] !== undefined) {
      dispR1 = cpu.output[1];
      delete cpu.output[1];
    }
    if (cpu.output[2] !== undefined) {
      dispR2 = cpu.output[2];
      delete cpu.output[2];
    }
    if (cpu.output[3] !== undefined) {
      dispR3 = cpu.output[3];
      delete cpu.output[3];
    }
  }

  function syncDemo() {
    if (!demoCpu) return;
    demoPc = demoCpu.pc;
    demoAcc = demoCpu.acc;
    demoHalted = demoCpu.halted;
    demoCycleCount = demoCpu.cycleCount;
    demoTrace = [...demoCpu.trace];
    demoMemory = new Uint16Array(demoCpu.memory.dump(0, demoCpu.memory.size));
  }

  function loadProgram(program: ProgramData) {
    stop();
    initCpu();
    cpu!.reset();
    keyboardBuffer = [];
    cpu!.loadProgram(program);
    dispProg = program.entryPoint;
    dispVerb = null;
    dispNoun = null;
    dispR1 = null;
    dispR2 = null;
    dispR3 = null;
    inputPhase = 'IDLE';
    inputBuffer = '';
    sync();
  }

  function loadDemoProgram(program: ProgramData) {
    stopDemo();
    initDemoCpu();
    demoCpu!.reset();
    demoOutput = [];
    demoCpu!.loadProgram(program);
    syncDemo();
  }

  function step() {
    initCpu();
    if (cpu!.halted) return;
    cpu!.step();
    sync();
  }

  function demoStep() {
    initDemoCpu();
    if (demoCpu!.halted) return;
    demoCpu!.step();
    syncDemo();
  }

  function run() {
    initCpu();
    if (running || cpu!.halted) return;
    running = true;

    const tick = () => {
      if (!running || !cpu || cpu.halted) {
        running = false;
        sync();
        return;
      }
      for (let i = 0; i < 100 && !cpu.halted; i++) {
        cpu.step();
      }
      sync();
      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);
  }

  function demoRun() {
    initDemoCpu();
    if (demoRunning || demoCpu!.halted) return;
    demoRunning = true;

    const tick = () => {
      if (!demoRunning || !demoCpu || demoCpu.halted) {
        demoRunning = false;
        syncDemo();
        return;
      }
      for (let i = 0; i < 100 && !demoCpu.halted; i++) {
        demoCpu.step();
      }
      syncDemo();
      demoAnimationFrameId = requestAnimationFrame(tick);
    };

    demoAnimationFrameId = requestAnimationFrame(tick);
  }

  function stop() {
    running = false;
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  function stopDemo() {
    demoRunning = false;
    if (demoAnimationFrameId !== null) {
      cancelAnimationFrame(demoAnimationFrameId);
      demoAnimationFrameId = null;
    }
  }

  function reset() {
    stop();
    loadProgram(keyboardEcho as ProgramData);
  }

  function demoReset() {
    stopDemo();
    loadDemoProgram(currentDemoProgram);
  }

  function onDemoProgramChange(program: ProgramData) {
    currentDemoProgram = program;
    loadDemoProgram(program);
  }

  type DskyKey = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
    | 'VERB' | 'NOUN' | 'CLEAR' | 'ENTER'
    | 'PROCEED' | 'KEYREL' | 'RESET' | 'MINUS';

  function dskyKeypress(key: DskyKey) {
    const KEY_ENTER = 1, KEY_PROCEED = 2, KEY_CLEAR = 3, KEY_RESET = 4;
    const KEY_VERB = 5, KEY_NOUN = 6, KEY_KEYREL = 7, KEY_MINUS = 8;

    if (key === 'RESET') {
      reset();
      return;
    }

    if (key === 'CLEAR') {
      keyboardBuffer.push(KEY_CLEAR);
      if (inputBuffer.length > 0) {
        inputBuffer = inputBuffer.slice(0, -1);
      } else {
        inputPhase = 'IDLE';
        inputBuffer = '';
      }
      return;
    }

    if (key === 'VERB') {
      keyboardBuffer.push(KEY_VERB);
      inputPhase = 'VERB';
      inputBuffer = '';
      return;
    }

    if (key === 'NOUN') {
      keyboardBuffer.push(KEY_NOUN);
      inputPhase = 'NOUN';
      inputBuffer = '';
      return;
    }

    if (key === 'ENTER') {
      keyboardBuffer.push(KEY_ENTER);
      if (inputPhase === 'VERB' && inputBuffer.length > 0) {
        const val = parseInt(inputBuffer, 10);
        dispVerb = val;
        inputPhase = 'IDLE';
        inputBuffer = '';
      } else if (inputPhase === 'NOUN' && inputBuffer.length > 0) {
        const val = parseInt(inputBuffer, 10);
        dispNoun = val;
        inputPhase = 'IDLE';
        inputBuffer = '';
      } else if (inputPhase === 'DATA1') {
        dispR1 = parseInt(inputBuffer || '0', 10);
        inputPhase = 'DATA2';
        inputBuffer = '';
      } else if (inputPhase === 'DATA2') {
        dispR2 = parseInt(inputBuffer || '0', 10);
        inputPhase = 'DATA3';
        inputBuffer = '';
      } else if (inputPhase === 'DATA3') {
        dispR3 = parseInt(inputBuffer || '0', 10);
        inputPhase = 'IDLE';
        inputBuffer = '';
      }
      return;
    }

    if (key === 'PROCEED') {
      keyboardBuffer.push(KEY_PROCEED);
      if (dispVerb !== null && dispNoun !== null) {
        inputPhase = 'DATA1';
        inputBuffer = '';
      }
      return;
    }

    if (key === 'MINUS') {
      keyboardBuffer.push(KEY_MINUS);
      if (!inputBuffer.startsWith('-')) {
        inputBuffer = '-' + inputBuffer;
      }
      return;
    }

    const numMatch = key.match(/^[0-9]$/);
    if (numMatch) {
      keyboardBuffer.push(parseInt(numMatch[0], 10));
      if (inputBuffer.length < 5) {
        inputBuffer += key;
      }
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
        class:active={currentPage === 'AGC'}
        onclick={() => currentPage = 'AGC'}
      >AGC Emulator</button>
      <button
        type="button"
        class="nav-link"
        class:active={currentPage === 'DEMO'}
        onclick={() => currentPage = 'DEMO'}
      >Demo Programs</button>
    </nav>
  </header>

  <div class="main">
    <aside class="left-panel" style="width: {leftWidth}%">
      {#if currentPage === 'AGC'}
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
          inputPhase={inputPhase}
          inputBuffer={inputBuffer}
          onDskyKey={dskyKeypress}
          onStep={step}
          onRun={run}
          onStop={stop}
          onReset={reset}
        />
      {:else}
        <DemoPanel
          program={currentDemoProgram}
          programs={demoPrograms}
          running={demoRunning}
          halted={demoHalted}
          cycleCount={demoCycleCount}
          pc={demoPc}
          acc={demoAcc}
          onStep={demoStep}
          onRun={demoRun}
          onStop={stopDemo}
          onReset={demoReset}
          onProgramChange={onDemoProgramChange}
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
      {#if currentPage === 'AGC'}
        <MemoryViewer {memory} {pc} />
      {:else}
        <MemoryViewer memory={demoMemory} pc={demoPc} />
      {/if}
    </main>

    <button
      type="button"
      class="resize-handle"
      class:dragging={isDraggingRight}
      onmousedown={startDragRight}
      aria-label="Resize right panel"
    ></button>

    <aside class="right-panel" style="width: {rightWidth}%">
      {#if currentPage === 'AGC'}
        <TracePanel {trace} />
      {:else}
        <TracePanel trace={demoTrace} />
      {/if}
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
    background: #0f0f0f;
    flex-shrink: 0;
  }

  .center-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-width: 200px;
  }

  .right-panel {
    overflow: hidden;
    background: #0f0f0f;
    flex-shrink: 0;
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
</style>