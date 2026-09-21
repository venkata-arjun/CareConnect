const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function getAccessToken() {
  return localStorage.getItem("accessToken");
}

function clearAuthentication() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("user");
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers);
  const token = getAccessToken();

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError("Unable to connect to the CareConnect API", 0);
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && !path.startsWith("/auth/")) {
      clearAuthentication();
      if (window.location.pathname !== "/") {
        window.location.assign("/");
      }
    }

    throw new ApiError(
      payload.message || "The request could not be completed",
      response.status,
    );
  }

  return payload;
}

function getInitials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function formatDate(dateValue) {
  if (!dateValue) return "Not available";

  const [year, month, day] = String(dateValue).slice(0, 10).split("-");
  if (!year || !month || !day) return dateValue;

  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(dateValue) {
  if (!dateValue) return "Not available";

  return new Date(dateValue).toLocaleString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getProcedureStatus(status, followUps = []) {
  if (status === "Completed") return "Completed";
  if (
    Array.isArray(followUps) &&
    followUps.some((followUp) => followUp.status === "Completed")
  ) {
    return "Completed";
  }
  return "Pending";
}

export function normalizePatient(patient) {
  const followUps = (patient.follow_ups || []).map((followUp) => ({
    ...followUp,
    nextAction: followUp.next_action,
    scheduledAt: followUp.scheduled_at,
    status: getProcedureStatus(followUp.status, [followUp]),
  }));
  const nextFollowUp = followUps.find(
    (followUp) => followUp.status === "Pending" && followUp.scheduledAt,
  );

  return {
    ...patient,
    id: patient.patient_id,
    initials: getInitials(patient.name),
    dischargeDate: patient.discharge_date,
    riskScore: patient.risk_score,
    riskCategory: patient.risk_category,
    previousFollowUp: patient.previous_follow_up,
    lastContact: patient.last_contact,
    nextAction: patient.next_action,
    nextFollowUpDate: patient.next_follow_up_date || nextFollowUp?.scheduledAt,
    updatedAt: patient.updated_at,
    status: getProcedureStatus(patient.status, followUps),
    followUps,
  };
}

export function normalizeFollowUp(followUp) {
  return {
    ...followUp,
    id: followUp.patient_id,
    initials: getInitials(followUp.patient_name),
    name: followUp.patient_name,
    patientId: followUp.patient_id,
    patientName: followUp.patient_name,
    followUpId: followUp.id,
    riskScore: followUp.risk_score,
    riskCategory: followUp.risk_category,
    dischargeDate: followUp.discharge_date,
    status: getProcedureStatus(followUp.status, [followUp]),
    updatedAt: followUp.updated_at,
  };
}

function normalizeCall(call) {
  return {
    ...call,
    patientId: call.patient_id,
    patientName: call.patient_name,
    followUpId: call.follow_up_id,
    callOutcome: call.call_outcome,
    coordinatorNotes: call.coordinator_notes,
    nextAction: call.next_action,
    aiSummary: call.ai_summary,
    aiGuidance: call.ai_guidance,
    dateTime: call.created_at,
  };
}

export async function login(email, password) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function registerUser(name, email, password) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export async function getPatients() {
  const payload = await request("/patients");
  return payload.data.map(normalizePatient);
}

export async function createPatient(data) {
  const payload = await request("/patients", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return normalizePatient(payload.data);
}

export async function updatePatient(patientId, data) {
  const payload = await request(`/patients/${encodeURIComponent(patientId)}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return normalizePatient(payload.data);
}

export async function getPatient(patientId) {
  const payload = await request(`/patients/${encodeURIComponent(patientId)}`);
  return normalizePatient(payload.data);
}

export async function getPatientRisk(patientId) {
  const payload = await request(
    `/patients/${encodeURIComponent(patientId)}/risk`,
  );
  return payload.data;
}

export async function getFollowUps() {
  const payload = await request("/follow-ups");
  return payload.data.map(normalizeFollowUp);
}

export async function createFollowUp(data) {
  const payload = await request("/follow-ups", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return normalizeFollowUp(payload.data);
}

export async function updateFollowUp(id, data) {
  const payload = await request(`/follow-ups/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return normalizeFollowUp(payload.data);
}

export async function updateFollowUpStatus(id, status) {
  const payload = await request(`/follow-ups/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  return normalizeFollowUp(payload.data);
}

export async function deleteFollowUp(id) {
  return request(`/follow-ups/${id}`, { method: "DELETE" });
}

export async function getCallHistory(patientId) {
  const payload = await request(
    `/patients/${encodeURIComponent(patientId)}/calls`,
  );
  return payload.data.map(normalizeCall);
}

export async function createCall(data) {
  const payload = await request("/calls", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return normalizeCall(payload.data);
}

export async function updateCall(id, data) {
  const payload = await request(`/calls/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return normalizeCall(payload.data);
}

export async function updateCallOutcome(id, callOutcome) {
  const payload = await request(`/calls/${id}/outcome`, {
    method: "PATCH",
    body: JSON.stringify({ callOutcome }),
  });
  return normalizeCall(payload.data);
}

export async function deleteCall(id) {
  return request(`/calls/${id}`, { method: "DELETE" });
}

export async function getDashboard() {
  const payload = await request("/dashboard");
  return payload.data;
}

export async function generateAISummary(data) {
  const payload = await request("/ai/follow-up-summary", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return payload.data;
}

export async function getCall(id) {
  const payload = await request(`/calls/${id}`);
  return normalizeCall(payload.data);
}
