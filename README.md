# estim8

This is a minimal story point estimation tool for agile teams, built with Svelte, Tailwind CSS, [pusher](https://pusher.com), and [turso](https://turso.tech).

## Developing

Once you've cloned the repo, you'll need to create a `.env` file in the root of the repo, which you can copy from `.env.example` as a basis. Each environment variable is described in the `.env.example` file.

Once the `.env` file is ready, you can start a development server:

```bash
pnpm run dev

# or start the server and open the app in a new browser tab
pnpm run dev -- --open
```

## Building

To create a production version of your app:

```bash
pnpm build
```

You can preview the production build with `pnpm preview`.
