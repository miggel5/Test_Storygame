import { useState } from "react";
import { ConversationUnavailableError, postConversationTurn, type ConversationMessage } from "../api/client";
import type { ConversationOutcome, ConversationScene } from "../types/story";

interface ConversationBoxProps {
  scene: ConversationScene;
  sceneId: string;
  onOutcome: (outcome: ConversationOutcome) => void;
}

export function ConversationBox({ scene, sceneId, onOutcome }: ConversationBoxProps) {
  const [messages, setMessages] = useState<ConversationMessage[]>(
    scene.greeting ? [{ role: "character", text: scene.greeting }] : []
  );
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turns, setTurns] = useState(0);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const message = input.trim();
    if (!message || sending) return;

    // Out of turns: the conversation fails without another (unanswered) exchange.
    if (scene.maxTurns !== undefined && turns >= scene.maxTurns) {
      onOutcome("failure");
      return;
    }

    const history = messages;
    setMessages([...history, { role: "user", text: message }]);
    setInput("");
    setError(null);
    setSending(true);

    try {
      const result = await postConversationTurn({ sceneId, history, message });
      setMessages((prev) => [...prev, { role: "character", text: result.reply }]);
      setTurns((n) => n + 1);
      if (result.outcome !== "still_talking") {
        onOutcome(result.outcome);
      }
    } catch (err) {
      // Roll back so a retry doesn't send the same message twice, and give the text back to the player.
      setMessages(history);
      setInput(message);
      setError(err instanceof ConversationUnavailableError ? err.message : "Noe gikk galt. Prøv igjen.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="conversation-box">
      <p className="conversation-character-name">{scene.characterName}</p>
      <div className="conversation-messages">
        {messages.map((message, index) => (
          <p
            key={index}
            className={`conversation-message conversation-message--${message.role}`}
          >
            {message.text}
          </p>
        ))}
        {sending && <p className="conversation-message conversation-message--character conversation-message--pending">…</p>}
      </div>
      {error && <p className="conversation-error">{error}</p>}
      <form className="conversation-input" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Skriv noe..."
          disabled={sending}
          autoFocus
        />
        <button type="submit" disabled={sending || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
