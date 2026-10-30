// Keep the sequence and cadence together so the terminal is easy to edit.
export const terminalPhrases = [
 'hello, human. :)', 'how are you?', 'have a project in mind?',
 'a website? an app? a what-if?', 'you bring the possibility.',
 'we’ll help with the brackets.', 'need a little help?',
 'not sure where to start?', 'a rough sketch is plenty.',
 'good things start with hello.', 'thoughtful design. solid code.',
 'shall we build something?',
];
export const terminalTiming = { typing: 85, deleting: 40, hold: 3000, gap: 550 };
export type TypingState = { phrase: number; length: number; phase: 'typing' | 'holding' | 'deleting' | 'waiting' };
export const initialTypingState: TypingState = { phrase: 0, length: 0, phase: 'waiting' };
export function advanceTyping(state: TypingState): TypingState {
 const length = terminalPhrases[state.phrase].length;
 switch (state.phase) {
  case 'waiting': return { ...state, length: 1, phase: 'typing' };
  case 'typing': return state.length < length ? { ...state, length: state.length + 1 } : { ...state, phase: 'holding' };
  case 'holding': return { ...state, phase: 'deleting' };
  case 'deleting': return state.length > 0 ? { ...state, length: state.length - 1 } : { phrase: (state.phrase + 1) % terminalPhrases.length, length: 0, phase: 'waiting' };
 }
}
export function typingDelay(state: TypingState) {
 return state.phase === 'holding' ? terminalTiming.hold : state.phase === 'waiting' ? terminalTiming.gap : state.phase === 'typing' ? terminalTiming.typing : terminalTiming.deleting;
}
