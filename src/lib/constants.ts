export const DEFAULT_CHOICES = new Set([2, 5, 8, 13]);

export function getChannelName(roomId: string): string {
	return `presence-${roomId}`;
}
