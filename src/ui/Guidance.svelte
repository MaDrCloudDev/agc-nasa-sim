<script lang="ts">
  interface Props {
    pendingKey: number | null;
  }

  let { pendingKey }: Props = $props();

  function keyLabel(k: number): string {
    switch (k) {
      case 1: return "ENTER";
      case 2: return "PROCEED";
      case 3: return "CLEAR";
      case 4: return "RESET";
      case 5: return "VERB";
      case 6: return "NOUN";
      case 7: return "KEY REL";
      case 8: return "MINUS";
      default: return String(k);
    }
  }
</script>

<section class="guide" aria-label="Guidance">
  <div class="card">
    <div class="title">DSKY Controls</div>
    <ol class="steps">
      <li>Press <strong>VERB</strong>, enter 2 digits, then <strong>ENTR</strong>.</li>
      <li>Press <strong>NOUN</strong>, enter 2 digits, then <strong>ENTR</strong>.</li>
      <li>Press <strong>PRO</strong> to execute. Result shows on <strong>R1</strong>.</li>
    </ol>
    <div class="hint">
      <span class="label">Pending key:</span>
      <span class="value">{pendingKey === null ? "—" : keyLabel(pendingKey)}</span>
    </div>
  </div>
</section>

<style>
  .guide {
    margin-top: 0.75rem;
    padding: 0 1rem 1rem;
  }

  .card {
    margin-top: 0.5rem;
    background: #121212;
    border: 1px solid #2a2a2a;
    border-radius: 4px;
    padding: 0.6rem 0.7rem;
  }

  .title {
    color: #00ff88;
    font-family: "Courier New", monospace;
    font-size: 0.75rem;
    letter-spacing: 0.05em;
    margin-bottom: 0.4rem;
  }

  .steps {
    margin: 0;
    padding-left: 1.1rem;
    color: #aaa;
    font-size: 0.75rem;
    line-height: 1.25rem;
  }

  .hint {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
    font-size: 0.7rem;
    color: #888;
  }

  .label {
    color: #666;
    min-width: 90px;
    font-family: "Courier New", monospace;
  }

  .value {
    color: #bbb;
  }

  strong {
    color: #ddd;
  }
</style>
