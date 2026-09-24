import type { Choice } from "../types/story";

interface ChoiceListProps {
  choices: Choice[];
  onChoose: (choice: Choice) => void;
}

export function ChoiceList({ choices, onChoose }: ChoiceListProps) {
  return (
    <ul className="choice-list">
      {choices.map((choice) => (
        <li key={choice.id ?? choice.text}>
          <button type="button" onClick={() => onChoose(choice)}>
            {choice.text}
          </button>
        </li>
      ))}
    </ul>
  );
}
