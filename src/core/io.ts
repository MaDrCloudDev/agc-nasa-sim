export interface IoDevice {
  read(channel: number): number;
  write(channel: number, value: number): void;
}

export class ConsoleDevice implements IoDevice {
  private channels: Record<number, number> = {};

  read(channel: number): number {
    return this.channels[channel] ?? 0;
  }

  write(channel: number, value: number): void {
    this.channels[channel] = value;
    console.log(`[OUT ${channel}] ${value} (0x${value.toString(16).padStart(4, '0')})`);
  }
}
