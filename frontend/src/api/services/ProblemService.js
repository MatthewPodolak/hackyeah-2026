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

    console.log("resp " + JSON.stringify(res));
    return res;
  },

};
