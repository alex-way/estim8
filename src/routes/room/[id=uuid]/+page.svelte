<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import { PUBLIC_PUSHER_APP_KEY } from '$env/static/public';
	import Pusher, { type PresenceChannel } from 'pusher-js';
	import { onMount } from 'svelte';
	import type { RoomState } from '$lib/types';
	import type { ActionData, PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Progress } from '$lib/components/ui/progress';
	import JSConfetti from 'js-confetti';
	import ResultsPanel from './components/ResultsPanel.svelte';
	import ChoicePicker from './components/ChoicePicker.svelte';
	import RoomConfig from './components/RoomConfig.svelte';
	import * as Alert from '$lib/components/ui/alert';
	import { browser } from '$app/environment';
	import { roomState, deviceId, presenceInfo } from '$lib/stores/roomStateStore';

	let { data, form } = $props<{ data: PageData; form: ActionData }>();
	let { name, copyText } = $state({ name: data.name, copyText: '' });

	$roomState = data.roomState;
	$deviceId = data.deviceId;
	$presenceInfo = { [data.deviceId]: [] };

	const jsConfetti = browser ? new JSConfetti() : undefined;
	let presenceChannel: PresenceChannel | undefined;

	let channelName = $derived<string>(`presence-${$page.params.id}`);

	type Member = {
		id: string;
		info: {};
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

		presenceChannel.bind('room-update', function (newRoomState: RoomState) {
			console.log('room-update', newRoomState);
			$roomState = newRoomState;
		});

		presenceChannel.bind('pusher:subscription_succeeded', (members: PresenceSubscriptionData) => {
			console.log('subscription_succeeded', members);
			$presenceInfo = members.members;
		});

		presenceChannel.bind('pusher:subscription_error', (error: any) => {
			console.log('subscription_error', error);
		});

		presenceChannel.bind('pusher:member_added', (member: Member) => {
			console.log('member_added', member);
			$presenceInfo = { ...$presenceInfo, [member.id]: member.info };
		});

		presenceChannel.bind('pusher:member_removed', (member: Member) => {
			console.log('member_removed', member);
			delete $presenceInfo[member.id];
			$roomState.users = Object.fromEntries(Object.entries($roomState.users).filter(([key]) => key !== member.id));
		});

		return () => {
			pusher.unsubscribe(channelName);
			pusher.disconnect();
		};
	});

	let deviceExistsInRoom = $derived(!!name && $deviceId in $roomState.users);
	let nameExistsInRoom = $derived(deviceExistsInRoom && $roomState.users[$deviceId].name === name);

	let participants = $derived(
		Object.values($roomState.users)
			.filter((user) => user.deviceId in $presenceInfo)
			.filter((user) => user.isParticipant)
	);

	let participantsWithNullSelection = $derived(participants.filter((user) => user.choice === null));
	let percentOfPeopleVoted = $derived(
		participants.length === 0
			? 0
			: Math.round(((participants.length - participantsWithNullSelection.length) / participants.length) * 100)
	);

	let consensus = $derived(
		percentOfPeopleVoted == 100 && participants.every((user) => user.choice === participants.at(0)?.choice)
	);

	let nameAlreadyExists = $derived(
		Object.values($roomState.users).some((user) => user.name === name && $deviceId !== user.deviceId)
	);

	let disableRevealButton = $derived(
		participants.length === 0 ||
			(!$roomState.showResults && participantsWithNullSelection.length !== 0) ||
			$roomState.showResults
	);

	$effect(() => {
		if ($roomState.showResults && consensus && jsConfetti) {
			jsConfetti.addConfetti();
		}
	});

	function onClickCopy() {
		navigator.clipboard.writeText($page.url.toString());
		copyText = 'Copied!';
		setTimeout(() => {
			copyText = 'Copy';
		}, 2000);
	}
</script>

<div class="w-full grid grid-cols-1 lg:grid-cols-12 min-h-full">
	<div class="w-full max-w-7xl lg:col-span-9 mx-auto p-4">
		<h1 class="text-center text-2xl my-4">
			Room ID: {$page.params.id}
			<Button variant="secondary" on:click={onClickCopy}>{copyText}</Button>
		</h1>

		<form
			method="post"
			action="?/setName"
			class="w-full max-w-sm items-center space-x-2 mx-auto"
			use:enhance={() => {
				localStorage.setItem('name', name || '');
				return async ({ update }) => {
					update({ reset: false, invalidateAll: false });
				};
			}}
		>
			<div class="grid w-full max-w-sm items-center gap-1.5">
				<div class="flex">
					<Input type="text" name="name" placeholder="Name" maxlength={8} bind:value={name} />
					<Button type="submit" disabled={nameAlreadyExists} class={`${nameExistsInRoom ? 'hidden' : ''}`}>Set</Button>
				</div>
				<p class="text-sm text-muted-foreground" class:hidden={!nameAlreadyExists}>This name is already taken.</p>
				{#if form?.errors?.name}
					<p class="text-sm text-muted-foreground">{form.errors.name}</p>
				{/if}
			</div>
		</form>

		{#if deviceExistsInRoom}
			<Progress value={percentOfPeopleVoted} class="my-4" />

			<ChoicePicker />

			<form
				method="post"
				action="?/inverseDisplay"
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
				<Button type="submit" variant="outline" disabled={participants.length === 0 || percentOfPeopleVoted === 0}
					>Clear</Button
				>
			</form>

			<ResultsPanel />
		{:else}
			<p class="text-center" />
			<Alert.Root class="my-4 max-w-lg mx-auto">
				<Alert.Title>Please enter your name to continue.</Alert.Title>
			</Alert.Root>
		{/if}
	</div>
	<div class="col-span-3 xl:col-span-2 border-white border-opacity-20 border-t-2 lg:border-t-0 lg:border-l-2">
		<RoomConfig />
	</div>
</div>
