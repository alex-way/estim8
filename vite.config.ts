import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vitest/config";
import basicSsl from "@vitejs/plugin-basic-ssl";

export default defineConfig({
	plugins: [basicSsl(), sveltekit()],
	test: {
		include: ["src/**/*.{test,spec}.{js,ts}"],
	},
	server: {
		host: "estim8.127.0.0.1.nip.io",
		https: true,
	},
});
