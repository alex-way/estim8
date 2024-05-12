<script lang="ts">
	import { browser, dev } from '$app/environment';
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import { PUBLIC_PUSHER_APP_KEY } from '$env/static/public';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Progress } from '$lib/components/ui/progress';
	import { getChannelName } from '$lib/constants';
	import { deviceId, presenceInfo, roomState } from '$lib/stores/roomStateStore';
	import type { CardBack, Choice, RoomState, RoomUser } from '$lib/types';
	import JSConfetti from 'js-confetti';
	import Pusher, { type PresenceChannel } from 'pusher-js';
	import { onMount } from 'svelte';
	import ChoicePicker from './components/ChoicePicker.svelte';
	import ProfileButton from './components/ProfileButton.svelte';
	import ResultsPanel from './components/ResultsPanel.svelte';
	import RoomConfig from './components/RoomConfig.svelte';

	const { data, form } = $props();
	let { name, copyText } = $state({ name: data.name, copyText: 'Copy' });

	$roomState = data.roomState;
	$deviceId = data.deviceId;
	$presenceInfo = { [data.deviceId]: [] };

	$inspect($roomState);

	const jsConfetti = browser ? new JSConfetti() : undefined;
	let presenceChannel: PresenceChannel | undefined;

	const channelName = getChannelName($page.params.id);

	type Member = {
		id: string;
		info: Record<string, never>;
	};

	type PresenceSubscriptionData = {
		count: number;
		members: Record<string, Member['info']>;
		me: Member;
		myID: string;
	};

	onMount(() => {
		const pusher = new Pusher(PUBLIC_PUSHER_APP_KEY, {
			cluster: 'eu',
			userAuthentication: {
				endpoint: '/pusher/user-auth',
				transport: 'ajax'
			},
			channelAuthorization: {
				endpoint: '/pusher/channel-auth',
				transport: 'ajax'
			}
		});

		presenceChannel = pusher.subscribe(channelName) as PresenceChannel;

		presenceChannel.bind('room-update', (newRoomState: RoomState) => {
			dev && console.log('room-update', newRoomState);
			$roomState = newRoomState;
		});

		presenceChannel.bind('pusher:subscription_succeeded', (members: PresenceSubscriptionData) => {
			dev && console.log('subscription_succeeded', members);
			$presenceInfo = members.members;
		});

		presenceChannel.bind('pusher:subscription_error', (error: unknown) => {
			dev && console.log('subscription_error', error);
		});

		presenceChannel.bind('user:update-choice', (update: { id: string; choice: Choice }) => {
			dev && console.log('user:update-choice', update);
			$roomState.users[update.id].choice = update.choice;
		});

		presenceChannel.bind('pusher:member_added', (member: Member) => {
			dev && console.log('member_added', member);
			$presenceInfo = { ...$presenceInfo, [member.id]: member.info };
		});

		presenceChannel.bind('pusher:member_removed', (member: Member) => {
			dev && console.log('member_removed', member);
			$presenceInfo = Object.fromEntries(Object.entries($presenceInfo).filter(([key]) => key !== member.id));
		});

		presenceChannel.bind('user:update-card-back', (update: { id: string; cardBack: CardBack }) => {
			dev && console.log('user:update-card-back', update);
			$roomState.users[update.id].config = { ...$roomState.users[update.id].config, cardBack: update.cardBack };
		});

		presenceChannel.bind('user:update-participation', (update: { id: string; participating: boolean }) => {
			dev && console.log('user:update-participation', update);
			$roomState.users[update.id].isParticipant = update.participating;
		});

		presenceChannel.bind('room:update-allow-unknown', (update: { allowUnknown: boolean }) => {
			dev && console.log('room:update-allow-unknown', update);
			$roomState.config.allowUnknown = update.allowUnknown;
		});

		presenceChannel.bind('room:update-selectable-numbers', (update: { selectableNumbers: number[] }) => {
			dev && console.log('room:update-selectable-numbers', update);
			$roomState.config.selectableNumbers = update.selectableNumbers.sort((a, b) => a - b);
		});

		presenceChannel.bind('room:update-allow-snooping', (update: { allowSnooping: boolean }) => {
			dev && console.log('room:update-allow-snooping', update);
			$roomState.config.allowObserversToSnoop = update.allowSnooping;
		});

		presenceChannel.bind('user:set-name', (update: { id: string; name: string }) => {
			dev && console.log('user:set-name', update);
			$roomState.users[update.id].name = update.name;
		});

		presenceChannel.bind('user:add', (update: RoomUser) => {
			dev && console.log('user:add', update);
			$roomState.users[update.deviceId] = update;
		});

		presenceChannel.bind('room:set-admin', (update: { adminDeviceId: string }) => {
			dev && console.log('room:set-admin', update);
			$roomState.adminDeviceId = update.adminDeviceId;
		});

		presenceChannel.bind('room:clear', () => {
			dev && console.log('room:clear');
			$roomState.showResults = false;
			Object.keys($roomState.users).forEach((deviceId) => {
				$roomState.users[deviceId].choice = null;
			});
		});

		presenceChannel.bind('room:reveal', () => {
			$roomState.showResults = true;
			if (jsConfetti && $consensusAchieved && $participantsVoted[0].choice !== '?') jsConfetti.addConfetti();
		});

		return () => {
			pusher.unsubscribe(channelName);
			pusher.disconnect();
		};
	});

	const deviceExistsInRoom = $derived(!!name && $deviceId in $roomState.users && $roomState.users[$deviceId].name);
	const nameExistsInRoom = $derived(deviceExistsInRoom && $roomState.users[$deviceId].name === name);
	const setName = $derived($roomState.users[$deviceId]?.name);

	const { participants, participantsVoted, participantsNotVoted, percentOfParticipantsVoted, consensusAchieved } =
		roomState;

	const nameAlreadyExists = $derived(
		Object.values($roomState.users).some((user) => user.name === name && $deviceId !== user.deviceId)
	);

	const disableRevealButton = $derived(
		$participants.length === 0 || $participantsNotVoted.length !== 0 || $roomState.showResults
	);

	function onClickCopy() {
		navigator.clipboard.writeText($page.url.toString());
		copyText = 'Copied!';
		setTimeout(() => {
			copyText = 'Copy';
		}, 2000);
	}
	const disableClearButton = $derived($participantsVoted.length === 0);
</script>

<div class="w-full grid grid-cols-1 lg:grid-cols-12 min-h-full">
	<div class="w-full max-w-7xl lg:col-span-9 mx-auto p-4">
		<div class="flex justify-center items-center gap-4">
			<h1 class="text-center text-2xl my-4">
				Room ID: {$page.params.id}
			</h1>
			<Button variant="secondary" on:click={onClickCopy}>{copyText}</Button>
		</div>

		<Progress value={$percentOfParticipantsVoted} class="my-4" />

		<ChoicePicker />

		<form
			method="post"
			action="?/reveal"
			use:enhance={() => {
				return async ({ update }) => {
					update({ invalidateAll: false });
				};
			}}
			class="inline-block"
		>
			<Button type="submit" disabled={disableRevealButton}>Reveal</Button>
		</form>

		<form
			method="post"
			action="?/clear"
			use:enhance={() => {
				return async ({ update }) => {
					update({ invalidateAll: false });
				};
			}}
			class="inline-block"
		>
			<Button type="submit" variant="outline" disabled={disableClearButton}>Clear</Button>
		</form>

		<ResultsPanel />

		{#if setName === ''}
			<AlertDialog.Root open={true}>
				<AlertDialog.Content>
					<AlertDialog.Header>
						<AlertDialog.Title class="text-center">Please enter your name to continue.</AlertDialog.Title>
					</AlertDialog.Header>
					<form
						method="post"
						action="?/setName"
						class="w-full max-w-sm items-center mx-auto flex gap-2 align-middle"
						use:enhance={() => {
							localStorage.setItem('name', name || '');
							return async ({ update }) => {
								update({ reset: false, invalidateAll: false });
							};
						}}
					>
						<Input type="text" name="name" placeholder="Name" maxlength={32} bind:value={name} />
						<Button type="submit" disabled={nameAlreadyExists} class={`${nameExistsInRoom ? 'hidden' : ''}`}>Set</Button
						>
					</form>
				</AlertDialog.Content>
			</AlertDialog.Root>
		{/if}
	</div>
	<div class="col-span-3 xl:col-span-2 border-white border-opacity-20 border-t-2 lg:border-t-0 lg:border-l-2">
		{#snippet additionalButtons()}
			<ProfileButton {data} {form} bind:name />
		{/snippet}
		<RoomConfig {additionalButtons} />
	</div>
</div>
