import type { BuildOptions, Loader, Message, Plugin } from "esbuild";
import { derived, Readable, writable } from "svelte/store";
import { isBrowser, render } from "../helpers";
import { esbuild, mode, time, timeEnd } from "./index";
import { compile, preprocess } from "svelte/compiler";

export interface Module {
  name: string;
  contents: string;
  isEntry: boolean;
}

export const modules = writable<Module[]>([
  {
    name: "main.js",
    contents: `
import App from './App.svelte'

const createApp = () => new App({
  target: document.body,
})

export default createApp
`,
    isEntry: true,
  },
  {
    name: "App.svelte",
    contents: `
<script>
  let count = 1
</script>
<button on:click={() => count++}>Counter: {count} </button>
`,
    isEntry: true,
  },
]);
export const buildOptions = writable<BuildOptions>({
  bundle: true,
  format: "iife",
  minify: true,
  globalName: "createApp",
});

export interface Outputs {
  files?: Module[];
  errors?: Message[];
  warnings?: Message[];
}

function normalizeName(path: string) {
  return "/" + path.replace(/^[.\/]*/g, "");
}

function stripExt(path: string) {
  const i = path.lastIndexOf(".");
  return i !== -1 ? path.slice(0, i) : path;
}

export async function fetchPkg(url: string) {
  const res = await fetch(url);
  return {
    url: res.url,
    content: await res.text(),
  };
}

function repl($modules: Module[]): Plugin {
  const cache: Record<string, { url: string; content: string }> = {};
  return {
    name: "repl",
    setup({ onResolve, onLoad }) {
      onResolve({ filter: /.*/ }, (args) => {
        const absPath = normalizeName(args.path);

        let mod = $modules.find((e) => normalizeName(e.name) === absPath);
        if (mod) return { path: normalizeName(mod.name), pluginData: mod };

        mod = $modules.find((e) => stripExt(normalizeName(e.name)) === stripExt(absPath));
        if (mod) return { path: normalizeName(mod.name), pluginData: mod };

        return { path: args.path, external: true };
      });

      onLoad({ filter: /.*/ }, async (args) => {
        // if (args.namespace === UnpkgNamepsace) {
        //   const baseUrl = "https://unpkg.com/";
        //   const pathUrl = new URL(args.path, baseUrl).toString();
        //   let value = cache[pathUrl];
        //   if (!value) {
        //     value = await fetchPkg(pathUrl);
        //   }
        //   cache[pathUrl] = value;
        //   return {
        //     contents: value.content,
        //     pluginData: {
        //       parentUrl: value.url,
        //     },
        //   };
        // }

        const mod: Module | undefined = args.pluginData;
        const isSvelte = args.path.endsWith(".svelte");
        if (mod) {
          let content = mod.contents;
          let loader: Loader = stripExt(args.path) === args.path || isSvelte ? "js" : "js";

          if (isSvelte) {
            const compiled = compile(content, {});
            let { js, css } = compiled;
            content = js.code;
          }

          return { contents: content, loader };
        }
      });
    },
  };
}

export const outputs: Readable<Outputs> = derived(
  [esbuild, modules, buildOptions],
  ([$esbuild, $modules, $buildOptions], set) => {
    if (!$esbuild) return;

    const entryPoints = $modules.filter((e) => e.isEntry).map((e) => e.name);
    if (entryPoints.length === 0) return set({});

    const buildOptions = { entryPoints, ...$buildOptions };
    (buildOptions.plugins ||= []).unshift(repl($modules));
    buildOptions.outdir = "/";
    buildOptions.write = false;
    buildOptions.allowOverwrite = true;
    time();
    $esbuild
      .build(buildOptions as BuildOptions & { write: false })
      .then(({ outputFiles, errors, warnings }) => {
        console.log("[LOG] ~ file: build.ts ~ line 133 ~ outputFiles", outputFiles);
        const files = outputFiles.map(
          (file) =>
            ({
              name: file.path,
              contents: file.text,
              isEntry: false,
            } as Module)
        );
        set({ files, errors, warnings });
      })
      .catch(set)
      .finally(timeEnd);
  },
  { files: [{ name: "main.js", contents: "// initializing", isEntry: false }] } as Outputs
);

export const errorsHTML = derived([esbuild, outputs], ([$esbuild, $outputs], set) => {
  if (!$esbuild) return;
  const { errors, warnings } = $outputs;
  Promise.all([
    errors?.length ? $esbuild.formatMessages(errors, { color: true, kind: "error" }) : null,
    warnings?.length ? $esbuild.formatMessages(warnings, { color: true, kind: "warning" }) : null,
  ]).then((raw) => {
    const strings = (raw as string[][]).reduce((sum, xs) => (xs ? [...sum, ...xs] : sum), []);
    set(strings.map((ansi) => render(ansi)).join("\n"));
  });
});

isBrowser &&
  Object.assign(window, {
    stores_build: { modules, buildOptions, outputs },
  });
