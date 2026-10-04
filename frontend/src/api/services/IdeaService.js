import { apiJson } from "@/api/client.js";
import { API } from "@/api/endpoints.js";

const AI_TIMEOUT = 60000;

export const IdeaService = {
  async add(model, { ct, timeoutMs } = {}) {
    if(!model){ return; }

    const { method, url } = API.idea.add;

    const res = await apiJson(url,
      {
        method: method,
        body: JSON.stringify(model)
      },
      { ct, timeoutMs });

    return res;
  },

  async gallery({ ct, timeoutMs } = {}) {
    const { method, url } = API.idea.gallery;

    return apiJson(url, { method: method }, { ct, timeoutMs });
  },

  async draft(model, { ct, timeoutMs = AI_TIMEOUT } = {}) {
    const { method, url } = API.idea.draft;

    const res = await apiJson(url,
      {
        method: method,
        body: JSON.stringify(model)
      },
      { ct, timeoutMs });

    return res;
  },

  async mine({ ct, timeoutMs } = {}) {
    const { method, url } = API.idea.mine;

    return apiJson(url, { method: method }, { ct, timeoutMs });
  },

  async getByToken(token, { ct, timeoutMs } = {}) {
    const { method, url } = API.idea.byToken;

    const res = await apiJson(url(token),
      {
        method: method
      },
      { ct, timeoutMs });

    return res;
  },

  async update(token, model, { ct, timeoutMs } = {}) {
    const { method, url } = API.idea.update;

    const res = await apiJson(url(token),
      {
        method: method,
        body: JSON.stringify(model)
      },
      { ct, timeoutMs });

    return res;
  },

  async similar(token, { ct, timeoutMs = AI_TIMEOUT } = {}) {
    const { method, url } = API.idea.similar;

    const res = await apiJson(url(token),
      {
        method: method
      },
      { ct, timeoutMs });

    return res;
  },

  async saveCanvas(token, answers, { ct, timeoutMs } = {}) {
    const { method, url } = API.idea.saveCanvas;

    const res = await apiJson(url(token),
      {
        method: method,
        body: JSON.stringify({ answers })
      },
      { ct, timeoutMs });

    return res;
  },

  async suggestCanvas(token, step, { ct, timeoutMs = AI_TIMEOUT } = {}) {
    const { method, url } = API.idea.suggestCanvas;

    return apiJson(url(token, step), { method: method }, { ct, timeoutMs });
  },

  async feedback(token, { ct, timeoutMs = AI_TIMEOUT } = {}) {
    const { method, url } = API.idea.feedback;

    return apiJson(url(token), { method: method }, { ct, timeoutMs });
  },

  async visualize(token, description, { ct, timeoutMs = 120000 } = {}) {
    const { method, url } = API.idea.visualize;

    const res = await apiJson(url(token),
      {
        method: method,
        body: JSON.stringify({ description })
      },
      { ct, timeoutMs });

    return res;
  }
};
