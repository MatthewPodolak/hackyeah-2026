import { apiJson } from "@/api/client.js";
import { API } from "@/api/endpoints.js";

const AI_TIMEOUT = 90000;

export const GrantCallService = {
  async active({ ct, timeoutMs } = {}) {
    const { method, url } = API.grantCall.active;

    return apiJson(url, { method: method }, { ct, timeoutMs });
  },

  async application(id, model, { ct, timeoutMs = AI_TIMEOUT } = {}) {
    const { method, url } = API.grantCall.application;

    const res = await apiJson(url(id),
      {
        method: method,
        body: JSON.stringify(model)
      },
      { ct, timeoutMs });

    return res;
  },

  async adminList({ ct, timeoutMs } = {}) {
    const { method, url } = API.grantCall.adminList;

    return apiJson(url, { method: method }, { ct, timeoutMs });
  },

  async adminSave(model, { ct, timeoutMs } = {}) {
    const { method, url } = model.id ? API.grantCall.adminUpdate : API.grantCall.adminCreate;

    const res = await apiJson(model.id ? url(model.id) : url,
      {
        method: method,
        body: JSON.stringify(model)
      },
      { ct, timeoutMs });

    return res;
  },

  async adminDelete(id, { ct, timeoutMs } = {}) {
    const { method, url } = API.grantCall.adminDelete;

    return apiJson(url(id), { method: method }, { ct, timeoutMs });
  }
};
