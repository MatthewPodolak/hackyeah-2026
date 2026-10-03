import { apiJson } from "@/api/client.js";
import { API } from "@/api/endpoints.js";

const AI_TIMEOUT = 90000;

function send(endpoint, url, body, opts = {}) {
  return apiJson(url,
    {
      method: endpoint.method,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {})
    },
    opts);
}

export const AdminService = {
  problems: (status, { ct } = {}) => send(API.adminProblem.list, status ? `${API.adminProblem.list.url}?status=${status}` : API.adminProblem.list.url, undefined, { ct }),
  problem: (id, { ct } = {}) => send(API.adminProblem.get, API.adminProblem.get.url(id), undefined, { ct }),
  reviewProblem: (id, model) => send(API.adminProblem.review, API.adminProblem.review.url(id), model),
  unseenProblems: async ({ ct } = {}) => (await send(API.adminProblem.unseen, API.adminProblem.unseen.url, undefined, { ct }))?.unseen ?? 0,

  users: (status, { ct } = {}) => send(API.adminUser.list, status ? `${API.adminUser.list.url}?status=${status}` : API.adminUser.list.url, undefined, { ct }),
  pendingUsers: async ({ ct } = {}) => (await send(API.adminUser.pending, API.adminUser.pending.url, undefined, { ct }))?.pending ?? 0,
  setUserStatus: (id, status) => send(API.adminUser.status, API.adminUser.status.url(id), { status }),

  createInnovation: (model) => send(API.adminCatalog.create, API.adminCatalog.create.url, model),
  updateInnovation: (id, model) => send(API.adminCatalog.update, API.adminCatalog.update.url(id), model),
  removeInnovation: (id) => send(API.adminCatalog.remove, API.adminCatalog.remove.url(id)),
  createResource: (model) => send(API.adminCatalog.createResource, API.adminCatalog.createResource.url, model),
  updateResource: (id, model) => send(API.adminCatalog.updateResource, API.adminCatalog.updateResource.url(id), model),
  removeResource: (id) => send(API.adminCatalog.removeResource, API.adminCatalog.removeResource.url(id)),

  stats: ({ ct } = {}) => send(API.stats.get, API.stats.get.url, undefined, { ct }),
  insights: () => send(API.stats.insights, API.stats.insights.url, undefined, { timeoutMs: AI_TIMEOUT }),
};

export const CatalogService = {
  innovations: ({ ct } = {}) => send(API.catalog.list, API.catalog.list.url, undefined, { ct }),
  regions: ({ ct } = {}) => send(API.catalog.regions, API.catalog.regions.url, undefined, { ct }),
  plan: (model) => send(API.middleman.plan, API.middleman.plan.url, model, { timeoutMs: AI_TIMEOUT }),
};
