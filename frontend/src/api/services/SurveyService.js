import { apiJson } from "@/api/client.js";
import { API } from "@/api/endpoints.js";

export const SurveyService = {
  submit: (model) => apiJson(API.survey.submit.url, { method: API.survey.submit.method, body: JSON.stringify(model) }),
  summary: (gminaId, { ct } = {}) =>
    apiJson(gminaId ? `${API.survey.summary.url}?gminaId=${encodeURIComponent(gminaId)}` : API.survey.summary.url, { method: API.survey.summary.method }, { ct }),
};
