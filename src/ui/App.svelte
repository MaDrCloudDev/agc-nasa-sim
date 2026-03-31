<script lang="ts">
  import { onMount } from 'svelte';
  import ControlPanel from './ControlPanel.svelte';
  import RegisterPanel from './RegisterPanel.svelte';
  import MemoryViewer from './MemoryViewer.svelte';
  import TracePanel from './TracePanel.svelte';
  import { loadProgram } from '../stores/emulator.js';
  import counterDemo from '../programs/counter-demo.json';
  import type { ProgramData } from '../core/types.js';

  onMount(() => {
    loadProgram(counterDemo as ProgramData);
  });
</script>

<div class="app">
  <header>
    <h1>AGC Emulator</h1>
  </header>
  
  <div class="main">
    <aside class="left-panel">
      <ControlPanel />
      <RegisterPanel />
    </aside>
    
    <main class="center-panel">
      <MemoryViewer />
    </main>
    
    <aside class="right-panel">
      <TracePanel />
    </aside>
  </div>
</div>

<style>
  .app {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: #0a0a0a;
    color: #e0e0e0;
  }

  header {
    background: #1a1a1a;
    border-bottom: 1px solid #333;
    padding: 0.5rem 1rem;
  }

  h1 {
    margin: 0;
    font-size: 1.25rem;
    color: #00ff88;
    font-family: 'Courier New', monospace;
  }

  .main {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .left-panel {
    width: 300px;
    border-right: 1px solid #333;
    overflow-y: auto;
    background: #0f0f0f;
  }

  .center-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .right-panel {
    width: 500px;
    border-left: 1px solid #333;
    background: #0f0f0f;
    overflow: hidden;
  }
</style>
