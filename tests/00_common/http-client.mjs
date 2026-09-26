import { baseUrl } from "./config.mjs";

/**
 * Client HTTP opaque-box avec gestionnaire de cookies pour NextAuth.
 */
export class HttpClient {
  constructor(customBaseUrl = baseUrl) {
    this.baseUrl = customBaseUrl;
    this.cookies = new Map();
  }

  /**
   * Enregistre les cookies issus de l'en-tête set-cookie.
   * @param {Headers} headers
   */
  captureCookies(headers) {
    const rawSetCookie = headers.getSetCookie?.() || [];
    const fallback = headers.get("set-cookie");
    const cookieHeaders = rawSetCookie.length > 0 ? rawSetCookie : fallback ? [fallback] : [];

    for (const cookieStr of cookieHeaders) {
      const parts = cookieStr.split(";")[0].split("=");
      const name = parts[0].trim();
      const val = parts.slice(1).join("=").trim();
      this.cookies.set(name, val);
    }
  }

  /**
   * Construit la chaîne d'en-tête Cookie.
   * @returns {string}
   */
  getCookieHeader() {
    const list = [];
    for (const [name, val] of this.cookies.entries()) {
      list.push(`${name}=${val}`);
    }
    return list.join("; ");
  }

  /**
   * Réinitialise les cookies stockés.
   */
  clearCookies() {
    this.cookies.clear();
  }

  /**
   * Effectue une requête HTTP générique avec suivi manuel de redirection par défaut.
   * @param {string} endpoint
   * @param {RequestInit} [options={}]
   * @returns {Promise<Response>}
   */
  async request(endpoint, options = {}) {
    const url = endpoint.startsWith("http") ? endpoint : `${this.baseUrl}${endpoint}`;
    const headers = new Headers(options.headers || {});

    const cookieHeader = this.getCookieHeader();
    if (cookieHeader && !headers.has("cookie")) {
      headers.set("cookie", cookieHeader);
    }

    const res = await fetch(url, {
      ...options,
      headers,
      redirect: options.redirect || "manual",
    });

    this.captureCookies(res.headers);
    return res;
  }

  /**
   * Envoie une requête GET.
   * @param {string} endpoint
   * @param {RequestInit} [options={}]
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: "GET" });
  }

  /**
   * Envoie une requête POST (JSON ou formulaire URL-encoded).
   * @param {string} endpoint
   * @param {any} body
   * @param {RequestInit} [options={}]
   */
  async post(endpoint, body, options = {}) {
    const headers = new Headers(options.headers || {});
    let finalBody = body;

    if (body && typeof body === "object" && !(body instanceof URLSearchParams)) {
      if (!headers.has("content-type")) {
        headers.set("content-type", "application/json");
      }
      if (headers.get("content-type").includes("json")) {
        finalBody = JSON.stringify(body);
      }
    }

    return this.request(endpoint, {
      ...options,
      method: "POST",
      headers,
      body: finalBody,
    });
  }

  /**
   * Récupère le jeton CSRF officiel via l'endpoint NextAuth /api/auth/csrf.
   * @returns {Promise<string>}
   */
  async fetchCsrfToken() {
    const res = await this.get("/api/auth/csrf");
    if (!res.ok) {
      throw new Error(`Échec de récupération du token CSRF: HTTP ${res.status}`);
    }
    const data = await res.json();
    if (!data.csrfToken) {
      throw new Error("Jeton csrfToken absent de la réponse JSON");
    }
    return data.csrfToken;
  }

  /**
   * Exécute le flux d'authentification credentials NextAuth complet.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{ response: Response, sessionToken: string | null }>}
   */
  async authenticate(email, password) {
    const csrfToken = await this.fetchCsrfToken();
    const params = new URLSearchParams();
    params.set("email", email);
    params.set("password", password);
    params.set("csrfToken", csrfToken);
    params.set("json", "true");

    const res = await this.post("/api/auth/callback/credentials", params, {
      headers: { "content-type": "application/x-www-form-urlencoded" },
      redirect: "manual",
    });

    const sessionCookieName = Array.from(this.cookies.keys()).find((k) =>
      k.includes("session-token")
    );
    const sessionToken = sessionCookieName ? this.cookies.get(sessionCookieName) : null;

    return { response: res, sessionToken };
  }
}
