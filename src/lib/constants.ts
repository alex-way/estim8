export const DEFAULT_CHOICES = new Set([2, 5, 8, 13]);
export const fibonacciSequence = new Set([1, 2, 3, 5, 8, 13, 21]);

export function getChannelName(roomId: string): string {
	return `presence-${roomId}`;
}
