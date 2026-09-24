import { ChoiceList } from "./components/ChoiceList";
import { DialogueBox } from "./components/DialogueBox";
import { availableChoices, getScene } from "./engine/storyEngine";
import { useStoryEngine } from "./engine/useStoryEngine";
import story from "./story/example.json";
import type { Story } from "./types/story";
import "./App.css";

const typedStory = story as Story;

function App() {
  const { state, choose, restart } = useStoryEngine(typedStory);
  const scene = getScene(typedStory, state.currentSceneId);
  const choices = availableChoices(scene, state.flags);

  return (
    <main className="game">
      <h1>{typedStory.title}</h1>
      <DialogueBox text={scene.text} />
      {scene.ending ? (
        <div className="ending">
          <p>— Slutt —</p>
          <button type="button" onClick={restart}>
            Start på nytt
          </button>
        </div>
      ) : (
        <ChoiceList choices={choices} onChoose={choose} />
      )}
    </main>
  );
}

export default App;
