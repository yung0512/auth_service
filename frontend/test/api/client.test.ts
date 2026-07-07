import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { api, getToken, setToken } from "../../src/api/client";

// The JWT lifecycle on the frontend lives in src/api/client.ts:
//   - in-memory access token (getToken / setToken)
//   - request interceptor attaches "Authorization: Bearer <token>"
//   - response interceptor performs 401 -> /auth/refresh -> retry,
//     with a single-flight refreshPromise shared across concurrent 401s
//
// We exercise those interceptors by swapping the axios adapter for a
// programmable stub, so no network and no extra mock library are needed.

interface RecordedRequest {
  url?: string;
  method?: string;
  auth?: string;
}

type Reply = { status: number; data?: unknown };
type Handler = (config: InternalAxiosRequestConfig) => Reply;

const realAdapter = api.defaults.adapter;

/**
 * Install a mock adapter that records every outgoing request and returns
 * whatever `handler` decides. A >= 400 status is turned into an AxiosError
 * (as the real HTTP adapter would), so the response error interceptor fires.
 */
function installAdapter(handler: Handler): RecordedRequest[] {
  const requests: RecordedRequest[] = [];

  api.defaults.adapter = async (config) => {
    const auth = config.headers.Authorization;
    requests.push({
      url: config.url,
      method: config.method,
      auth: auth == null ? undefined : String(auth),
    });

    const reply = handler(config as InternalAxiosRequestConfig);
    const response = {
      data: reply.data,
      status: reply.status,
      statusText: String(reply.status),
      headers: {},
      config,
    };

    if (reply.status >= 400) {
      throw new AxiosError(
        `Request failed with status code ${reply.status}`,
        AxiosError.ERR_BAD_REQUEST,
        config,
        undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        response as any,
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return response as any;
  };

  return requests;
}

beforeEach(() => {
  setToken(null);
});

afterEach(() => {
  setToken(null);
  api.defaults.adapter = realAdapter;
});

describe("token store", () => {
  it("returns null before any token is set", () => {
    expect(getToken()).toBeNull();
  });

  it("round-trips the access token through setToken/getToken", () => {
    setToken("abc.def.ghi");
    expect(getToken()).toBe("abc.def.ghi");

    setToken(null);
    expect(getToken()).toBeNull();
  });
});

describe("request interceptor", () => {
  it("attaches the Bearer token when one is set", async () => {
    const requests = installAdapter(() => ({ status: 200, data: { ok: true } }));
    setToken("my-access-token");

    await api.get("/protected");

    expect(requests[0].auth).toBe("Bearer my-access-token");
  });

  it("sends no Authorization header when there is no token", async () => {
    const requests = installAdapter(() => ({ status: 200, data: { ok: true } }));

    await api.get("/public");

    expect(requests[0].auth).toBeUndefined();
  });
});

describe("401 refresh flow", () => {
  it("refreshes the token and retries the original request", async () => {
    const requests = installAdapter((config) => {
      if (config.url === "/auth/refresh") {
        return { status: 200, data: { data: { token: "fresh-token" } } };
      }
      // The protected endpoint only succeeds once the fresh token is used.
      return config.headers.Authorization === "Bearer fresh-token"
        ? { status: 200, data: { ok: true } }
        : { status: 401 };
    });
    setToken("stale-token");

    const res = await api.get("/protected");

    expect(res.data).toEqual({ ok: true });
    expect(getToken()).toBe("fresh-token");

    const urls = requests.map((r) => r.url);
    expect(urls).toEqual(["/protected", "/auth/refresh", "/protected"]);
  });

  it("shares a single refresh call across concurrent 401s (single-flight)", async () => {
    let refreshCalls = 0;
    installAdapter((config) => {
      if (config.url === "/auth/refresh") {
        refreshCalls += 1;
        return { status: 200, data: { data: { token: "fresh-token" } } };
      }
      return config.headers.Authorization === "Bearer fresh-token"
        ? { status: 200, data: { ok: true } }
        : { status: 401 };
    });
    setToken("stale-token");

    const [a, b] = await Promise.all([
      api.get("/resource-a"),
      api.get("/resource-b"),
    ]);

    expect(a.data).toEqual({ ok: true });
    expect(b.data).toEqual({ ok: true });
    expect(refreshCalls).toBe(1);
  });

  it("clears the token and rejects when refresh fails", async () => {
    installAdapter((config) => {
      if (config.url === "/auth/refresh") {
        return { status: 401 };
      }
      return { status: 401 };
    });
    setToken("stale-token");

    await expect(api.get("/protected")).rejects.toBeInstanceOf(AxiosError);
    expect(getToken()).toBeNull();
  });

  it("does not attempt to refresh when /auth/refresh itself returns 401", async () => {
    const requests = installAdapter(() => ({ status: 401 }));

    await expect(api.post("/auth/refresh")).rejects.toBeInstanceOf(AxiosError);

    // Exactly one call: the refresh endpoint must not recurse into itself.
    expect(requests.map((r) => r.url)).toEqual(["/auth/refresh"]);
  });

  it("does not retry a request more than once", async () => {
    const requests = installAdapter((config) => {
      if (config.url === "/auth/refresh") {
        return { status: 200, data: { data: { token: "fresh-token" } } };
      }
      // The protected endpoint keeps returning 401 even after refresh.
      return { status: 401 };
    });
    setToken("stale-token");

    await expect(api.get("/protected")).rejects.toBeInstanceOf(AxiosError);

    // /protected (401) -> /auth/refresh (200) -> /protected retry (401) -> stop.
    expect(requests.map((r) => r.url)).toEqual([
      "/protected",
      "/auth/refresh",
      "/protected",
    ]);
  });
});
