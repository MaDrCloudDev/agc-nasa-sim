<script lang="ts">
  import { onMount } from "svelte";
  import ControlPanel from "./ControlPanel.svelte";
  import RegisterPanel from "./RegisterPanel.svelte";
  import MemoryViewer from "./MemoryViewer.svelte";
  import TracePanel from "./TracePanel.svelte";
  import { loadProgram } from "../stores/emulator.svelte.js";
  import counterDemo from "../programs/counter-demo.json";
  import type { ProgramData } from "../core/types.js";

  let leftWidth = $state(25);
  let rightWidth = $state(30);
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

  onMount(() => {
    loadProgram(counterDemo as ProgramData);
  });

  function handleResizeKeydown(e: KeyboardEvent) {
    const step = 2;
    if (e.key === "ArrowLeft") {
      leftWidth = Math.max(20, leftWidth - step);
    } else if (e.key === "ArrowRight") {
      leftWidth = Math.min(50, leftWidth + step);
    }
  }
</script>

<div class="app">
  <header>
    <h1>AGC Emulator</h1>
  </header>

  <div class="main">
    <aside class="left-panel" style="width: {leftWidth}%">
      <ControlPanel />
      <RegisterPanel />
    </aside>

    <button
      type="button"
      class="resize-handle"
      class:dragging={isDraggingLeft}
      onmousedown={startDragLeft}
      onkeydown={handleResizeKeydown}
      aria-label="Resize left panel"
    ></button>

    <main class="center-panel">
      <MemoryViewer />
    </main>

    <button
      type="button"
      class="resize-handle"
      class:dragging={isDraggingRight}
      onmousedown={startDragRight}
      aria-label="Resize right panel"
    ></button>

    <aside class="right-panel" style="width: {rightWidth}%">
      <TracePanel />
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

  h1 {
    margin: 0;
    font-size: 1rem;
    color: #00ff88;
    font-family: "Courier New", monospace;
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
