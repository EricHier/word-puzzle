# Word,Puzzle (`@webwriter/word-puzzle@1.0.3`)
[License: MIT](LICENSE) | Version: 1.0.3

Crossword and word search puzzle creation tool featuring customizable grids, clues, and interactive solving.

## Snippets
[Snippets](https://webwriter.app/docs/snippets/snippets/) are examples and templates using the package's widgets.

| Name | Import Path |
| :--: | :---------: |
| Crossword Animals | @webwriter/word-puzzle/snippets/Crossword-Animals.html |
| Find The Words Fruits | @webwriter/word-puzzle/snippets/Find-The-Words-Fruits.html |



## `WebwriterWordPuzzle` (`<webwriter-word-puzzle>`)
Main web component for creating and displaying word puzzles (crosswords and word search).
This component provides a complete word puzzle interface with grid, clue management,
and interactive solving capabilities. It supports two puzzle types:
- **crossword**: Traditional crossword puzzles with numbered clues
- **find-the-words**: Word search puzzles where words are hidden in the grid
@element webwriter-word-puzzle
@since 1.0.0
@status stable
@dependency @shoelace-style/shoelace
@dependency @webwriter/lit
@example Basic usage
```html
<webwriter-word-puzzle type="crossword"></webwriter-word-puzzle>
```
@example With predefined words and clues
```html
<webwriter-word-puzzle 
  type="crossword"
  _wordsClues='[{"word":"CAT","clueText":"Feline pet"},{"word":"DOG","clueText":"Canine companion"}]'>
</webwriter-word-puzzle>
```
@example Word search puzzle
```html
<webwriter-word-puzzle 
  type="find-the-words"
  _wordsClues='[{"word":"APPLE"},{"word":"BANANA"},{"word":"CHERRY"}]'>
</webwriter-word-puzzle>
```
@fires generateCw - Triggered when crossword generation is requested
@fires set-context - Triggered when user selects a cell or clue in crossword mode
@fires set-words-clues - Triggered when word/clue data is updated
@slot - Default slot for additional content (rarely used)
@csspart options - Container for puzzle type selector (visible in edit mode)
@csspart grid-wrapper - Container for the puzzle grid and action buttons
@csspart cluebox-wrapper - Container for clue panels
@cssproperty [--crossword-cell-size=30px] - Size of individual grid cells
@cssproperty [--crossword-border-color=#ccc] - Border color for grid cells
@cssproperty [--crossword-background=#fff] - Background color for white cells
@cssproperty [--crossword-blocked-background=#000] - Background color for blocked cells
@cssproperty [--crossword-highlight-color=#e3f2fd] - Highlight color for active cells
@cssproperty [--clue-font-size=14px] - Font size for clue text

### Usage

Use with a CDN (e.g. [jsdelivr](https://jsdelivr.com)):
```html
<link href="https://cdn.jsdelivr.net/npm/@webwriter/word-puzzle/widgets/webwriter-word-puzzle.css" rel="stylesheet">
<script type="module" src="https://cdn.jsdelivr.net/npm/@webwriter/word-puzzle/widgets/webwriter-word-puzzle.js"></script>
<webwriter-word-puzzle></webwriter-word-puzzle>
```

Or use with a bundler (e.g. [Vite](https://vite.dev)):

```
npm install @webwriter/word-puzzle
```

```html
<link href="@webwriter/word-puzzle/widgets/webwriter-word-puzzle.css" rel="stylesheet">
<script type="module" src="@webwriter/word-puzzle/widgets/webwriter-word-puzzle.js"></script>
<webwriter-word-puzzle></webwriter-word-puzzle>
```

## Fields
| Name (Attribute Name) | Type | Description | Default | Reflects |
| :-------------------: | :--: | :---------: | :-----: | :------: |
| `_wordsClues` (`_wordsClues`) | `WordClue[]` | Array of words and their associated clues for the puzzle.

Each WordClue object contains:
- `word`: The word to place in the puzzle (required)
- `clueText`: The clue text for crosswords (optional for word search)
- `x`, `y`: Grid coordinates (auto-generated during puzzle creation)
- `across`: Direction for crosswords (auto-generated)
- `clueNumber`: Clue number for crosswords (auto-generated) | `[]` | ✓ |
| `type` (`type`) | `"crossword" \| "find-the-words"` | Type of word puzzle to display and interact with.

- **"crossword"**: Traditional crossword with numbered clues across and down
- **"find-the-words"**: Word search where players find hidden words in a grid

Changing this property will update the UI to show appropriate controls and layout. | `'crossword'` | ✓ |
| `gridW` | - | - | `new WebwriterWordPuzzleGrid(this)` | ✗ |
| `clueW` | - | - | `new WebwriterWordPuzzleCluebox(this)` | ✗ |
| `clueInpW` | - | - | `new WebwriterWordPuzzleClueboxInput(this)` | ✗ |
| `grid` | - | - | - | ✗ |

*Fields including [properties](https://developer.mozilla.org/en-US/docs/Glossary/Property/JavaScript) and [attributes](https://developer.mozilla.org/en-US/docs/Glossary/Attribute) define the current state of the widget and offer customization options.*

## Methods
| Name | Description | Parameters |
| :--: | :---------: | :-------: |
| `setWords` | Sets the words and clues for the puzzle and triggers regeneration.

This is the main API method for programmatically setting puzzle content.
It updates the word list and automatically regenerates the puzzle layout
if in crossword mode. | `words: WordClue[]`, `regenerate: boolean=true`
| `addWord` | Adds a single word to the existing puzzle.

Convenience method for adding individual words without replacing
the entire word list. Automatically triggers puzzle regeneration
for crosswords. | `word: string`, `clueText: string`, `regenerate: boolean=true`
| `removeWord` | Removes a word from the puzzle by word text. | `word: string`, `regenerate: boolean=true`
| `clearWords` | Clears all words and clues from the puzzle.

@example Clearing the puzzle
```typescript
puzzle.clearWords();
``` | -
| `getWords` | Gets the current word list. | -
| `generatePuzzle` | Manually triggers puzzle generation for crosswords.

Usually called automatically when words are modified, but can be
called manually if needed. Only affects crossword puzzles.

@example Manual generation
```typescript
puzzle.generatePuzzle();
``` | -

*[Methods](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Method_definitions) allow programmatic access to the widget.*

## Slots
| Name | Description | Content Type |
| :--: | :---------: | :----------: |
| *(default)* | Default slot for additional content (rarely used) | - |

*[Slots](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_templates_and_slots) define how the content of the widget is rendered.*

## Events
| Name | Description |
| :--: | :---------: |
| generateCw | Triggered when crossword generation is requested |
| set-context | Triggered when user selects a cell or clue in crossword mode |
| set-words-clues | Triggered when word/clue data is updated |

*[Events](https://developer.mozilla.org/en-US/docs/Web/Events) are dispatched by the widget after certain triggers.*

## Custom CSS properties
| Name | Description |
| :--: | :---------: |
| --crossword-cell-size | Size of individual grid cells |
| --crossword-border-color | Border color for grid cells |
| --crossword-background | Background color for white cells |
| --crossword-blocked-background | Background color for blocked cells |
| --crossword-highlight-color | Highlight color for active cells |
| --clue-font-size | Font size for clue text |

*[Custom CSS properties](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascading_variables/Using_CSS_custom_properties) offer defined customization of the widget's style.*

## CSS parts
| Name | Description |
| :--: | :---------: |
| options | Container for puzzle type selector (visible in edit mode) |
| grid-wrapper | Container for the puzzle grid and action buttons |
| cluebox-wrapper | Container for clue panels |

*[CSS parts](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_shadow_parts) allow freely styling internals of the widget with CSS.*

## Editing config
| Name | Value |
| :--: | :---------: |
| `defining` | `true` |
| `isolating` | `true` |

*The [editing config](https://webwriter.app/docs/packages/configuring/#editingconfig) defines how explorable authoring tools such as [WebWriter](https://webwriter.app) treat the widget.*




---
*Generated with @webwriter/build@1.6.0*