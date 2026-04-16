<script lang="ts">
    interface Props {
        open: boolean;
        onClose: () => void;
    }

    let { open, onClose }: Props = $props();
</script>

{#if open}
    <div class="modal-shell">
        <button
            type="button"
            class="modal-overlay"
            aria-label="Close about dialog"
            onclick={onClose}
        ></button>
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="about-title">
            <div class="modal-header">
                <h1 id="about-title">Apollo Guidance Computer Emulator</h1>
                <button
                    type="button"
                    class="close-btn"
                    onclick={onClose}
                    aria-label="Close">✕</button
                >
            </div>
            <div class="modal-content">
                <section>
                    <h2>What is this?</h2>
                    <p>
                        A browser-based emulator of the <strong
                            >Block II Apollo Guidance Computer (AGC)</strong
                        >, the real flight computer that guided the Apollo
                        spacecraft to the Moon and back.
                    </p>
                </section>

                <section>
                    <h2>What does it do?</h2>
                    <p>
                        This emulator simulates the core AGC hardware: a 15-bit
                        CPU, 36 KB of addressable memory (2 KB erasable, 34 KB
                        fixed ROM), and I/O channels. You can:
                    </p>
                    <ul>
                        <li>Load and execute AGC machine code programs</li>
                        <li>
                            Interact with the spacecraft via a DSKY (Display
                            Keyboard) interface
                        </li>
                        <li>
                            Step through execution cycle-by-cycle or run
                            continuously
                        </li>
                        <li>Inspect memory and trace execution in real-time</li>
                    </ul>
                </section>

                <section>
                    <h2>How it works</h2>
                    <p>
                        The emulator implements the <strong
                            >Block II instruction set</strong
                        > (the real AGC hardware used during Apollo 11–17). Each
                        instruction is decoded and executed in a single cycle. Memory
                        is split into erasable (RAM) and fixed (ROM) banks. I/O operations
                        (keyboard input, display output) happen through numbered
                        channels.
                    </p>
                    <p>
                        <em>Historically accurate:</em> The instruction formats,
                        addressing modes, and register behavior match the real AGC
                        specification. This is not a simplified emulator—it's a genuine
                        simulation.
                    </p>
                </section>

                <section>
                    <h2>How to use it</h2>
                    <ol>
                        <li>
                            Press <strong>VERB</strong> on the DSKY, enter a
                            2-digit verb code, press <strong>ENTER</strong>.
                        </li>
                        <li>
                            Press <strong>NOUN</strong>, enter a 2-digit noun
                            code, press <strong>ENTER</strong>.
                        </li>
                        <li>
                            Press <strong>PROCEED</strong> to execute. The CPU will
                            process your request and display the result.
                        </li>
                        <li>
                            Use <strong>STEP</strong> to execute one cycle at a
                            time, or <strong>RUN</strong> to execute continuously.
                        </li>
                    </ol>
                </section>

                <section>
                    <h2>What it demonstrates</h2>
                    <ul>
                        <li>
                            <strong>Real AGC hardware:</strong> Block II instruction
                            set, registers (A, L, Q), interrupt system.
                        </li>
                        <li>
                            <strong>Memory layout:</strong> Erasable (working) memory
                            and fixed (ROM) banks.
                        </li>
                        <li>
                            <strong>I/O operations:</strong> Keyboard input (channel
                            0o10) and display output (channels 0o11–0o13).
                        </li>
                        <li>
                            <strong>Control flow:</strong> Branches (conditional
                            jumps), loops, and sequencing.
                        </li>
                        <li>
                            <strong>Execution trace:</strong> See every instruction,
                            track main loops, and inspect state.
                        </li>
                    </ul>
                </section>

                <section>
                    <h2>About the code</h2>
                    <p>
                        This is a <strong>TypeScript + Svelte 5</strong> project.
                        The core emulator (CPU, memory, decoder, executor) is pure
                        JavaScript with no UI dependencies. The UI is a three-panel
                        layout: left (DSKY or demo controls), center (memory), right
                        (execution trace).
                    </p>
                    <p>
                        Main loop detection in the trace compresses repeated
                        instruction sequences, making it easy to spot
                        interesting behavior outside the main control loop.
                    </p>
                </section>
            </div>
        </div>
    </div>
{/if}

<style>
    .modal-shell {
        position: fixed;
        inset: 0;
        z-index: 1000;
        font-family: "Courier New", monospace;
    }

    .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.7);
        border: 0;
        padding: 0;
        margin: 0;
        display: block;
        cursor: default;
    }

    .modal {
        position: relative;
        z-index: 1;
        background: #1a1a1a;
        border: 2px solid #00ff88;
        border-radius: 4px;
        max-width: 700px;
        max-height: 80vh;
        width: 90%;
        overflow-y: auto;
        box-shadow: 0 0 20px rgba(0, 255, 136, 0.3);
        margin: 5vh auto 0;
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem;
        border-bottom: 1px solid #333;
        background: #0a0a0a;
    }

    .modal-header h1 {
        margin: 0;
        font-size: 1.3rem;
        color: #00ff88;
        font-weight: bold;
        letter-spacing: 0.05em;
    }

    .close-btn {
        background: none;
        border: none;
        color: #00ff88;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 3px;
        transition: all 0.2s;
    }

    .close-btn:hover {
        background: #333;
        color: #fff;
    }

    .modal-content {
        padding: 1.5rem;
        color: #ccc;
        line-height: 1.6;
    }

    section {
        margin-bottom: 1.5rem;
    }

    section:last-child {
        margin-bottom: 0;
    }

    h2 {
        color: #00ff88;
        font-size: 1.1rem;
        margin: 0 0 0.5rem 0;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-weight: bold;
    }

    p {
        margin: 0 0 0.75rem 0;
        font-size: 0.9rem;
    }

    ul,
    ol {
        margin: 0 0 0.75rem 1.5rem;
        padding: 0;
        font-size: 0.9rem;
    }

    li {
        margin-bottom: 0.4rem;
    }

    strong {
        color: #fff;
    }

    em {
        color: #888;
        font-style: italic;
    }
</style>
