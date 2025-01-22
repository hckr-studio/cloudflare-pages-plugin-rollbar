import { Rollbar } from "../lib/rollbar.js";

/**
 * @param {EventContext} context
 * @returns {Promise<Response>}
 */
export async function onRequest(context) {
  const { pluginArgs, ...ctx } = context;
  const { CF_PAGES, CF_PAGES_COMMIT_SHA } = context.env;
  const env = {
    environment: CF_PAGES == 1 ? "production" : "development",
    code_version: CF_PAGES_COMMIT_SHA,
    framework: "Cloudflare Pages",
  }
  context.data.rollbar = new Rollbar({ context: ctx, env, ...pluginArgs });

  try {
    return await context.next();
  } catch (thrown) {
    await context.data.rollbar.error(thrown);
    throw thrown;
  }
}
