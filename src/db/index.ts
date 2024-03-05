import schema from "$db/schema";
import { env } from "$env/dynamic/private";
import { createClient as createTursoClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

export const client = createTursoClient({
	url: env.TURSO_URL,
	authToken: env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
