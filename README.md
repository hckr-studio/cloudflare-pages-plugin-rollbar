# cloudflare-pages-plugin-rollbar
[![NPM Version](https://img.shields.io/npm/v/@hckr_/cloudflare-pages-plugin-rollbar)](https://www.npmjs.com/package/@hckr_/cloudflare-pages-plugin-rollbar)
[![GitHub License](https://img.shields.io/github/license/hckr-studio/cloudflare-pages-plugin-rollbar)](https://eupl.eu/1.2/en/)


Rollbar integration plugin for Cloudflare Pages

## Installation

```bash
yarn add @hckr_/cloudflare-pages-plugin-rollbar
```

```bash
npm install @hckr_/cloudflare-pages-plugin-rollbar
```

## Usage

```javascript
// functions/_middleware.js
import rollbarPlugin from "@hckr_/cloudflare-pages-plugin-rollbar";

/**
 * @param {EventContext<Env>} context
 * @returns {Promise<Response>}
 */
export async function rollbar(context) {
  return rollbarPlugin({ token: context.env.ROLLBAR_TOKEN })(context);
}

export const onRequest = [rollbar];
```

The Plugin takes an object with two properties: the Rollbar Project Access `token` with `post_server_item` scope
and optional `custom` for adding custom properties into logged payload.

This plugin catches unhandled exceptions and logs them into Rollbar.
It gathers `request` data and Cloudflare metadata with exception details.

You can access Rollbar logger instance via the `context.data.rollbar` property. 
There are `debug`, `info`, `warn` and `error` methods for corresponding levels.
First three take `message` and `attributes` as parameters. `error` takes
`exception` and `descrition`.

```typescript
interface Rollbar {
    debug(message: string, attributes: Record<string, any>): Promise;
    info(message: string, attributes: Record<string, any>): Promise;
    warn(message: string, attributes: Record<string, any>): Promise;
    error(exception: Error, description: string): Promise;
}
```

## Publish

```bash
yarn build
yarn npm publish --access public --tag latest
```
