# Thread Compass

A local saved-link recall workbench. It traces a decision back to supporting material rather than assuming the closest-looking title is evidence. Built as an original project for the Relate by Neo4j Hackathon.

**[Open the live browser demo](https://leejinming.github.io/thread-compass/).** No login required. Click **Open live demo**, then choose **Atlas** to trace the recorded decision to its supporting links. The demo uses a fictional dataset.

The [66-second captioned walkthrough](https://leejinming.github.io/thread-compass/walkthrough.mp4) shows the graph paths, the title-only comparison, the context packet and an ambiguous question.

## Run the real app

1. Use Node.js 20+ with npm on a platform supported by the [Relate Node SDK](https://github.com/relatedb/relate/blob/main/clients/javascript/README.md). Verified on Node 24.22.3 on Linux x64 and Node 22.20.0 on Windows x64.
2. From this repository folder, run `npm ci --include=optional --ignore-scripts --registry=https://registry.npmjs.org`, then `npm test` and `npm start`. The OS-specific native library is an optional package in the SDK. A registry mirror missing that package can report a successful install followed by a `librelate_ffi not found` error.
3. Open http://127.0.0.1:4317/ in a browser. No sign-in, API key, hosted database or AI model is required. Press Ctrl+C in the terminal to stop the app.

Select **Atlas mobile**, then compare the title-only results with the linked decision and expand **Why was this retrieved?** on the iOS screenshot diff. **Copy context packet** copies the recorded decision, caveat and synthetic references; it does not execute actions. Ask **What should we ship?** to see why the app requests clarification rather than guessing. The corroborating artifact labels are synthetic identifiers and are not links to private files.

## How the graph earns its place

The pinned official `@relate/relate` 1.2.0 npm library runs a native graph database in Node. Three fictional workspaces, three conversation records, three decisions and 15 saved artifacts are seeded in memory. The input matches known workspace and decision terms, then a fixed parameterized Cypher query traverses **Workspace → HAS_THREAD → Thread → RECORDED → Decision → SUPPORTED_BY → SavedLink**. The UI renders the returned path and relationship types. It abstains if the workspace/intent is unclear or no evidence path exists. There is no general-language model.

The right column is a deliberately simple baseline measuring shared title terms. On these three authored examples only, graph retrieval found all 9 labeled relevant artifacts, while title search found 2 of 9 (2 relevant among its 8 displayed results). This is a designed demonstration, not a benchmark. The automated edge-deletion test shows a still-saved artifact ceases to be retrieved once its support relationship is removed. The other tests cover native path results, honest abstention and a real loopback HTTP result and assets.

### Inspect the saved graph

Run `npm run inspect` to open the included [single-file Relate database](sample/workbench.rl) read-only. It prints the nine evidence paths across Atlas, Pulse and Harbor. Six additional saved artifacts have no supporting edge to a decision and therefore do not appear in the nine paths. The database contains only the fictional project fixtures.

The browser demo and the default local server use separate in-memory copies so each run starts fresh. To create a writable store from the same fixtures, run `RELATE_PATH=./workbench.rl npm start` on POSIX or set `$env:RELATE_PATH="workbench.rl"` before `npm start` in PowerShell. The next run with the same path reopens that graph. Keep any real user data out of this sample project.

## License, tools and disclosure

Project code, CSS and entirely fictional fixtures are licensed under [MIT](LICENSE), Copyright © 2026 Mingjin Li. [Third-party notices](THIRD-PARTY.md) document separately installed dependencies. There are no externally sourced illustrations, fonts, recordings, datasets or private conversations in this repository.

OpenAI ChatGPT/Codex was used significantly to help implement the prototype, draft the synthetic fixture data and documentation, and write tests. No AI model, model service, or paid API is called at runtime. No claim is made that the prototype has general-purpose semantic recall or completes release actions.

The contest repository must be publicly visible with GitHub topic `relate` through the judging and winner announcement; `relate-neo4j-hackathon` is recommended. See the [official rules](https://relate.devpost.com/rules).
