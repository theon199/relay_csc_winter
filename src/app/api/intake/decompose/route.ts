import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getFallbackDecomposition, DecomposedTask } from "@/lib/ai/fallback-fixtures";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Please enter a valid request description." },
        { status: 400 }
      );
    }

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      (typeof globalThis !== "undefined" && (globalThis as any).process?.env?.GEMINI_API_KEY);

    const modelName =
      process.env.GEMINI_MODEL ||
      "gemini-3.5-flash-lite";

    // If API key is available, call Gemini Flash-Lite
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });

        const systemInstruction = `You are Relay's Hyper-Local Volunteer AI Intake Coordinator for the CSC Winter Sparkathon.
Your mission is to decompose messy or compound community organizer requests into one or more discrete, actionable volunteer micro-shifts (typically 30 to 120 minutes each).

CRITICAL PRODUCT & SAFETY RULES:
1. Split independent tasks into separate items (e.g., in-person pantry packing vs remote flyer translation).
2. NEVER invent exact street addresses, private residential locations, phone numbers, or unstated specific times.
3. If critical details (like specific start time, verified public hub, or deadline) are missing or ambiguous, list them explicitly in "missingFields".
4. Determine locationType as strictly "in_person" or "remote".
5. Keep suggestedDurationMins realistic (between 30 and 180 minutes).
6. Return structured JSON conforming strictly to the requested schema.`;

        const responseSchema = {
          type: "OBJECT",
          properties: {
            tasks: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  title: { type: "STRING" },
                  description: { type: "STRING" },
                  locationType: {
                    type: "STRING",
                    enum: ["in_person", "remote"],
                  },
                  locationText: { type: "STRING", nullable: true },
                  suggestedDurationMins: { type: "INTEGER" },
                  spotsNeeded: { type: "INTEGER" },
                  suggestedSchedule: { type: "STRING", nullable: true },
                  skills: {
                    type: "ARRAY",
                    items: { type: "STRING" },
                  },
                  missingFields: {
                    type: "ARRAY",
                    items: { type: "STRING" },
                  },
                },
                required: [
                  "title",
                  "description",
                  "locationType",
                  "suggestedDurationMins",
                  "spotsNeeded",
                  "skills",
                  "missingFields",
                ],
              },
            },
          },
          required: ["tasks"],
        };

        const response = await ai.models.generateContent({
          model: modelName,
          contents: text,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: responseSchema as any,
          },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          if (parsed.tasks && Array.isArray(parsed.tasks)) {
            return NextResponse.json({
              success: true,
              isFallback: false,
              model: modelName,
              tasks: parsed.tasks as DecomposedTask[],
            });
          }
        }
      } catch (geminiError: any) {
        console.warn(
          "Gemini API call failed or rate-limited; falling back to deterministic fixture engine:",
          geminiError?.message
        );
      }
    }

    // Fallback to high-fidelity deterministic fixtures for demo resilience
    const fallbackTasks = getFallbackDecomposition(text);
    return NextResponse.json({
      success: true,
      isFallback: true,
      model: `${modelName} (Deterministic Demo Fixture)`,
      tasks: fallbackTasks,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to decompose organizer request." },
      { status: 500 }
    );
  }
}
