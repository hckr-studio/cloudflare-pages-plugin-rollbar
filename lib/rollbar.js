import ErrorStackParser from "error-stack-parser";

function Frame(stackFrame) {
  return {
    filename: stackFrame.fileName,
    lineno: stackFrame.lineNumber,
    colno: stackFrame.columnNumber,
    method: stackFrame.functionName,
    args: stackFrame.args,
  };
}

export async function postItem(token, data) {
  const resp = await fetch("https://api.rollbar.com/api/1/item/", {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "X-Rollbar-Access-Token": token,
    },
    body: JSON.stringify({ data }),
  });
  return resp.json();
}

/**
 * @param {Request} request
 * @param {Params} params
 */
function dumpRequest(request, params) {
  const { searchParams } = new URL(request.url);
  return {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers),
    params,
    GET: Object.fromEntries(searchParams),
    query_string: searchParams.toString(),
    // TODO: POST, body
    user_ip: request.headers.get("CF-Connecting-IP"),
  };
}

export class Rollbar {
  constructor({ context, token, custom, env }) {
    this.token = token;
    this.context = context;
    this.custom = custom;
    this.env = env;
  }

  /**
   * @private
   * @param {"debug"|"info"|"warn"|"error"|"critical"} level
   * @param {Object} item
   * @returns {Promise<unknown>}
   */
  log(level, item) {
    console[level]?.(item.body.message?.body ?? item.body.trace.exception.message);
    const request = dumpRequest(this.context.request, this.context.params);
    const uuid = crypto.randomUUID();
    const context = this.context.functionPath;
    const custom = Object.assign({ cf: this.context.request.cf }, this.custom);
    level = level === "warn" ? "warning" : level;
    return postItem(
      this.token,
      Object.assign({ level, request, uuid, context, custom }, item, this.env, {
        platform: "Cloudflare-Workers",
        language: "javascript",
        notifier: { name: "Cloudflare Pages Functions" },
      }),
    );
  }

  /**
   *
   * @param {String} message
   * @param {Record<string, any>} attributes
   * @returns {Promise<*>}
   */
  debug(message, attributes) {
    return this.log("debug", {
      timestamp: Date.now(),
      body: { message: { body: message, ...attributes } },
    });
  }
  /**
   *
   * @param {String} message
   * @param {Record<string, any>} attributes
   * @returns {Promise<*>}
   */
  info(message, attributes) {
    return this.log("info", {
      timestamp: Date.now(),
      body: { message: { body: message, ...attributes } },
    });
  }
  /**
   *
   * @param {String} message
   * @param {Record<string, any>} attributes
   * @returns {Promise<*>}
   */
  warn(message, attributes) {
    return this.log("warn", {
      timestamp: Date.now(),
      body: { message: { body: message, ...attributes } },
    });
  }

  /**
   *
   * @param {Error} exception
   * @param {String} description
   * @returns {Promise<*>}
   */
  error(exception, description) {
    return this.log("error", {
      timestamp: Date.now(),
      body: {
        trace: {
          frames: ErrorStackParser.parse(exception).map(stackFrame => Frame(stackFrame)),
          exception: {
            class: exception.name,
            message: exception.message,
            description: description
          }
        }
      } ,
    });
  }
}
