<script lang="ts">
	import { page } from '$app/stores';
</script>

<div class="flex align-middle content-center justify-center h-screen">
    <h1 class="text-2xl">{$page.status}: {$page.error?.message}</h1>
</div>
