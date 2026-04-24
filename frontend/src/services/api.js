import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000",
  timeout: 30000,
});

export async function runPipeline(payload) {
  const formData = new FormData();

  if (payload.repoUrl) {
    formData.append("repoUrl", payload.repoUrl);
  }

  if (payload.file) {
    formData.append("codeZip", payload.file);
  }

  const response = await api.post("/pipeline/run", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
}

export async function getPipelineStatus(jobId) {
  const response = await api.get(`/pipeline/status/${jobId}`);
  return response.data;
}

export async function getPipelineLogs(jobId) {
  const response = await api.get(`/pipeline/logs/${jobId}`);
  return response.data;
}

export async function getPipelineHistory() {
  const response = await api.get("/pipeline/history");
  return response.data;
}

export async function deletePipelineHistoryItem(jobId) {
  const response = await api.delete(`/pipeline/history/${jobId}`);
  return response.data;
}

export default api;
