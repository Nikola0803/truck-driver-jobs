/**
 * Local DB client — drop-in replacement for @supabase/supabase-js.
 * Calls the Hono API server at /api/* (proxied by Vite in dev).
 *
 * Supports:
 *   db.from("table").select("*").eq("col", val).order("col").limit(n)
 *   db.from("table").insert([...])
 *   db.from("table").update({...}).eq("col", val)
 *   db.from("table").delete().eq("col", val)
 *   db.from("table").select("*", { count: "exact", head: true })
 *   db.from("table").maybeSingle()
 *   db.auth.signInWithPassword / signUp / signOut / getSession / onAuthStateChange
 *   db.functions.invoke("generate-content", { body: {...} })
 */

const TOKEN_KEY = "tdj_token";
const USER_KEY = "tdj_user";

// ── Auth state listeners ──────────────────────────────────────────────────
type AuthEventType = "SIGNED_IN" | "SIGNED_OUT";
type AuthListener = (event: AuthEventType, session: LocalSession | null) => void;
const authListeners: AuthListener[] = [];

interface LocalSession {
  user: LocalUser;
  access_token: string;
}

export interface LocalUser {
  id: string;
  email: string;
  created_at: string;
  is_admin?: boolean;
}

function getStoredSession(): LocalSession | null {
  const token = localStorage.getItem(TOKEN_KEY);
  const userRaw = localStorage.getItem(USER_KEY);
  if (!token || !userRaw) return null;
  try {
    return { access_token: token, user: JSON.parse(userRaw) };
  } catch {
    return null;
  }
}

function storeSession(token: string, user: LocalUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function notifyListeners(event: AuthEventType, session: LocalSession | null) {
  authListeners.forEach((fn) => fn(event, session));
}

// ── HTTP helper ───────────────────────────────────────────────────────────
async function request(
  method: string,
  url: string,
  body?: unknown
): Promise<{ data: any; error: any; count: number | null }> {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  let json: any;
  try { json = await res.json(); } catch { json = null; }

  if (!res.ok) {
    return { data: null, error: { message: json?.message ?? `HTTP ${res.status}`, status: res.status }, count: null };
  }

  if (json && typeof json === "object" && "count" in json && !Array.isArray(json)) {
    return { data: null, error: null, count: json.count as number };
  }

  return { data: json, error: null, count: Array.isArray(json) ? json.length : null };
}

// ── QueryBuilder ──────────────────────────────────────────────────────────
class QueryBuilder {
  private _table: string;
  private _params: URLSearchParams = new URLSearchParams();
  private _method: "GET" | "POST" | "PATCH" | "DELETE" = "GET";
  private _body: unknown = undefined;
  private _single = false;
  private _head = false;

  constructor(table: string) {
    this._table = table;
  }

  select(cols = "*", opts: { count?: string; head?: boolean } = {}): this {
    if (cols && cols !== "*") this._params.set("select", cols);
    if (opts.count) this._params.set("count", opts.count);
    if (opts.head) { this._params.set("head", "true"); this._head = true; }
    return this;
  }

  eq(col: string, val: unknown): this { this._params.set(col, `eq.${val}`); return this; }
  neq(col: string, val: unknown): this { this._params.set(col, `neq.${val}`); return this; }
  gte(col: string, val: unknown): this { this._params.set(col, `gte.${val}`); return this; }
  lte(col: string, val: unknown): this { this._params.set(col, `lte.${val}`); return this; }
  is(col: string, val: "null" | "not.null"): this { this._params.set(col, `is.${val}`); return this; }
  in(col: string, vals: unknown[]): this { this._params.set(col, `in.(${vals.join(",")})`); return this; }
  like(col: string, pattern: string): this { this._params.set(col, `like.${pattern}`); return this; }

  order(col: string, opts: { ascending?: boolean } = {}): this {
    this._params.append("order", `${col}.${opts.ascending === false ? "desc" : "asc"}`);
    return this;
  }

  limit(n: number): this { this._params.set("limit", String(n)); return this; }
  offset(n: number): this { this._params.set("offset", String(n)); return this; }

  maybeSingle(): this { this._single = true; this._params.set("limit", "1"); return this; }
  single(): this { return this.maybeSingle(); }

  insert(rows: Record<string, unknown> | Record<string, unknown>[]): this {
    this._method = "POST";
    this._body = Array.isArray(rows) ? rows : [rows];
    return this;
  }

  update(data: Record<string, unknown>): this {
    this._method = "PATCH";
    this._body = data;
    return this;
  }

  upsert(rows: Record<string, unknown> | Record<string, unknown>[]): this {
    this._method = "POST"; // simplified
    this._body = Array.isArray(rows) ? rows : [rows];
    return this;
  }

  delete(): this { this._method = "DELETE"; return this; }

  // Make QueryBuilder awaitable via .then()
  then(resolve: (val: { data: any; error: any; count: number | null }) => void, reject?: (err: any) => void) {
    const qs = this._params.toString();
    const url = `/api/${this._table}${qs ? "?" + qs : ""}`;

    request(this._method, url, this._body)
      .then(({ data, error, count }) => {
        if (error) { resolve({ data: null, error, count: null }); return; }

        if (this._head) {
          resolve({ data: null, error: null, count: count ?? 0 });
        } else if (this._single) {
          const arr = Array.isArray(data) ? data : (data ? [data] : []);
          resolve({ data: arr[0] ?? null, error: null, count: null });
        } else {
          resolve({ data, error: null, count });
        }
      })
      .catch((err: Error) => {
        const result = { data: null, error: { message: err.message }, count: null };
        if (reject) reject(result);
        else resolve(result);
      });
  }
}

// ── Main client ───────────────────────────────────────────────────────────
export const db = {
  from(table: string) {
    return new QueryBuilder(table);
  },

  auth: {
    async getSession(): Promise<{ data: { session: LocalSession | null } }> {
      const session = getStoredSession();
      return { data: { session } };
    },

    onAuthStateChange(callback: AuthListener) {
      authListeners.push(callback);
      // Immediately call with current state
      const session = getStoredSession();
      if (session) callback("SIGNED_IN", session);
      return {
        data: {
          subscription: {
            unsubscribe() {
              const idx = authListeners.indexOf(callback);
              if (idx !== -1) authListeners.splice(idx, 1);
            },
          },
        },
      };
    },

    async signInWithPassword(credentials: { email: string; password: string }) {
      const { data, error } = await request("POST", "/api/auth/login", credentials);
      if (error) return { data: { session: null, user: null }, error };
      const { token, user } = data;
      storeSession(token, user);
      const session: LocalSession = { access_token: token, user };
      notifyListeners("SIGNED_IN", session);
      return { data: { session, user }, error: null };
    },

    async signUp(credentials: { email: string; password: string } & Record<string, unknown>) {
      const { data, error } = await request("POST", "/api/auth/register", credentials);
      if (error) return { data: { session: null, user: null }, error };
      const { token, user } = data;
      storeSession(token, user);
      const session: LocalSession = { access_token: token, user };
      notifyListeners("SIGNED_IN", session);
      return { data: { session, user }, error: null };
    },

    async signOut() {
      clearSession();
      notifyListeners("SIGNED_OUT", null);
      return { error: null };
    },

    getUser() {
      const session = getStoredSession();
      return { data: { user: session?.user ?? null }, error: null };
    },
  },

  functions: {
    async invoke(name: string, opts: { body?: unknown } = {}) {
      if (name === "generate-content") {
        const { data, error } = await request("POST", "/api/rpc/generate-content", opts.body ?? {});
        return { data, error };
      }
      // Stub other functions
      console.warn(`[db] functions.invoke("${name}") not implemented`);
      return { data: null, error: null };
    },
  },
};
