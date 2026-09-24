interface DialogueBoxProps {
  text: string;
}

export function DialogueBox({ text }: DialogueBoxProps) {
  return (
    <div className="dialogue-box">
      <p>{text}</p>
    </div>
  );
}
