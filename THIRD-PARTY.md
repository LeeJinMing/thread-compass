# Third-party dependencies and provenance

The Node.js application does not redistribute dependencies. Installations resolved by the checked-in npm lockfile materialize their own package notices.

The browser demo in `docs/` redistributes Relate 1.2.0 JavaScript bindings and their OPFS helper under Apache-2.0; see [the license](docs/vendor/LICENSE.txt) and [notice](docs/vendor/NOTICE.txt). The matching unmodified WebAssembly binary is bundled from the official `@relate/relate-wasm` 1.2.0 npm release under the same license. The browser verifies its SHA-256 before initialization.

- [Relate](https://github.com/relatedb/relate), `@relate/relate` v1.2.0 and its platform optional npm packages: Apache-2.0, as declared in the lockfile and [upstream license](https://github.com/relatedb/relate/blob/main/LICENSE).
- [Koffi](https://github.com/Koromix/koffi), v3.3.8 and its platform optional npm packages: MIT, as declared in the lockfile. This is an indirect dependency of Relate. Upstream package distributions can carry additional notices for their own components; none are vendored here.
- Runtime UI and fixtures are part of this release, authored for the project with significant AI assistance. Fixture content is fictional. No external UI library, stock graphics, music, downloadable fonts or personal material is included.

The project's MIT license does not relicense these dependencies.
