export function formatHex(value: number, width: number = 4): string {
  return '0x' + (value & 0xFFFF).toString(16).toUpperCase().padStart(width, '0');
}

export function formatDec(value: number): string {
  return value.toString(10);
}

export function formatAddress(addr: number): string {
  return addr.toString(16).toUpperCase().padStart(4, '0');
}
