import { apiJson } from "@/api/client.js";
import { API } from "@/api/endpoints.js";

export const ConfigService = {
  async canvas({ ct, timeoutMs } = {}) {
    const { method, url } = API.config.canvas;

    return apiJson(url, { method: method }, { ct, timeoutMs });
  },

  async resources({ ct, timeoutMs } = {}) {
    const { method, url } = API.knowledge.resources;

    return apiJson(url, { method: method }, { ct, timeoutMs });
  }
};
