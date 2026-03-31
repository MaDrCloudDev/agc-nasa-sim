# Apollo Guidance Computer Emulator

A browser-based AGC emulator in TypeScript. Emulates a simplified CPU and memory model, loads demo programs, and executes them step-by-step or continuously.

## Stack

- TypeScript (strict mode)
- Vite + Svelte (Phase 2+)
- Vitest for testing

## Quick start

```bash
bun install
bun test              # Run tests
bun run test:watch    # Watch mode
bun run typecheck     # Type check
bun run dev           # Dev server (Phase 2+)
```

## Current phase

**Phase 1: Emulator core** — CPU, memory, decoder, executor, tests. No browser UI.

See `AGENTS.md` for full engineering rules and phase checklists.

## Project structure

```
src/
  core/       # CPU, memory, decoder, executor (no UI imports)
  utils/      # Bit ops, formatting, assertions
  programs/   # JSON demo programs
  tests/      # Vitest test files
```

## License

MIT
