# exFetch (NodeJS)

[⚖️ MIT](./LICENSE.md)

|  | **Release - Latest** | **Release - Pre** |
|:-:|:-:|:-:|
| [![GitHub](https://img.shields.io/badge/GitHub-181717?logo=github&logoColor=ffffff&style=flat-square "GitHub")](https://github.com/hugoalh-studio/exfetch-nodejs) | ![GitHub Latest Release Version](https://img.shields.io/github/release/hugoalh-studio/exfetch-nodejs?sort=semver&label=&style=flat-square "GitHub Latest Release Version") (![GitHub Latest Release Date](https://img.shields.io/github/release-date/hugoalh-studio/exfetch-nodejs?label=&style=flat-square "GitHub Latest Release Date")) | ![GitHub Latest Pre-Release Version](https://img.shields.io/github/release/hugoalh-studio/exfetch-nodejs?include_prereleases&sort=semver&label=&style=flat-square "GitHub Latest Pre-Release Version") (![GitHub Latest Pre-Release Date](https://img.shields.io/github/release-date-pre/hugoalh-studio/exfetch-nodejs?label=&style=flat-square "GitHub Latest Pre-Release Date")) |
| [![NPM](https://img.shields.io/badge/NPM-CB3837?logo=npm&logoColor=ffffff&style=flat-square "NPM")](https://www.npmjs.com/package/@hugoalh/exfetch) | ![NPM Latest Release Version](https://img.shields.io/npm/v/@hugoalh/exfetch/latest?label=&style=flat-square "NPM Latest Release Version") | ![NPM Latest Pre-Release Version](https://img.shields.io/npm/v/@hugoalh/exfetch/pre?label=&style=flat-square "NPM Latest Pre-Release Version") |

A NodeJS module to extend `fetch`.

This project is inspired from:

- [Deno - Standard Library - Async](https://deno.land/std/async)
- axios ([GitHub](https://github.com/axios/axios))([NPM](https://www.npmjs.com/package/axios))
- jhermsmeier/node-http-link-header ([GitHub](https://github.com/jhermsmeier/node-http-link-header))([NPM](https://www.npmjs.com/package/http-link-header))
- node-fetch ([GitHub](https://github.com/node-fetch/node-fetch))([NPM](https://www.npmjs.com/package/node-fetch))
- octokit/plugin-paginate-rest.js ([GitHub](https://github.com/octokit/plugin-paginate-rest.js))([NPM](https://www.npmjs.com/package/@octokit/plugin-paginate-rest))
- octokit/plugin-retry.js ([GitHub](https://github.com/octokit/plugin-retry.js))([NPM](https://www.npmjs.com/package/@octokit/plugin-retry))
- sindresorhus/got ([GitHub](https://github.com/sindresorhus/got))([NPM](https://www.npmjs.com/package/got))
- sindresorhus/ky ([GitHub](https://github.com/sindresorhus/ky))([NPM](https://www.npmjs.com/package/ky))
- superagent ([GitHub](https://github.com/ladjs/superagent))([NPM](https://www.npmjs.com/package/superagent))
- thlorenz/parse-link-header ([GitHub](https://github.com/thlorenz/parse-link-header))([NPM](https://www.npmjs.com/package/parse-link-header))

## 🌟 Feature

- Automatically retry on failure requests, preferentially obey the response header `Retry-After`.
- Redirect fine control.
- Simplify URL paginate requests.

## 🔰 Begin

### NodeJS

- **Target Version:** >= v18.12.0, &:
  - TypeScript >= v5.1.0 *\[Development\]*
- **Require Permission:** *N/A*
- **Registry:**
  - [NPM](https://www.npmjs.com/package/@hugoalh/exfetch)
    ```sh
    npm install @hugoalh/exfetch[@<Tag>]
    ```
    ```js
    import ... from "@hugoalh/exfetch";
    ```

> **ℹ️ Notice:** It is also able to import part of the module with sub path if available, see [file `package.json`](./package.json) property `exports` for available sub paths.

## 🧩 API (Excerpt)

> **ℹ️ Notice:** Documentation is included inside the script file.

### Class

- `ExFetch`
- `HTTPHeaderLink`
- `HTTPHeaderRetryAfter`

### Function

- `exFetch`
- `exFetchPaginate`

## ✍️ Example

- ```ts
  import { exFetchPaginate } from "@hugoalh/exfetch/exfetch";
  const responses: Response[] = await exFetchPaginate("https://api.github.com/repos/microsoft/vscode/labels?per_page=100");

  responses.map((response: Response) => {
    return response.ok;
  }).includes(false);
  //=> false (`false` when no broken page, otherwise `true`)

  const result = [];
  for (const response of responses) {
    result.push(...(await response.json()));
  }
  result;
  /*=>
  [
    {
      "id": 2339554941,
      "node_id": "MDU6TGFiZWwyMzM5NTU0OTQx",
      "url": "https://api.github.com/repos/microsoft/vscode/labels/:apple:%20si",
      "name": ":apple: si",
      "color": "e99695",
      "default": false,
      "description": "Issues related to apple silicon"
    },
    {
      "id": 421131022,
      "node_id": "MDU6TGFiZWw0MjExMzEwMjI=",
      "url": "https://api.github.com/repos/microsoft/vscode/labels/*as-designed",
      "name": "*as-designed",
      "color": "E2A1C2",
      "default": false,
      "description": "Described behavior is as designed"
    },
    {
      "id": 409283388,
      "node_id": "MDU6TGFiZWw0MDkyODMzODg=",
      "url": "https://api.github.com/repos/microsoft/vscode/labels/*caused-by-extension",
      "name": "*caused-by-extension",
      "color": "E2A1C2",
      "default": false,
      "description": "Issue identified to be caused by an extension"
    },
    {
      "id": 766755777,
      "node_id": "MDU6TGFiZWw3NjY3NTU3Nzc=",
      "url": "https://api.github.com/repos/microsoft/vscode/labels/*dev-question",
      "name": "*dev-question",
      "color": "E2A1C2",
      "default": false,
      "description": "VS Code Extension Development Question"
    },
    {
      "id": 366106217,
      "node_id": "MDU6TGFiZWwzNjYxMDYyMTc=",
      "url": "https://api.github.com/repos/microsoft/vscode/labels/*duplicate",
      "name": "*duplicate",
      "color": "E2A1C2",
      "default": false,
      "description": "Issue identified as a duplicate of another issue(s)"
    },
    ... +467
  ]
  */
  ```

## 🔗 Other Edition

- [Deno](https://github.com/hugoalh-studio/exfetch-deno)
