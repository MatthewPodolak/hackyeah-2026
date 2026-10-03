import { apiJson } from "@/api/client.js";
import { API } from "@/api/endpoints.js";

export const AuthService = {
  async login(model, { ct, timeoutMs } = {}) {
    const { method, url } = API.auth.login;

    const res = await apiJson(url,
      {
        method: method,
        body: JSON.stringify(model)
      },
      { ct, timeoutMs });

    return res;
  },

  async register(model, { ct, timeoutMs } = {}) {
    const { method, url } = API.auth.register;

    const res = await apiJson(url,
      {
        method: method,
        body: JSON.stringify(model)
      },
      { ct, timeoutMs });

    return res;
  },

  async logout({ ct, timeoutMs } = {}) {
    const { method, url } = API.auth.logout;

    return apiJson(url, { method: method }, { ct, timeoutMs });
  },

  async me({ ct, timeoutMs } = {}) {
    const { method, url } = API.auth.me;

    try {
      return await apiJson(url, { method: method }, { ct, timeoutMs });
    } catch (error) {
      if (error.status === 401) return null;
      throw error;
    }
  }
};
