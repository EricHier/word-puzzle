/**
 * Main WebWriter Word Puzzles Widget.
 * 
 * @packageDocumentation
 * @module crossword
 */
import { html, LitElement, PropertyValues } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import { WebwriterWordPuzzleGrid } from './webwriter-word-puzzle-grid';
import { WordClue, defaultCell } from '../lib/crossword-gen';
import { WebwriterWordPuzzleCluebox } from './webwriter-word-puzzle-cluebox';
import { WebwriterWordPuzzleClueboxInput } from './webwriter-word-puzzle-cluebox-input';

import { crossword_styles } from '../styles/styles'
import pencil_square from 'bootstrap-icons/icons/pencil-square.svg';
import check_circle from 'bootstrap-icons/icons/check-circle.svg';

import {localized, msg} from "@lit/localize"
import LOCALIZE from "../../localization/generated"

// Shoelace
import "@shoelace-style/shoelace/dist/themes/light.css";

// Buttons
import { SlButton, SlIcon, SlAlert, SlDrawer, SlChangeEvent, SlSelect, SlOption } from '@shoelace-style/shoelace';
import { LitElementWw } from '@webwriter/lit';


declare global {interface HTMLElementTagNameMap {
        "webwriter-word-puzzle": WebwriterWordPuzzle;
    }
}

function stopCtrlPropagation(event: KeyboardEvent): void {
    if (event.ctrlKey) {
        event.stopPropagation()
        //DEV: console.log("Prevented propagation of a single CTRL key sequence within widget")
    }
}

/**
 * Context information for crossword puzzle interaction and navigation.
 * 
 * This interface tracks which clue and direction is currently active,
 * enabling coordinated highlighting between the grid and clue panels.
 * Used internally for managing crossword-specific user interactions.
 * 
 * @example Creating a context
 * ```typescript
 * const context: CwContext = {
 *   across: true,  // true = across/horizontal, false = down/vertical
 *   clue: 1        // clue number (1-based)
 * };
 * ```
 * 
 * @example Usage in event handling
 * ```typescript
 * // When user clicks on clue "1 Across"
 * const setContextEvent = new CustomEvent('set-context', {
 *   detail: { across: true, clue: 1 },
 *   bubbles: true
 * });
 * this.dispatchEvent(setContextEvent);
 * ```
 */
export interface CwContext {
    /** 
     * Direction of the current clue selection.
     * - `true`: Across/horizontal direction
     * - `false`: Down/vertical direction  
     */
    across: boolean,
    
    /** 
     * The clue number (1-based) currently selected.
     * Corresponds to the numbered clues in the crossword.
     */
    clue: number
}

/**
 * Main web component for creating and displaying word puzzles (crosswords and word search).
 * 
 * This component provides a complete word puzzle interface with grid, clue management,
 * and interactive solving capabilities. It supports two puzzle types:
 * - **crossword**: Traditional crossword puzzles with numbered clues
 * - **find-the-words**: Word search puzzles where words are hidden in the grid
 * 
 * @element webwriter-word-puzzle
 * @since 1.0.0
 * @status stable
 * 
 * @dependency @shoelace-style/shoelace
 * @dependency @webwriter/lit
 * 
 * @example Basic usage
 * ```html
 * <webwriter-word-puzzle type="crossword"></webwriter-word-puzzle>
 * ```
 * 
 * @example With predefined words and clues
 * ```html
 * <webwriter-word-puzzle 
 *   type="crossword"
 *   _wordsClues='[{"word":"CAT","clueText":"Feline pet"},{"word":"DOG","clueText":"Canine companion"}]'>
 * </webwriter-word-puzzle>
 * ```
 * 
 * @example Word search puzzle
 * ```html
 * <webwriter-word-puzzle 
 *   type="find-the-words"
 *   _wordsClues='[{"word":"APPLE"},{"word":"BANANA"},{"word":"CHERRY"}]'>
 * </webwriter-word-puzzle>
 * ```
 * 
 * @fires generateCw - Triggered when crossword generation is requested
 * @fires set-context - Triggered when user selects a cell or clue in crossword mode
 * @fires set-words-clues - Triggered when word/clue data is updated
 * 
 * @slot - Default slot for additional content (rarely used)
 * 
 * @csspart options - Container for puzzle type selector (visible in edit mode)
 * @csspart grid-wrapper - Container for the puzzle grid and action buttons
 * @csspart cluebox-wrapper - Container for clue panels
 * 
 * @cssproperty [--crossword-cell-size=30px] - Size of individual grid cells
 * @cssproperty [--crossword-border-color=#ccc] - Border color for grid cells
 * @cssproperty [--crossword-background=#fff] - Background color for white cells
 * @cssproperty [--crossword-blocked-background=#000] - Background color for blocked cells
 * @cssproperty [--crossword-highlight-color=#e3f2fd] - Highlight color for active cells
 * @cssproperty [--clue-font-size=14px] - Font size for clue text
 */
/**
 * Main web component for creating and displaying word puzzles (crosswords and word search).
 */
@localized()
@customElement("webwriter-word-puzzle")
export class WebwriterWordPuzzle extends LitElementWw {

    protected localize = LOCALIZE

    /**
     * Initializes the word puzzle component.
     * 
     * Sets up the grid, clue components, and event listeners for puzzle interaction.
     * The default grid size is 8x8 but will auto-resize based on word placement.
     * 
     * @param dimension - Initial grid dimension (default: 8)
     * 
     * @example Creating with custom size
     * ```typescript
     * const puzzle = new WebwriterWordPuzzle(12); // 12x12 grid
     * ```
     */
    constructor(dimension: number = 8) {
        super()
        this.gridW = new WebwriterWordPuzzleGrid(this)
        this.clueW = new WebwriterWordPuzzleCluebox(this)
        this.clueInpW = new WebwriterWordPuzzleClueboxInput(this)
        this.gridW.grid = Array.from({ length: dimension}, () => Array(dimension).fill(defaultCell()))
        this.gridW.newCrosswordGridDOM(document)

        this.setWordsCluesChildren(this._wordsClues)

        this.addEventListener("keydown", stopCtrlPropagation )
        this.addEventListener("generateCw", this.generateCwHandler )
        this.addEventListener("set-context", this.setContextHandler)
        this.addEventListener("set-words-clues", (e: CustomEvent) => this.setWordsCluesChildren(e.detail))
    }

    protected generateCwHandler() {
        DEV: console.log("generateCw triggered")
        this.clueInpW._wordsClues = this.gridW.generateCrossword(this.clueInpW._wordsClues)
        this.clueW._wordsClues = this._wordsClues;
        (this.clueW as any).requestUpdate()
    }

    protected setContextHandler(e: CustomEvent) {
        if(e.detail.across)
            DEV: console.log("set-context: across, clue " + e.detail.clue)
        else
            DEV: console.log("set-context: down, clue " + e.detail.clue)
        this._cwContext = e.detail
        this.gridW._cwContext = this._cwContext
        this.clueW._cwContext = this._cwContext
        this.clueW.highlightContext(this._cwContext)
    }

    protected firstUpdated(_changedProperties: PropertyValues): void {
        //DEV: console.log("Within firstupdated, contenteditable is " + this.hasAttribute("contenteditable"))
        this.onPreviewToggle(this.hasAttribute("contenteditable"))
    }

    /**
     * Array of words and their associated clues for the puzzle.
     * 
     * Each WordClue object contains:
     * - `word`: The word to place in the puzzle (required)
     * - `clueText`: The clue text for crosswords (optional for word search)
     * - `x`, `y`: Grid coordinates (auto-generated during puzzle creation)
     * - `across`: Direction for crosswords (auto-generated)
     * - `clueNumber`: Clue number for crosswords (auto-generated)
     * 
     * @attr _wordsClues
     * @type {WordClue[]}
     * @default []
     * 
     * @example Setting words and clues
     * ```typescript
     * puzzle._wordsClues = [
     *   { word: "CAT", clueText: "Feline pet" },
     *   { word: "DOG", clueText: "Canine companion" },
     *   { word: "BIRD", clueText: "Flying animal" }
     * ];
     * ```
     * 
     * @example Word search without clues
     * ```typescript
     * puzzle.type = "find-the-words";
     * puzzle._wordsClues = [
     *   { word: "APPLE" },
     *   { word: "BANANA" },
     *   { word: "CHERRY" }
     * ];
     * ```
     */
    @property({ type: Array, attribute: true, reflect: true})
    accessor _wordsClues: WordClue[]


    /**
     * Reference to the grid component that renders the puzzle cells.
     * 
     * This component handles:
     * - Rendering the crossword/word search grid
     * - User input for solving puzzles
     * - Answer checking and validation
     * - Visual feedback for correct/incorrect answers
     * 
     * @internal - Not intended for direct manipulation by users
     */
    @query('webwriter-word-puzzle-grid')
    private gridW: WebwriterWordPuzzleGrid

    /**
     * Reference to the input component for editing words and clues.
     * 
     * This component provides:
     * - Interface for adding/editing words and clues
     * - Puzzle generation controls
     * - Word list management for authors
     * 
     * Only visible when the component is in edit mode (contenteditable).
     * 
     * @internal - Not intended for direct manipulation by users
     */
    @query('webwriter-word-puzzle-cluebox-input')
    private clueInpW: WebwriterWordPuzzleClueboxInput

    /**
     * Reference to the display component for showing clues to solvers.
     * 
     * This component provides:
     * - Formatted display of clues (Across/Down for crosswords)
     * - Word list for word search puzzles
     * - Interactive clue selection and highlighting
     * 
     * Visible to puzzle solvers for reference while solving.
     * 
     * @internal - Not intended for direct manipulation by users
     */
    @query('webwriter-word-puzzle-cluebox')
    private clueW: WebwriterWordPuzzleCluebox


    /**
     * Current context for crossword puzzle interaction.
     * 
     * Tracks which clue and direction (across/down) is currently selected.
     * Used for highlighting the active word in the grid and clue list.
     * 
     * Only relevant for crossword puzzles, not word search.
     * 
     * @example Context structure
     * ```typescript
     * {
     *   across: true,  // true for across, false for down
     *   clue: 1        // clue number
     * }
     * ```
     * 
     * @internal - Managed automatically by component interactions
     */
    @property({ type: Object, state: true, attribute: false})
    _cwContext: CwContext
    

    /**
     * Type of word puzzle to display and interact with.
     * 
     * - **"crossword"**: Traditional crossword with numbered clues across and down
     * - **"find-the-words"**: Word search where players find hidden words in a grid
     * 
     * Changing this property will update the UI to show appropriate controls and layout.
     * 
     * @attr type
     * @type {"crossword" | "find-the-words"}
     * @default "crossword"
     * 
     * @example Setting puzzle type
     * ```typescript
     * // Create a crossword puzzle
     * puzzle.type = "crossword";
     * 
     * // Create a word search puzzle  
     * puzzle.type = "find-the-words";
     * ```
     */
    @property({ type: String, attribute: true, reflect: true })
    public accessor type: 'crossword' | 'find-the-words' = 'crossword';


    protected setWordsCluesChildren(wordsClues: WordClue[]) {
        //DEV: console.log("Setting words and clues in children.")
        this._wordsClues = wordsClues
        this.gridW._wordsClues = wordsClues
        this.clueW._wordsClues = wordsClues
        this.clueInpW._wordsClues = wordsClues
        this.clueInpW.reloadUnplacedMarkers(wordsClues);
        //DEV: console.log("this._wordsAndClues:")
        //DEV: console.log(this._wordsAndClues)
    }

    /**
     * Sets the words and clues for the puzzle and triggers regeneration.
     * 
     * This is the main API method for programmatically setting puzzle content.
     * It updates the word list and automatically regenerates the puzzle layout
     * if in crossword mode.
     * 
     * @param words - Array of WordClue objects containing words and optional clues
     * @param regenerate - Whether to automatically regenerate the puzzle layout (default: true)
     * 
     * @example Setting crossword content
     * ```typescript
     * const puzzle = document.querySelector('webwriter-word-puzzle');
     * puzzle.setWords([
     *   { word: "CAT", clueText: "Domestic feline" },
     *   { word: "DOG", clueText: "Man's best friend" },
     *   { word: "BIRD", clueText: "Flying animal" }
     * ]);
     * ```
     * 
     * @example Setting word search content
     * ```typescript
     * puzzle.type = "find-the-words";
     * puzzle.setWords([
     *   { word: "APPLE" },
     *   { word: "BANANA" },
     *   { word: "CHERRY" }
     * ]);
     * ```
     */
    public setWords(words: WordClue[], regenerate: boolean = true): void {
        this._wordsClues = words;
        this.setWordsCluesChildren(words);
        
        if (regenerate && this.type === 'crossword') {
            this.generateCrossword();
        }
        
        this.requestUpdate();
    }

    /**
     * Adds a single word to the existing puzzle.
     * 
     * Convenience method for adding individual words without replacing
     * the entire word list. Automatically triggers puzzle regeneration
     * for crosswords.
     * 
     * @param word - The word to add
     * @param clueText - Optional clue text (required for crosswords)
     * @param regenerate - Whether to regenerate the puzzle (default: true)
     * 
     * @example Adding a word to crossword
     * ```typescript
     * puzzle.addWord("MOUSE", "Small rodent");
     * ```
     * 
     * @example Adding word to word search
     * ```typescript
     * puzzle.addWord("ELEPHANT");
     * ```
     */
    public addWord(word: string, clueText?: string, regenerate: boolean = true): void {
        const newWord: WordClue = { word: word.toUpperCase() };
        if (clueText) {
            newWord.clueText = clueText;
        }
        
        const currentWords = [...(this._wordsClues || [])];
        currentWords.push(newWord);
        this.setWords(currentWords, regenerate);
    }

    /**
     * Removes a word from the puzzle by word text.
     * 
     * @param word - The word text to remove (case insensitive)
     * @param regenerate - Whether to regenerate the puzzle (default: true)
     * @returns True if word was found and removed, false otherwise
     * 
     * @example Removing a word
     * ```typescript
     * const removed = puzzle.removeWord("CAT");
     * console.log(removed ? "Word removed" : "Word not found");
     * ```
     */
    public removeWord(word: string, regenerate: boolean = true): boolean {
        const currentWords = [...(this._wordsClues || [])];
        const index = currentWords.findIndex(w => w.word.toUpperCase() === word.toUpperCase());
        
        if (index === -1) {
            return false;
        }
        
        currentWords.splice(index, 1);
        this.setWords(currentWords, regenerate);
        return true;
    }

    /**
     * Clears all words and clues from the puzzle.
     * 
     * @example Clearing the puzzle
     * ```typescript
     * puzzle.clearWords();
     * ```
     */
    public clearWords(): void {
        this.setWords([], false);
    }

    /**
     * Gets the current word list.
     * 
     * @returns Array of current WordClue objects
     * 
     * @example Getting current words
     * ```typescript
     * const words = puzzle.getWords();
     * console.log(`Puzzle has ${words.length} words`);
     * ```
     */
    public getWords(): WordClue[] {
        return [...(this._wordsClues || [])];
    }

    /**
     * Manually triggers puzzle generation for crosswords.
     * 
     * Usually called automatically when words are modified, but can be
     * called manually if needed. Only affects crossword puzzles.
     * 
     * @example Manual generation
     * ```typescript
     * puzzle.generatePuzzle();
     * ```
     */
    public generatePuzzle(): void {
        if (this.type === 'crossword') {
            this.generateCrossword();
        }
    }
    /**
     * Styles
     * 
     */
    static get styles() {
        return crossword_styles
    }

    // Registering custom elements
    protected static get scopedElements() {
        return {
        "sl-button": SlButton,
        "sl-icon": SlIcon,
        "sl-alert": SlAlert,
        "sl-drawer": SlDrawer,
        'sl-select': SlSelect,
        'sl-option': SlOption,
        "webwriter-word-puzzle-grid": WebwriterWordPuzzleGrid,
        "webwriter-word-puzzle-cluebox": WebwriterWordPuzzleCluebox,
        "webwriter-word-puzzle-cluebox-input": WebwriterWordPuzzleClueboxInput
        };
    }

    /**
     * Generates a crossword puzzle layout from the current word list.
     * 
     * Uses a placement algorithm based on Agarwal and Joshi 2020 to automatically
     * arrange words on the grid with optimal intersections. Updates the grid
     * with placed words and assigns clue numbers.
     * 
     * This method is called automatically when:
     * - Words are added/modified in edit mode
     * - The "Generate puzzle" button is clicked
     * - A generateCw event is dispatched
     * 
     * @example Manually trigger puzzle generation
     * ```typescript
     * puzzle._wordsClues = [
     *   { word: "CAT", clueText: "Pet feline" },
     *   { word: "DOG", clueText: "Pet canine" }
     * ];
     * puzzle.generateCrossword();
     * ```
     * 
     * @throws Will log warnings if word placement fails or grid becomes too small
     */
    protected generateCrossword() {
        // Initialization
        this.gridW.generateCrossword(this._wordsClues)
    }

    /**
     * Handles preview mode toggle for the component.
     * 
     * When in preview mode (contenteditable=false), hides editing interfaces
     * and shows only the puzzle for solving. When in edit mode, shows all
     * authoring tools and controls.
     * 
     * @param newValue - Whether the component should be in preview mode
     * @returns The preview state that was set
     * 
     * @internal - Called automatically when contenteditable attribute changes
     */

    protected onPreviewToggle(newValue: boolean): boolean {
        //DEV: console.log("Preview toggled")
        this.clueInpW.onPreviewToggle(newValue)
        return newValue 
    }



    render() {
        this.setWordsCluesChildren(this._wordsClues)
        return (html`
            ${this.hasAttribute("contenteditable") ? html`<aside class="settings" part="options">
                <sl-select
                    label=${msg("Puzzle Type")}
                    .value=${this.type}
                    @sl-change=${(e: SlChangeEvent) => {
                        this.type = (e.target as SlSelect).value as any;
                        this.requestUpdate();
                        (this.gridW as any).requestUpdate();
                        (this.clueW as any).requestUpdate();
                        (this.clueInpW as any).requestUpdate();
                    }}
                    name="puzzleType"
                >
                    <sl-option value="crossword">${msg("Crossword")}</sl-option>
                    <sl-option value="find-the-words">${msg("Find the words")}</sl-option>
                </sl-select>
            </aside>` : html``}
            <div class="wrapper">
                <div class="cw-grid-wrapper">
                    ${this.gridW}
                    <div class="button-div">
                        ${this.hasAttribute("contenteditable") ? html`<sl-button id="edit-words" title="${msg("Edit words")}" class="crossword-button" variant="default" @click=${() => this.clueInpW.showDrawer()}>
                            <sl-icon slot="prefix" src=${pencil_square}></sl-icon>
                            <div class="button-content">
                                ${msg("Edit words")}
                            </div>
                        </sl-button>` : html``}
                        ${this.type == "crossword" || this.hasAttribute("contenteditable") ? html`<sl-button id="answer-check" variant="success" title=${this.type == "crossword" ? msg("Check answers") : msg("Show answers")} class="crossword-button" variant="default" @click=${() => this.gridW.checkAnswers(this.gridW.grid, this.gridW.gridEl)}>
                            <sl-icon slot="prefix" src=${check_circle}></sl-icon>
                            <div class="button-content">
                                ${this.type == "crossword" ? msg("Check answers") : msg("Show answers")}
                            </div>
                        </sl-button>` : html``}
                    </div>
                </div>

                <div class="cw-cluebox-wrapper">
                    ${this.clueInpW}${this.clueW}
                </div>
            </div>
            `)
    }
}
