<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import { env } from '$env/dynamic/public';
	import Pusher from 'pusher-js';
	import { onMount } from 'svelte';
	import type { RoomState } from './types';
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Progress } from '$lib/components/ui/progress';
	import JSConfetti from 'js-confetti';
	import ResultsPanel from './components/ResultsPanel.svelte';
	import NumberPicker from './components/NumberPicker.svelte';

	export let data: PageData;

	let roomState = data.roomState;

	let name: string | null = data.name;
	let jsConfetti: JSConfetti | undefined;

	onMount(() => {
		jsConfetti = new JSConfetti();
		if (!name) {
			name = localStorage.getItem('name');
		}

		var pusher = new Pusher(env.PUBLIC_PUSHER_APP_KEY, {
			cluster: 'eu'
		});

		var channel = pusher.subscribe($page.params.id);
		channel.bind('room-update', function (newRoomState: RoomState) {
			roomState = newRoomState;
			// set name in localstorage, if it's not already set
			if (!name) {
				name = roomState.users[$page.data.deviceId].name;
				localStorage.setItem('name', name);
			}
		});
	});

	let deviceExistsInRoom: boolean;
	$: deviceExistsInRoom = !!roomState && !!name && $page.data.deviceId in roomState.users;
	$: nameExistsInRoom = deviceExistsInRoom && roomState.users[$page.data.deviceId].name === name;
	$: peopleInRoom = Object.keys(roomState.users).length;
	$: peopleInRoomWithNullSelection = Object.keys(roomState.users).filter(
		(deviceId) => roomState.users[deviceId].chosenNumber === null
	);
	$: percentOfPeopleVoted = Math.round(((peopleInRoom - peopleInRoomWithNullSelection.length) / peopleInRoom) * 100);

	$: consensus =
		percentOfPeopleVoted == 100 &&
		Object.values(roomState.users).every((user) => user.chosenNumber === roomState.users[data.deviceId]?.chosenNumber);

	$: if (roomState.showResults && consensus) {
		jsConfetti?.addConfetti();
	}

	let copyText = 'Copy';

	function onClickCopy() {
		navigator.clipboard.writeText($page.url.toString());
		copyText = 'Copied!';
		setTimeout(() => {
			copyText = 'Copy';
		}, 2000);
	}
</script>

<div class="w-full max-w-7xl mx-auto">
	<h1 class="text-center text-2xl my-4">
		Room ID: {$page.params.id}
		<Button variant="secondary" on:click={onClickCopy}>{copyText}</Button>
	</h1>
	{#if roomState.adminDeviceId}
		<p>Admin: {roomState.users[roomState.adminDeviceId]?.name}</p>
	{/if}

	<form
		method="post"
		action="?/setName"
		class="flex w-full max-w-sm items-center space-x-2"
		use:enhance={() => {
			return async ({ update }) => {
				update({ reset: false });
			};
		}}
	>
		<Input type="text" name="name" placeholder="Name" maxlength={16} bind:value={name} />
		{#if !nameExistsInRoom}
			<Button type="submit">Set</Button>
		{/if}
	</form>

	{#if deviceExistsInRoom}
		{#if peopleInRoomWithNullSelection.length}
			<p>Waiting for {peopleInRoomWithNullSelection.length} more people to vote</p>
		{/if}
		<Progress value={percentOfPeopleVoted} class="my-4" />

		<NumberPicker {roomState} deviceId={$page.data.deviceId} />

		<form method="post" action="?/inverseDisplay" use:enhance class="inline-block">
			<Button type="submit" disabled={!roomState.showResults && peopleInRoomWithNullSelection.length !== 0}
				>{roomState.showResults ? 'Hide' : 'Reveal'}</Button
			>
		</form>

		<form method="post" action="?/clear" use:enhance class="inline-block">
			<Button type="submit" variant="outline" disabled={percentOfPeopleVoted === 0}>Clear all</Button>
		</form>

		<ResultsPanel {roomState} />
	{/if}
</div>
