export const API = {
  auth: {
    login: { method: "POST", url: "/api/v1/auth/login" },
    register: { method: "POST", url: "/api/v1/auth/register" },
    logout: { method: "POST", url: "/api/v1/auth/logout" },
    me: { method: "GET", url: "/api/v1/auth/me" },
  },
  problem: {
    add: { method: "POST", url: "/api/v1/problems" },
    get: { method: "GET", url: "/api/v1/problems/get-problems" },
    getById: { method: "GET", url: (id) => `/api/v1/problems/${id}` }
  },
};
