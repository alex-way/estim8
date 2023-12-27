import type { RoomState } from "$lib/types";
import { writable } from "svelte/store";

export const roomState = writable<RoomState>();
