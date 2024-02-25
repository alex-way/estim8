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
		Object.values(get(roomState).users).filter(
			(user) => user.deviceId in get(presenceInfo),
		),
	);

	const activeParticipants = derived([presenceInfo, roomState], () =>
		get(participants).filter((user) => user.isParticipant),
	);

	const participantsVoted = derived([presenceInfo, roomState], () =>
		get(activeParticipants).filter((user) => user.choice !== null),
	);

	const participantsNotVoted = derived([presenceInfo, roomState], () =>
		get(activeParticipants).filter((user) => user.choice === null),
	);

	const percentOfParticipantsVoted = derived(
		[participantsVoted, participants],
		($participantsVoted) => {
			const totalParticipants = get(participants).length;

			return totalParticipants
				? Math.round(($participantsVoted.length / totalParticipants) * 100)
				: 0;
		},
	);

	const consensusAchieved = derived([participantsVoted, roomState], () => {
		return (
			get(percentOfParticipantsVoted) === 100 &&
			get(participants).every(
				(user) => user.choice === get(participants).at(0)?.choice,
			)
		);
	});

	const selectableChoices = derived(roomState, ($roomState) => [
		...($roomState.config.allowUnknown ? ["?" as const] : []),
		...$roomState.config.selectableNumbers,
	]);

	return {
		subscribe,
		set,
		update,
		selectableChoices,
		participants,
		activeParticipants,
		participantsVoted,
		participantsNotVoted,
		percentOfParticipantsVoted,
		consensusAchieved,
	};
}

export const roomState = createRoomState();

export const isObserving = derived(
	[deviceId, roomState],
	([$deviceId, $roomState]) =>
		$roomState.users[$deviceId]?.isParticipant === false,
);

export const isParticipating = derived(
	[deviceId, roomState],
	([$deviceId, $roomState]) =>
		$roomState.users[$deviceId]?.isParticipant === true,
);

export const isRoomAdmin = derived(
	[deviceId, roomState],
	([$deviceId, $roomState]) => $roomState.adminDeviceId === $deviceId,
);
