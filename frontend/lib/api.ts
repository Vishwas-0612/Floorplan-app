const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function submitJob(formData: FormData) {
  const res = await fetch(`${API_BASE}/api/generate`, {
    method: "POST",
    body: formData,
  });
  return res.json();
}

export async function getStatus(jobId: string) {
  const res = await fetch(`${API_BASE}/api/status/${jobId}`);
  return res.json();
}
