export const SIMPLE_FIB_SEQ = new Set([2, 5, 8, 13]);
export const FIB_SEQ = new Set([1, 2, 3, 5, 8, 13, 21]);

export function getChannelName(roomId: string): string {
	return `presence-${roomId}`;
}
