import { apiJson } from "@/api/client.js";
import { API } from "@/api/endpoints.js";

export const ProblemService = {
  async add(model, { ct, timeoutMs } = {}) {
    if(!model){ return; }

    const { method, url } = API.problem.add;

    const res = await apiJson(url,
      {
        method: method,
        body: JSON.stringify(model)
      },
      { ct, timeoutMs });

    return res;
  },


  async get({ ct, timeoutMs } = {}) {
    const { method, url } = API.problem.get;

    const res = await apiJson(url,
      {
        method: method
      },
      { ct, timeoutMs });

    return res;
  },

  // JST: reports from its gmina, ROPS: all reports
  async reported({ ct, timeoutMs } = {}) {
    const { method, url } = API.problem.reported;

    const res = await apiJson(url,
      {
        method: method
      },
      { ct, timeoutMs });

    return res;
  },

  // JST: reports of its gmina waiting for its decision
  async reportedWaiting({ ct, timeoutMs } = {}) {
    const { method, url } = API.problem.reportedWaiting;

    const res = await apiJson(url,
      {
        method: method
      },
      { ct, timeoutMs });

    return res?.waiting ?? 0;
  },

  // JST: { accept, priority, note }
  async decide(id, model, { ct, timeoutMs } = {}) {
    const { method, url } = API.problem.decide;

    return apiJson(url(id),
      {
        method: method,
        body: JSON.stringify(model)
      },
      { ct, timeoutMs });
  },

  async getById(id, { ct, timeoutMs } = {}) {
    const { method, url } = API.problem.getById;

    const res = await apiJson(url(id),
      {
        method: method
      },
      { ct, timeoutMs });

    return res;
  },

  async byToken(token, { ct, timeoutMs } = {}) {
    const { method, url } = API.problem.byToken;

    return apiJson(url(token), { method: method }, { ct, timeoutMs });
  },

  async mine({ ct, timeoutMs } = {}) {
    const { method, url } = API.problem.mine;

    return apiJson(url, { method: method }, { ct, timeoutMs });
  }
};
