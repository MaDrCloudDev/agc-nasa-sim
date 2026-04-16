<script lang="ts">
  import Dsky from "./Dsky.svelte";
  import MemoryViewer from "./MemoryViewer.svelte";
  import TracePanel from "./TracePanel.svelte";
  import DemoPanel from "./DemoPanel.svelte";
  import Guidance from "./Guidance.svelte";
  import { AgcCpu } from "../core/cpu.js";
  import { AgcBlock2Cpu } from "../core/block2/cpu.js";
  import type { ProgramData } from "../core/types.js";
  import keyboardEcho from "../programs/keyboard-echo.json";
  import block2KeyEcho from "../programs/block2-key-echo.json";
  import counterDemo from "../programs/counter-demo.json";
  import loopDemo from "../programs/loop-demo.json";
  import { onMount } from "svelte";

  type Page = 'AGC' | 'DEMO';
  let currentPage = $state<Page>('AGC');
  let showGuidance = $state(true);
  type CpuMode = 'v1' | 'block2';
  let cpuMode = $state<CpuMode>('v1');

  let cpu: AgcCpu | null = null;
  let cpuB2: AgcBlock2Cpu | null = null;
  let demoCpu: AgcCpu | null = null;
  let animationFrameId: number | null = null;
  let demoAnimationFrameId: number | null = null;
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

  let keyboardBuffer: number[] = [];

  function initCpu() {
    if (cpuMode === 'v1') {
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
      return;
    }

    if (!cpuB2) {
      cpuB2 = new AgcBlock2Cpu();
      loadBlock2Program(block2KeyEcho as ProgramData);
    }
  }

  $effect(() => {
    if (currentPage === 'AGC' && cpuMode === 'block2') {
      initCpu();
      if (!running && cpuB2 && !cpuB2.halted) {
        run();
      }
    }
  });

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
    if (cpuMode === 'v1') {
      if (!cpu) return;
      pc = cpu.pc;
      acc = cpu.acc;
      halted = cpu.halted;
      cycleCount = cpu.cycleCount;
      trace = [...cpu.trace];
      memory = new Uint16Array(cpu.memory.dump(0, cpu.memory.size));

      if (cpu.output[10] !== undefined) dispProg = cpu.output[10];
      if (cpu.output[11] !== undefined) dispVerb = cpu.output[11];
      if (cpu.output[12] !== undefined) dispNoun = cpu.output[12];
      if (cpu.output[1] !== undefined) dispR1 = cpu.output[1];
      if (cpu.output[2] !== undefined) dispR2 = cpu.output[2];
      if (cpu.output[3] !== undefined) dispR3 = cpu.output[3];
      return;
    }

    if (!cpuB2) return;
    pc = cpuB2.pc;
    acc = cpuB2.acc;
    halted = cpuB2.halted;
    cycleCount = cpuB2.cycleCount;
    trace = cpuB2.trace.map((t) => ({
      cycle: t.cycle,
      address: t.z,
      raw: t.raw,
      mnemonic: t.mnemonic,
      operand: 0,
      result: t.result,
    }));
    const mem = new Uint16Array(4096);
    mem.set(cpuB2.getState().memoryErasable, 0);
    mem.set(cpuB2.getState().fixedBank0, 0o2000);
    memory = mem;
    dispR1 = cpuB2.readChannel(0o11) ?? dispR1;
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
    if (cpuMode !== 'v1') return;
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

  function loadBlock2Program(program: ProgramData) {
    stop();
    initCpu();
    if (!cpuB2) return;
    cpuB2.reset();
    keyboardBuffer = [];
    cpuB2.loadProgram(program);
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
    if (cpuMode === 'v1') {
      if (cpu!.halted) return;
      const outKeysBefore = new Set(Object.keys(cpu!.output));
      let steps = 0;
      while (!cpu!.halted && steps < 50) {
        cpu!.step();
        steps++;
        const outKeysAfter = Object.keys(cpu!.output);
        if (outKeysAfter.some((k) => !outKeysBefore.has(k))) break;
      }
      sync();
      return;
    }

    if (!cpuB2 || cpuB2.halted) return;
    if (keyboardBuffer.length > 0) {
      cpuB2.writeChannel(0o10, keyboardBuffer.shift()!);
      pulseLamp((v) => (lampUplinkActy = v), 120);
    }
    const before = cpuB2.readChannel(0o11);
    let steps = 0;
    while (!cpuB2.halted && steps < 50) {
      cpuB2.step();
      steps++;
      const after = cpuB2.readChannel(0o11);
      if (after !== before) break;
    }
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
    if (running || (cpuMode === 'v1' ? cpu!.halted : cpuB2!.halted)) return;
    running = true;

    const tick = () => {
      if (!running || (cpuMode === 'v1' ? !cpu || cpu.halted : !cpuB2 || cpuB2.halted)) {
        running = false;
        sync();
        return;
      }
      if (cpuMode === 'block2' && keyboardBuffer.length > 0) {
        cpuB2!.writeChannel(0o10, keyboardBuffer.shift()!);
        pulseLamp((v) => (lampUplinkActy = v), 120);
      }
      if (cpuMode === 'v1') {
        for (let i = 0; i < 100 && !cpu!.halted; i++) cpu!.step();
      } else {
        for (let i = 0; i < 100 && !cpuB2!.halted; i++) cpuB2!.step();
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
    pulseLamp((v) => (lampRestart = v), 400);
    if (cpuMode === 'v1') loadProgram(keyboardEcho as ProgramData);
    else loadBlock2Program(block2KeyEcho as ProgramData);
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
    | 'VERB' | 'NOUN' | 'PLUS' | 'MINUS' | 'CLEAR' | 'ENTER'
    | 'PROCEED' | 'KEYREL' | 'RESET';

  function dskyKeypress(key: DskyKey) {
    const KEY_ENTER = 10, KEY_PROCEED = 11, KEY_CLEAR = 12, KEY_RESET = 13;
    const KEY_VERB = 14, KEY_NOUN = 15, KEY_KEYREL = 16, KEY_MINUS = 17;

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
      if (dispVerb !== null && dispNoun !== null) {
        dispProg = 1;
        dispR1 = dispVerb + dispNoun;
      }
      return;
    }

    if (key === 'KEYREL') {
      keyboardBuffer.push(KEY_KEYREL);
      pulseLamp((v) => (lampKeyRel = v), 400);
      return;
    }

    if (key === 'MINUS') {
      keyboardBuffer.push(KEY_MINUS);
      if (!inputBuffer.startsWith('-')) {
        inputBuffer = '-' + inputBuffer;
      }
      return;
    }

    if (key === 'PLUS') {
      if (inputBuffer.startsWith('-')) {
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
      if (cpuMode === 'block2') step();
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
      {#if currentPage === 'AGC'}
        <span class="nav-divider"></span>
        <button
          type="button"
          class="nav-link"
          class:active={cpuMode === 'v1'}
          onclick={() => { cpuMode = 'v1'; cpuB2 = null; cpu = null; reset(); }}
        >CPU: v1</button>
        <button
          type="button"
          class="nav-link"
          class:active={cpuMode === 'block2'}
          onclick={() => { cpuMode = 'block2'; cpuB2 = null; cpu = null; reset(); }}
        >CPU: Block II</button>
      {/if}
      <span class="nav-spacer"></span>
      <button
        type="button"
        class="nav-link"
        class:active={showGuidance}
        onclick={() => showGuidance = !showGuidance}
      >Guide</button>
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
          numericBase={cpuMode === 'block2' ? 'oct' : 'dec'}
          inputPhase={inputPhase}
          inputBuffer={inputBuffer}
          lamps={{
            UPLINK_ACTY: lampUplinkActy,
            RESTART: lampRestart,
            KEY_REL: lampKeyRel,
            OPR_ERR: inputPhase === 'ERROR',
            PROG: running && !halted,
            STBY: !running && !halted,
          }}
          simControls={cpuMode !== 'block2'}
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
        {#if showGuidance}
          <Guidance page="DEMO" pendingKey={null} />
        {/if}
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
      {#if currentPage === 'AGC' && showGuidance}
        <Guidance page="AGC" pendingKey={keyboardBuffer[0] ?? null} />
      {/if}

      {#if currentPage === 'AGC'}
        <MemoryViewer {memory} {pc} format={cpuMode === 'block2' ? 'octal15' : 'hex16'} />
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
        <TracePanel {trace} format={cpuMode === 'block2' ? 'octal15' : 'hex16'} />
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

  @media (max-width: 800px) {
    .left-panel, .right-panel {
      min-width: 200px;
    }
    /* .center-panel */
  .center-panel {
      min-width: 150px;
    }
  }
</style>
