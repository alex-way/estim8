import type { RoomState } from "$lib/types";
import { derived, get, writable } from "svelte/store";

type Member = {
	id: string;
	// biome-ignore lint/complexity/noBannedTypes: <explanation>
	info: {};
};

export const presenceInfo = writable<Record<string, Member["info"]>>({});

export const deviceId = writable<string>("");

function createRoomState(
	initialValue: RoomState = {
		adminDeviceId: null,
		config: {
			allowObserversToSnoop: false,
			allowUnknown: false,
			selectableNumbers: [],
		},
		showResults: false,
		users: {},
	},
) {
	const roomState = writable<RoomState>(initialValue);
	const { subscribe, set, update } = roomState;

	const participants = derived([presenceInfo, roomState], () =>
		Object.values(get(roomState).users)
			.filter((user) => user.isParticipant)
			.filter((user) => user.deviceId in (get(presenceInfo) || {})),
	);

	const participantsVoted = derived([presenceInfo, roomState], () =>
		get(participants).filter((user) => user.choice !== null),
	);

	return {
		subscribe,
		set,
		update,
		participants,
		participantsVoted,
		isObserving: (deviceId: string) =>
			get({ subscribe }).users[deviceId]?.isParticipant === false,
	};
}

export const roomState = createRoomState();

export function createmyStore() {
	const thing = writable(0);

	const doubledStore = (n: number) => derived(thing, () => get(thing) * n);

	return {
		subscribe: thing.subscribe,
		set: thing.set,
		doubled: doubledStore,
	};
}

export const myStore = createmyStore();
