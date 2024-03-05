import { db } from "$db";
import { migrate } from "drizzle-orm/libsql/migrator";

/** @type {import('./$types').RequestHandler} */
export async function GET() {
	// This will run migrations on the database, skipping the ones already applied
	await migrate(db, { migrationsFolder: "src/db/migrations" });
	// Don't forget to close the connection, otherwise the script will hang

	return new Response(null, {
		status: 302,
		headers: {
			location: "/",
		},
	});
}
