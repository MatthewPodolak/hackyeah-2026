import { apiJson } from "@/api/client.js";
import { API } from "@/api/endpoints.js";

export const AdminIdeaService = {
  async list({ ct, timeoutMs } = {}) {
    const { method, url } = API.adminIdea.list;

    return apiJson(url, { method: method }, { ct, timeoutMs });
  },

  async get(id, { ct, timeoutMs } = {}) {
    const { method, url } = API.adminIdea.get;

    return apiJson(url(id), { method: method }, { ct, timeoutMs });
  },

  async review(id, model, { ct, timeoutMs } = {}) {
    const { method, url } = API.adminIdea.review;

    const res = await apiJson(url(id),
      {
        method: method,
        body: JSON.stringify(model)
      },
      { ct, timeoutMs });

    return res;
  },

  async unseen({ ct, timeoutMs } = {}) {
    const { method, url } = API.adminIdea.unseen;

    const res = await apiJson(url, { method: method }, { ct, timeoutMs });
    return res?.unseen ?? 0;
  }
};
