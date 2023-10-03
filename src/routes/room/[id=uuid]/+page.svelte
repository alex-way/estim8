<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import { PUBLIC_PUSHER_APP_KEY } from '$env/static/public';
	import Pusher from 'pusher-js';
	import { onMount, onDestroy } from 'svelte';
	import type { RoomState } from '$lib/types';
	import type { ActionData, PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Progress } from '$lib/components/ui/progress';
	import JSConfetti from 'js-confetti';
	import ResultsPanel from './components/ResultsPanel.svelte';
	import NumberPicker from './components/NumberPicker.svelte';
	import RoomConfig from './components/RoomConfig.svelte';
	import * as Alert from '$lib/components/ui/alert';

	export let data: PageData;
	export let form: ActionData;

	let roomState = data.roomState;

	let name: string | undefined = data.name;
	let jsConfetti: JSConfetti | undefined;
	let pusher: Pusher | undefined;

	onMount(() => {
		jsConfetti = new JSConfetti();

		pusher = new Pusher(PUBLIC_PUSHER_APP_KEY, {
			cluster: 'eu'
		});

		var channel = pusher.subscribe(`cache-${$page.params.id}`);
		channel.bind('room-update', function (newRoomState: RoomState) {
			roomState = newRoomState;
		});

	});

	onDestroy(() => {
		pusher?.disconnect();
	});

	let deviceExistsInRoom: boolean;
	$: deviceExistsInRoom = !!name && data.deviceId in roomState.users;
	$: nameExistsInRoom = deviceExistsInRoom && roomState.users[data.deviceId].name === name;

	$: participants = Object.values(roomState.users).filter((user) => user.isParticipant);

	$: participantsWithNullSelection = participants.filter((user) => user.chosenNumber === null);
	$: percentOfPeopleVoted =
		participants.length === 0
			? 0
			: Math.round(((participants.length - participantsWithNullSelection.length) / participants.length) * 100);

	$: consensus =
		percentOfPeopleVoted == 100 && participants.every((user) => user.chosenNumber === participants.at(0)?.chosenNumber);

	$: nameAlreadyExists = Object.values(roomState.users).some(
		(user) => user.name === name && data.deviceId !== user.deviceId
	);

	$: if (roomState.showResults && consensus) {
		jsConfetti?.addConfetti();
	}

	$: disableRevealButton =
		participants.length === 0 ||
		(!roomState.showResults && participantsWithNullSelection.length !== 0) ||
		roomState.showResults;

	let copyText = 'Copy';

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
					update({ reset: false });
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

			<NumberPicker {roomState} deviceId={data.deviceId} />

			<form method="post" action="?/inverseDisplay" use:enhance class="inline-block">
				<Button type="submit" disabled={disableRevealButton}>Reveal</Button>
			</form>

			<form method="post" action="?/clear" use:enhance class="inline-block">
				<Button type="submit" variant="outline" disabled={participants.length === 0 || percentOfPeopleVoted === 0}
					>Clear</Button
				>
			</form>

			<ResultsPanel {roomState} deviceId={data.deviceId} />
		{:else}
			<p class="text-center" />
			<Alert.Root class="my-4 max-w-lg mx-auto">
				<Alert.Title>Please enter your name to continue.</Alert.Title>
			</Alert.Root>
		{/if}
	</div>
	<div class="col-span-3 xl:col-span-2 border-white border-opacity-20 border-t-2 lg:border-t-0 lg:border-l-2">
		<RoomConfig {roomState} deviceId={data.deviceId} />
	</div>
</div>
