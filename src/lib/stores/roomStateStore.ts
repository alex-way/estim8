import type { RoomState } from "$lib/types";
import { derived, writable } from "svelte/store";

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

	const allPresentRoomMembers = derived(
		[presenceInfo, roomState],
		([$presenceInfo, $roomState]) =>
			Object.values($roomState.users).filter(
				(user) => user.deviceId in $presenceInfo && user.name,
			),
	);

	const participants = derived(
		allPresentRoomMembers,
		($allPresentRoomMembers) =>
			$allPresentRoomMembers.filter((user) => user.isParticipant),
	);

	const participantsVoted = derived(participants, ($participants) =>
		$participants.filter((user) => user.choice !== null),
	);

	const participantsNotVoted = derived(participants, ($participants) =>
		$participants.filter((user) => user.choice === null),
	);

	const percentOfParticipantsVoted = derived(
		[participantsVoted, participants],
		([$participantsVoted, $participants]) => {
			const totalParticipants = $participants.length;

			return totalParticipants
				? Math.round(($participantsVoted.length / totalParticipants) * 100)
				: 0;
		},
	);

	const consensusAchieved = derived(
		[percentOfParticipantsVoted, participantsVoted],
		([$percentOfParticipantsVoted, $participantsVoted]) =>
			$percentOfParticipantsVoted === 100 &&
			$participantsVoted.every(
				(user) => user.choice === $participantsVoted.at(0)?.choice,
			),
	);

	const selectableChoices = derived(roomState, ($roomState) => [
		...($roomState.config.allowUnknown ? ["?" as const] : []),
		...$roomState.config.selectableNumbers,
	]);

	return {
		subscribe,
		set,
		update,
		selectableChoices,
		allPresentRoomMembers,
		participants,
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
