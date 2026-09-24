import { ChoiceList } from "./components/ChoiceList";
import { ConversationBox } from "./components/ConversationBox";
import { DialogueBox } from "./components/DialogueBox";
import { PixelArt } from "./components/PixelArt";
import { QuestionInput } from "./components/QuestionInput";
import { availableChoices, getScene } from "./engine/storyEngine";
import { useStoryEngine } from "./engine/useStoryEngine";
import story from "./story/example.json";
import type { Story } from "./types/story";
import "./App.css";

const typedStory = story as Story;

function App() {
  const { state, choose, answerQuestion, resolveConversation, restart } = useStoryEngine(typedStory);
  const scene = getScene(typedStory, state.currentSceneId);

  return (
    <main className="game">
      <h1>{typedStory.title}</h1>
      {scene.image && <PixelArt spec={scene.image} />}
      <DialogueBox text={scene.text} />
      {scene.interaction === "choice" && (
        <ChoiceList choices={availableChoices(scene, state.flags)} onChoose={choose} />
      )}
      {scene.interaction === "question" && (
        <QuestionInput key={state.currentSceneId} scene={scene} onSubmit={(raw) => answerQuestion(scene, raw)} />
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

export default App;
