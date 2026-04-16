# agc-nasa-sim

A browser-based Apollo Guidance Computer (AGC) emulator. It simulates the Block II AGC, the flight computer used on Apollo missions.

## What it is

This is a simulation of the Apollo Guidance Computer hardware. It models the 15-bit CPU, 36KB of memory, and I/O system used on Apollo 11-17.

You can load and run AGC machine code, interact with a DSKY (Display Keyboard) interface, step through execution one cycle at a time, watch memory change, and see the execution trace.

## Running it

```bash
bun install
bun run dev
```

Then open `http://localhost:5173` in your browser.

## How to use it

1. Press **VERB** on the DSKY, enter a 2-digit verb code, press **ENTER**
2. Press **NOUN**, enter a 2-digit noun code, press **ENTER**
3. Press **PROCEED** to execute. The result shows on R1.
4. Use **STEP** to step one cycle, or **RUN** to execute continuously
5. The center panel shows memory, the right panel shows the execution trace

## Running tests

```bash
bun test
bun run typecheck
```

## Project structure

```
src/
  core/block2/   # CPU, memory, decoder, executor (no UI)
  ui/            # Svelte components
  programs/      # Demo programs
  tests/         # Vitest tests
```

## License

MIT License. See [LICENSE.md](LICENSE.md).
