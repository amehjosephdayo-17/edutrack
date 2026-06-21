/**
 * api.js — Thin fetch wrapper for EduTrack backend calls.
 *
 * All requests send/receive JSON. On a 401 the user is redirected to login.
 */

const API = (() => {
  /**
   * Core fetch helper.
   * @param {string} url
   * @param {RequestInit} options
   * @returns {Promise<{ok: boolean, status: number, data: any}>}
   */
  async function request(url, options = {}) {
    const defaultHeaders = { "Content-Type": "application/json" };

    const config = {
      credentials: "same-origin", // send session cookie
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {}),
      },
    };

    // If the body is already a string (e.g. JSON.stringify'd), keep it as-is
    if (config.body && typeof config.body !== "string") {
      config.body = JSON.stringify(config.body);
    }

    try {
      const res = await fetch(url, config);

      // Session expired / not authenticated — redirect to login
      if (res.status === 401) {
        window.location.href = "/index.html";
        return { ok: false, status: 401, data: null };
      }

      let data = null;
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        data = await res.json();
      }

      return { ok: res.ok, status: res.status, data };
    } catch (err) {
      console.error("API request failed:", err);
      return {
        ok: false,
        status: 0,
        data: { success: false, message: "Network error. Please try again." },
      };
    }
  }

  return {
    get: (url) => request(url, { method: "GET" }),

    post: (url, body) => request(url, { method: "POST", body }),

    patch: (url, body) => request(url, { method: "PATCH", body }),
  };
})();
