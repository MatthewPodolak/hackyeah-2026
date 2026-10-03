export const API = {
  auth: {
    login: { method: "POST", url: "/api/v1/auth/login" },
    register: { method: "POST", url: "/api/v1/auth/register" },
    logout: { method: "POST", url: "/api/v1/auth/logout" },
    me: { method: "GET", url: "/api/v1/auth/me" },
  },
  idea: {
    add: { method: "POST", url: "/api/v1/ideas" },
    gallery: { method: "GET", url: "/api/v1/ideas" },
    draft: { method: "POST", url: "/api/v1/ideas/draft" },
    byToken: { method: "GET", url: (token) => `/api/v1/ideas/by-token/${encodeURIComponent(token)}` },
    update: { method: "PUT", url: (token) => `/api/v1/ideas/by-token/${encodeURIComponent(token)}` },
    similar: { method: "GET", url: (token) => `/api/v1/ideas/by-token/${encodeURIComponent(token)}/similar` },
    saveCanvas: { method: "PUT", url: (token) => `/api/v1/ideas/by-token/${encodeURIComponent(token)}/canvas` },
    suggestCanvas: { method: "POST", url: (token, step) => `/api/v1/ideas/by-token/${encodeURIComponent(token)}/canvas/suggest${step ? `?step=${encodeURIComponent(step)}` : ""}` },
    feedback: { method: "POST", url: (token) => `/api/v1/ideas/by-token/${encodeURIComponent(token)}/feedback` },
  },
  config: {
    canvas: { method: "GET", url: "/api/v1/config/canvas" },
    regions: { method: "GET", url: "/api/v1/config/regions" },
  },
  knowledge: {
    resources: { method: "GET", url: "/api/v1/knowledge/resources" },
  },
  grantCall: {
    active: { method: "GET", url: "/api/v1/grant-calls/active" },
    application: { method: "POST", url: (id) => `/api/v1/grant-calls/${id}/application` },
    adminList: { method: "GET", url: "/api/v1/admin/grant-calls" },
    adminCreate: { method: "POST", url: "/api/v1/admin/grant-calls" },
    adminUpdate: { method: "PUT", url: (id) => `/api/v1/admin/grant-calls/${id}` },
    adminDelete: { method: "DELETE", url: (id) => `/api/v1/admin/grant-calls/${id}` },
  },
  adminIdea: {
    list: { method: "GET", url: "/api/v1/admin/ideas" },
    get: { method: "GET", url: (id) => `/api/v1/admin/ideas/${id}` },
    review: { method: "PATCH", url: (id) => `/api/v1/admin/ideas/${id}/review` },
    unseen: { method: "GET", url: "/api/v1/admin/ideas/unseen-count" },
  },
  problem: {
    add: { method: "POST", url: "/api/v1/problems" },
    get: { method: "GET", url: "/api/v1/problems/get-problems" },
    reported: { method: "GET", url: "/api/v1/problems/reported" },
    getById: { method: "GET", url: (id) => `/api/v1/problems/${id}` }
  },
};
