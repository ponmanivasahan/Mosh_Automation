import { Sparkles } from 'lucide-react';

const SUGGESTIONS = [
  {
    title: 'Controller Selection',
    prompt: 'Which automatic water level controller is best for a home with both an underground sump and an overhead tank?'
  },
  {
    title: 'Dry-Run Protection',
    prompt: 'How does MOSH Automation dry-run protection save my submersible motor from burning out?'
  },
  {
    title: 'Installation & Wiring',
    prompt: 'What sensors are included and how does the magnetic float sensor connect to my pump starter?'
  },
  {
    title: 'Custom Quote Inquiry',
    prompt: 'I have a 3-phase 5HP borewell pump for an apartment building. What automation system do you recommend?'
  }
];

export default function QuickPrompts({ onSelectPrompt, disabled }) {
  return (
    <div className="chat-quick-prompts">
      <p className="chat-quick-title">
        <Sparkles size={14} />
        <span>Try a sample question:</span>
      </p>
      <div className="chat-quick-grid">
        {SUGGESTIONS.map((item, index) => (
          <button
            key={index}
            type="button"
            className="chat-quick-chip"
            onClick={() => onSelectPrompt(item.prompt)}
            disabled={disabled}
          >
            <span className="chat-chip-badge">{item.title}</span>
            <span className="chat-chip-preview">{item.prompt}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
