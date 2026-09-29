import { useEffect, useState } from "react";
import { ChoiceList } from "./components/ChoiceList";
import { ConversationBox } from "./components/ConversationBox";
import { DialogueBox } from "./components/DialogueBox";
import { PixelArt } from "./components/PixelArt";
import { QuestionInput } from "./components/QuestionInput";
import { availableChoices, getScene } from "./engine/storyEngine";
import { useStoryEngine } from "./engine/useStoryEngine";
import { loadStory } from "./story/loadStory";
import type { Story } from "./types/story";
import "./App.css";

function Game({ story }: { story: Story }) {
  const { state, choose, answerQuestion, resolveConversation, restart } = useStoryEngine(story);
  const scene = getScene(story, state.currentSceneId);

  return (
    <main className="game">
      <h1>{story.title}</h1>
      {scene.image && <PixelArt spec={scene.image} />}
      <DialogueBox text={scene.text} />
      {scene.interaction === "choice" && (
        <ChoiceList choices={availableChoices(scene, state.flags)} onChoose={choose} />
      )}
      {scene.interaction === "question" && (
        <QuestionInput
          key={state.currentSceneId}
          scene={scene}
          onSubmit={(raw, attemptsSoFar) => answerQuestion(scene, raw, attemptsSoFar)}
        />
      )}
      {scene.interaction === "conversation" && (
        <ConversationBox
          key={state.currentSceneId}
          scene={scene}
          sceneId={state.currentSceneId}
          onOutcome={(outcome) => resolveConversation(scene, outcome)}
        />
      )}
      {scene.interaction === "ending" && (
        <div className="ending" data-ending-category={scene.endingCategory}>
          <p>— Slutt —</p>
          <button type="button" onClick={restart}>
            Start på nytt
          </button>
        </div>
      )}
    </main>
  );
}

function App() {
  const [story, setStory] = useState<Story | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    loadStory().then(setStory, () => setFailed(true));
  }, []);

  if (failed) {
    return (
      <main className="game">
        <div className="dialogue-box">
          <p>Kunne ikke laste fortellingen. Last siden på nytt.</p>
        </div>
      </main>
    );
  }
  if (!story) {
    return (
      <main className="game">
        <div className="dialogue-box">
          <p>Laster fortellingen…</p>
        </div>
      </main>
    );
  }
  return <Game story={story} />;
}

export default App;
