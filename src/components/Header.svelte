<script lang="ts">
  import type { Writable } from "svelte/store";
  import { mode, theme } from "../stores";

  const modes = ["transform", "build"] as const;

  type WritableValue<T> = T extends Writable<infer K> ? K : never;
  function keydown(m: WritableValue<typeof mode>) {
    return (ev: KeyboardEvent) => {
      if (ev.code === "Space" || ev.code === "Enter") {
        $mode = m;
      }
    };
  }

  async function share() {
    try {
      await navigator.clipboard?.writeText(location.href);
      alert("Sharable URL has been copied to clipboard.");
    } catch {}
  }

  function github() {
    open("https://github.com/hyrious/esbuild-repl", "_blank");
  }
</script>

<header>
  <h1>
    <a href="https://esbuild.github.io" target="_blank" rel="noreferrer">esbuild</a>
    <span>.</span>
    <a href="https://github.com/hyrious/esbuild-repl" target="_blank" rel="noreferrer">repl</a>
  </h1>
  <nav>
    {#each modes as m (m)}
      <input type="radio" name="mode" id="mode-{m}" value={m} checked={$mode === m} />
      <label
        for="mode-{m}"
        tabindex="0"
        title="esbuild.{m}()"
        on:click={() => ($mode = m)}
        on:keydown={keydown(m)}
      >
        {m}
      </label>
    {/each}
    <a class="playground" href="./play.html" title="play your code">playground</a>
  </nav>
  <button on:click={github} title="hyrious/esbuild-repl">
    <i class="i-mdi-github" />
  </button>
  <button on:click={share} title="share">
    <i class="i-mdi-share-variant" />
  </button>
  <button on:click={() => ($theme = $theme === "light" ? "dark" : "light")} title="theme: {$theme}">
    <i class={$theme === "light" ? "i-mdi-white-balance-sunny" : "i-mdi-moon-waxing-crescent"} />
  </button>
</header>

<style>
  header {
    padding: calc(var(--gap) * 2) var(--gap) var(--gap);
    display: flex;
    align-items: center;
  }
  header a {
    text-decoration: none;
  }
  header a:hover {
    color: var(--fg-on);
    text-decoration: underline;
  }
  h1 {
    margin: 0;
    padding: 0 var(--gap) 0 calc(var(--gap) * 2);
    display: inline-flex;
    font-size: 16px;
  }
  nav {
    flex-grow: 1;
    display: inline-flex;
  }
  label {
    position: relative;
    text-align: center;
    text-transform: capitalize;
    user-select: none;
    cursor: pointer;
  }
  label:hover {
    text-decoration: underline;
  }
  label[for="mode-transform"] {
    min-width: 90px;
  }
  label[for="mode-build"] {
    min-width: 50px;
  }
  a.playground {
    min-width: 100px;
    text-align: center;
    text-transform: capitalize;
  }
  a.playground:hover {
    text-decoration: underline;
  }
  input[type="radio"] {
    display: none;
  }
  input[type="radio"]:checked + label {
    color: var(--fg-on);
    font-weight: 700;
  }
  button {
    margin: 0;
    border: 0;
    padding: 0 calc(var(--gap) * 2) 0 var(--gap);
    appearance: none;
    font-size: 16px;
    background-color: transparent;
    cursor: pointer;
  }
  @media screen and (max-width: 720px) {
    header {
      padding: var(--gap);
    }
    h1 {
      display: none;
    }
    a.playground {
      display: none;
    }
  }
</style>
