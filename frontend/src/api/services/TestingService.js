import { apiJson } from "@/api/client.js";
import { API } from "@/api/endpoints.js";

export const TestingService = {
  async participate(innovationId, model, { ct, timeoutMs } = {}) {
    const { method, url } = API.testing.participate;

    const res = await apiJson(url(innovationId),
      {
        method: method,
        body: JSON.stringify(model)
      },
      { ct, timeoutMs });

    return res;
  },

  async reviews(innovationId, { ct, timeoutMs } = {}) {
    const { method, url } = API.testing.reviews;

    return apiJson(url(innovationId), { method: method }, { ct, timeoutMs });
  },

  async addReview(innovationId, model, { ct, timeoutMs } = {}) {
    const { method, url } = API.testing.addReview;

    const res = await apiJson(url(innovationId),
      {
        method: method,
        body: JSON.stringify(model)
      },
      { ct, timeoutMs });

    return res;
  },

  async mine({ ct, timeoutMs } = {}) {
    const { method, url } = API.testing.mine;

    return apiJson(url, { method: method }, { ct, timeoutMs });
  },

  async adminList(status, { ct, timeoutMs } = {}) {
    const { method, url } = API.testing.adminList;

    return apiJson(status ? `${url}?status=${encodeURIComponent(status)}` : url, { method: method }, { ct, timeoutMs });
  },

  async adminStatus(id, status, { ct, timeoutMs } = {}) {
    const { method, url } = API.testing.adminStatus;

    const res = await apiJson(url(id),
      {
        method: method,
        body: JSON.stringify({ status })
      },
      { ct, timeoutMs });

    return res;
  }
};
