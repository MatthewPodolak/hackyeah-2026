import { apiJson } from "@/api/client.js";
import { API } from "@/api/endpoints.js";

export const CommunicationService = {
  async conversations({ ct, timeoutMs } = {}) {
    const { method, url } = API.conversation.list;

    return apiJson(url, { method: method }, { ct, timeoutMs });
  },

  async createConversation(model, { ct, timeoutMs } = {}) {
    const { method, url } = API.conversation.create;

    const res = await apiJson(url,
      {
        method: method,
        body: JSON.stringify(model)
      },
      { ct, timeoutMs });

    return res;
  },

  async messages(id, { ct, timeoutMs } = {}) {
    const { method, url } = API.conversation.messages;

    return apiJson(url(id), { method: method }, { ct, timeoutMs });
  },

  async reply(id, content, { ct, timeoutMs } = {}) {
    const { method, url } = API.conversation.reply;

    const res = await apiJson(url(id),
      {
        method: method,
        body: JSON.stringify({ content })
      },
      { ct, timeoutMs });

    return res;
  },

  async setStatus(id, status, { ct, timeoutMs } = {}) {
    const { method, url } = API.conversation.status;

    return apiJson(url(id), { method: method, body: JSON.stringify({ status }) }, { ct, timeoutMs });
  },

  async partnerships({ ct, timeoutMs } = {}) {
    const { method, url } = API.partnership.list;

    return apiJson(url, { method: method }, { ct, timeoutMs });
  },

  async createPartnership(model, { ct, timeoutMs } = {}) {
    const { method, url } = API.partnership.create;

    const res = await apiJson(url,
      {
        method: method,
        body: JSON.stringify(model)
      },
      { ct, timeoutMs });

    return res;
  }
};
