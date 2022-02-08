import * as svelteAnimate from "svelte/animate";
import * as svelteEasing from "svelte/easing";
import * as svelteInternal from "svelte/internal";
import * as svelteMotion from "svelte/motion";
import * as svelteStore from "svelte/store";
import * as svelteTransition from "svelte/transition";
import * as workerTimers from "worker-timers";

window.require = (name: string) => {
  if (name === "svelte") return svelteInternal;
  if (name === "svelte/animate") return svelteAnimate;
  if (name === "svelte/easing") return svelteEasing;
  if (name === "svelte/internal") return svelteInternal;
  if (name === "svelte/motion") return svelteMotion;
  if (name === "svelte/store") return svelteStore;
  if (name === "svelte/transition") return svelteTransition;
  if (name === "worker-timers") return workerTimers;
  throw new Error(`Could not require "${name}"`);
};
