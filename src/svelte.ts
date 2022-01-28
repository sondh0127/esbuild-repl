import * as svelteInternal from "svelte/internal";

window.require = (name: string) => {
  if (name === "svelte/internal") return svelteInternal;
  throw new Error(`Could not require "${name}"`);
};
