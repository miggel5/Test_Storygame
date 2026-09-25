import type { ConversationOutcome } from "../types/story";
import { getAuthHeader } from "./auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8001";

export interface ConversationMessage {
  role: "user" | "character";
  text: string;
}

export interface ConversationTurnRequest {
  sceneId: string;
  characterName: string;
  systemPrompt: string;
  history: ConversationMessage[];
  message: string;
}

export interface ConversationTurnResult {
  reply: string;
  outcome: "still_talking" | ConversationOutcome;
}

export class ConversationUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConversationUnavailableError";
  }
}

export async function postConversationTurn(req: ConversationTurnRequest): Promise<ConversationTurnResult> {
  let response: Response;
  try {
    const authHeader = getAuthHeader();
    response = await fetch(`${API_BASE_URL}/api/conversation/turn`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify({
        scene_id: req.sceneId,
        character_name: req.characterName,
        system_prompt: req.systemPrompt,
        history: req.history.map((m) => ({ role: m.role, text: m.text })),
        message: req.message,
      }),
    });
  } catch {
    throw new ConversationUnavailableError(
      "Denne questen krever en tilkoblet backend, som ikke er tilgjengelig akkurat nå."
    );
  }

  if (!response.ok) {
    if (response.status === 503) {
      throw new ConversationUnavailableError(
        "Denne questen krever en backend som er satt opp med en API-nøkkel, men det mangler akkurat nå."
      );
    }
    throw new ConversationUnavailableError("Karakteren svarer ikke akkurat nå. Prøv igjen om litt.");
  }

  const data = (await response.json()) as { reply: string; outcome: ConversationTurnResult["outcome"] };
  return data;
}
