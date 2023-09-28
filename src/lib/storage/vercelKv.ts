import { createClient } from "@vercel/kv";
import type { PersistentStorage } from "./base";
import { env as privateEnv } from "$env/dynamic/private";

const kv = createClient({
	token: privateEnv.KV_REST_API_TOKEN,
	url: privateEnv.KV_REST_API_URL,
}) as PersistentStorage;

export class VercelStorage implements PersistentStorage {
	async get<T>(key: string): Promise<T | null> {
		return kv.get(key);
	}
	async set<T>(
		key: string,
		value: T,
		options?: { ex?: number | undefined } | undefined,
	): Promise<void> {
		return kv.set(key, value, options);
	}
}
