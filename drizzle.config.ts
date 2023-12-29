import { defineConfig } from "drizzle-kit";

export default defineConfig({
	schema: "./src/db/schema.ts",
	driver: "turso",
	dbCredentials: {
		url: process.env.TURSO_URL,
		authToken: process.env.TURSO_AUTH_TOKEN,
	},
	out: "./drizzle",
	verbose: true,
	strict: true,
});
