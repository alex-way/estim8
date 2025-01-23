import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [basicSsl(), sveltekit(), tailwindcss()],
	test: {
		include: ["src/**/*.{test,spec}.{js,ts}"],
	},
	server: {
		host: "estim8.127.0.0.1.nip.io",
		proxy: {},
	},
	optimizeDeps: {
		// Including to prevent constant re-building when developing
		include: [
			"pusher-js",
			"js-confetti",
			"lucide-svelte",
			"bits-ui",
			"clsx",
			"tailwind-merge",
			"tailwind-variants",
			"svelte/internal/client",
		],
	},
});
