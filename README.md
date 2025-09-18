# WebWriter Word Puzzle Widget

This is a comprehensive word puzzle widget for [WebWriter](https://webwriter.app/), implemented as part of a Bachelor's thesis. It allows users to generate crossword puzzles and word search puzzles with full interactive capabilities for both creation and solving.

## Features

- **Dual Puzzle Types**: Supports both crossword and word search ("find-the-words") puzzles
- **Interactive Authoring**: Full editing interface for content creators
- **Solver Interface**: Optimized experience for puzzle solvers
- **Keyboard Navigation**: Complete keyboard support for accessibility
- **Answer Validation**: Real-time feedback on correct/incorrect answers
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **AI-Friendly**: Comprehensive documentation for AI-assisted development

## Quick Start

### CDN Usage
```html
<link href="https://cdn.jsdelivr.net/npm/@webwriter/word-puzzle/widgets/webwriter-word-puzzle.css" rel="stylesheet">
<script type="module" src="https://cdn.jsdelivr.net/npm/@webwriter/word-puzzle/widgets/webwriter-word-puzzle.js"></script>

<!-- Basic crossword -->
<webwriter-word-puzzle type="crossword"></webwriter-word-puzzle>

<!-- Word search puzzle -->
<webwriter-word-puzzle 
  type="find-the-words"
  _wordsClues='[{"word":"APPLE"},{"word":"BANANA"},{"word":"CHERRY"}]'>
</webwriter-word-puzzle>
```

### Bundler Usage
```bash
npm install @webwriter/word-puzzle
```

```html
<link href="@webwriter/word-puzzle/widgets/webwriter-word-puzzle.css" rel="stylesheet">
<script type="module" src="@webwriter/word-puzzle/widgets/webwriter-word-puzzle.js"></script>
<webwriter-word-puzzle type="crossword"></webwriter-word-puzzle>
```

## API Documentation

### Main Component: `<webwriter-word-puzzle>`

#### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `type` | `"crossword" \| "find-the-words"` | `"crossword"` | Type of puzzle to display |
| `_wordsClues` | `WordClue[]` | `[]` | Array of words and clues |

#### Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `setWords(words, regenerate?)` | `WordClue[]`, `boolean` | Set complete word list |
| `addWord(word, clueText?, regenerate?)` | `string`, `string`, `boolean` | Add single word |
| `removeWord(word, regenerate?)` | `string`, `boolean` | Remove word by text |
| `clearWords()` | - | Remove all words |
| `getWords()` | - | Get current word list |
| `generatePuzzle()` | - | Trigger puzzle generation |

#### Events

| Event | Detail | Description |
|-------|--------|-------------|
| `generateCw` | - | Puzzle generation requested |
| `set-context` | `{across: boolean, clue: number}` | Cell/clue selection changed |
| `set-words-clues` | `WordClue[]` | Word data updated |

### WordClue Interface

```typescript
interface WordClue {
  word: string;           // The word (required)
  clueText?: string;      // Clue text (required for crosswords)
  x?: number;             // Grid X position (auto-generated)
  y?: number;             // Grid Y position (auto-generated)
  across?: boolean;       // Direction (auto-generated)
  clueNumber?: number;    // Clue number (auto-generated)
}
```

## Usage Examples

### Creating a Crossword

```html
<webwriter-word-puzzle 
  type="crossword"
  _wordsClues='[
    {"word":"CAT","clueText":"Feline pet"},
    {"word":"DOG","clueText":"Canine companion"},
    {"word":"BIRD","clueText":"Flying animal"}
  ]'>
</webwriter-word-puzzle>
```

### Programmatic Control

```javascript
const puzzle = document.querySelector('webwriter-word-puzzle');

// Add words programmatically
puzzle.setWords([
  { word: 'JAVASCRIPT', clueText: 'Programming language' },
  { word: 'HTML', clueText: 'Markup language' },
  { word: 'CSS', clueText: 'Styling language' }
]);

// Add individual word
puzzle.addWord('REACT', 'JavaScript library');

// Get current words
const currentWords = puzzle.getWords();
console.log('Current puzzle has', currentWords.length, 'words');
```

### Content Creation Mode

```html
<!-- Add contenteditable to enable authoring interface -->
<webwriter-word-puzzle contenteditable type="crossword"></webwriter-word-puzzle>
```

## CSS Customization

The component supports extensive CSS customization through custom properties:

```css
webwriter-word-puzzle {
  --crossword-cell-size: 40px;
  --crossword-border-color: #333;
  --crossword-background: #fff;
  --crossword-blocked-background: #000;
  --crossword-highlight-color: #e3f2fd;
  --clue-font-size: 16px;
}
```

## Component Architecture

### Core Components

1. **WebwriterWordPuzzle** (`<webwriter-word-puzzle>`)
   - Main orchestrating component
   - Manages puzzle type and word data
   - Coordinates between child components

2. **WebwriterWordPuzzleGrid** (`<webwriter-word-puzzle-grid>`)
   - Renders the puzzle grid
   - Handles user input and interaction
   - Manages answer validation

3. **WebwriterWordPuzzleCluebox** (`<webwriter-word-puzzle-cluebox>`)
   - Displays clues for solvers
   - Shows word lists for word search
   - Handles clue highlighting

4. **WebwriterWordPuzzleClueboxInput** (`<webwriter-word-puzzle-cluebox-input>`)
   - Authoring interface for creators
   - Word/clue input and editing
   - Puzzle generation controls

## Source Folder Structure

- `src/`
    - `lib/crossword-gen.ts` - Puzzle generation algorithms and utilities
    - `styles/styles.ts` - Component styling
    - `widgets/` - Component implementations
        - `webwriter-word-puzzle.ts` - Main component
        - `webwriter-word-puzzle-grid.ts` - Grid component
        - `webwriter-word-puzzle-cluebox.ts` - Clue display component
        - `webwriter-word-puzzle-cluebox-input.ts` - Authoring component

## Development

Built with [Lit](https://lit.dev/) framework and follows web standards for maximum compatibility and AI assistance.

### Building

```bash
npm install
npm run prepublishOnly
```

### Documentation

The component includes comprehensive JSDoc documentation optimized for AI usage, including:
- Detailed property and method descriptions
- Usage examples and edge cases
- CSS customization options
- Event handling patterns
- TypeScript interfaces

For complete API documentation, see the generated `custom-elements.json` manifest file.
