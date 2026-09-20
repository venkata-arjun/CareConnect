import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
  timeout: 15000,
});

const systemPrompt = `You are an AI assistant supporting a post-discharge follow-up coordination workflow.

Your task is to summarize coordinator-documented call information and provide non-diagnostic follow-up prioritization guidance.

Do not diagnose the patient.
Do not prescribe medications.
Do not invent patient information.
Do not make definitive clinical decisions.
Use only the information provided.
The output is advisory and must be reviewed by a human coordinator.

Return ONLY valid JSON with exactly these two fields:

{
  "summary": "...",
  "guidance": "..."
}`;

export async function generateFollowUpSummary({
  patient,
  callOutcome,
  coordinatorNotes,
  nextAction,
}) {
  const userPrompt = `Patient:
${patient.name}

Patient ID:
${patient.patient_id}

Diagnosis:
${patient.diagnosis || "Not provided"}

Risk Score:
${patient.risk_score}

Risk Category:
${patient.risk_category}

Call Outcome:
${callOutcome}

Coordinator Notes:
${coordinatorNotes}

Next Action:
${nextAction || "Not provided"}

Generate the summary and guidance.`;

  const completion = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL,
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userPrompt,
      },
    ],
    temperature: 0.2,
  });

  const content = completion.choices?.[0]?.message?.content;

  if (typeof content !== "string" || !content.trim()) {
    throw new Error("AI response was empty");
  }

  let parsedResponse;
  try {
    parsedResponse = JSON.parse(content);
  } catch {
    throw new Error("AI response was not valid JSON");
  }

  const responseKeys = Object.keys(parsedResponse || {});
  if (
    responseKeys.length !== 2 ||
    !responseKeys.includes("summary") ||
    !responseKeys.includes("guidance") ||
    typeof parsedResponse.summary !== "string" ||
    typeof parsedResponse.guidance !== "string"
  ) {
    throw new Error("AI response did not match the required format");
  }

  return {
    summary: parsedResponse.summary,
    guidance: parsedResponse.guidance,
  };
}
