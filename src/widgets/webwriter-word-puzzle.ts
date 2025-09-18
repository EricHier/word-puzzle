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
 * Represents the current context of a crossword puzzle interaction.
 * 
 * This interface tracks which clue the user is currently focused on,
 * including both the direction (across or down) and the specific clue number.
 * Used for highlighting active clues and navigating between puzzle cells.
 * 
 * @interface CwContext
 * @example
 * ```typescript
 * // Context for across clue #1
 * const context: CwContext = {
 *   across: true,
 *   clue: 1
 * };
 * 
 * // Context for down clue #5
 * const context: CwContext = {
 *   across: false,
 *   clue: 5
 * };
 * ```
 */
export interface CwContext {
    /** Whether this is an across (true) or down (false) clue */
    across: boolean,
    /** The numbered clue reference */
    clue: number
}

/**
 * Main word puzzle widget that supports both crossword and find-the-words puzzle types.
 * 
 * This is the primary web component for creating interactive word puzzles. It includes
 * a customizable grid, clue panels, and interactive solving features. The component
 * supports two puzzle types: traditional crosswords with numbered clues, and
 * find-the-words puzzles where users search for hidden words in a grid.
 * 
 * @element webwriter-word-puzzle
 * @since 1.0.0
 * 
 * @example
 * ```html
 * <!-- Basic crossword puzzle -->
 * <webwriter-word-puzzle type="crossword"></webwriter-word-puzzle>
 * 
 * <!-- Find-the-words puzzle -->
 * <webwriter-word-puzzle type="find-the-words"></webwriter-word-puzzle>
 * 
 * <!-- Crossword with predefined words and clues -->
 * <webwriter-word-puzzle 
 *   type="crossword"
 *   _wordsClues='[{"word":"CAT","clueText":"Feline pet","across":true}]'>
 * </webwriter-word-puzzle>
 * ```
 * 
 * @fires generateCw - Fired when crossword generation is requested
 * @fires set-context - Fired when the current clue context changes (across/down, clue number)
 * @fires set-words-clues - Fired when the words and clues are updated
 * 
 * @csspart options - The settings/options panel shown in edit mode
 * @csspart grid - The puzzle grid container
 * @csspart clues - The clues panel container
 * @csspart buttons - The action buttons container
 */
@localized()
@customElement("webwriter-word-puzzle")
export class WebwriterWordPuzzle extends LitElementWw {

    protected localize = LOCALIZE

    /**
     * Creates a new word puzzle widget.
     * 
     * @param dimension - The initial grid dimensions (default: 8x8)
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
     * Array of words and their associated clues, positions, and metadata.
     * 
     * Each WordClue object contains:
     * - word: The word itself
     * - clueText: The clue text for crosswords
     * - x, y: Grid coordinates (0-indexed)
     * - across: Whether the word goes across (true) or down (false)
     * - clueNumber: The numbered clue reference
     * 
     * @attr _wordsClues
     * @type {WordClue[]}
     * @example
     * ```javascript
     * element._wordsClues = [
     *   {
     *     word: "CAT",
     *     clueText: "Feline pet",
     *     x: 0,
     *     y: 0,
     *     across: true,
     *     clueNumber: 1
     *   }
     * ];
     * ```
     */
    @property({ type: Array, attribute: true, reflect: true})
    accessor _wordsClues: WordClue[]


    /**
     * The DOM grid element of the crossword puzzle. Contains the cells
     * 
     * See the constructor {@link WebwriterWordPuzzle.newCrosswordGrid | newCrosswordGrid()}
     */
    @query('webwriter-word-puzzle-grid')
    private gridW: WebwriterWordPuzzleGrid

    /**
     * The panel element of the crossword puzzle, containing the words and clues. (WIP)
     * 
     * See the constructor {@link WebwriterWordPuzzle.newClueBox | newClueBox()}
     */
    @query('webwriter-word-puzzle-cluebox-input')
    private clueInpW: WebwriterWordPuzzleClueboxInput

    /**
     * The panel element of the crossword puzzle, containing the words and clues. (WIP)
     * 
     * See the constructor {@link WebwriterWordPuzzle.newClueBox | newClueBox()}
     */
    @query('webwriter-word-puzzle-cluebox')
    private clueW: WebwriterWordPuzzleCluebox


    /**
     * The current crossword context tracking which clue is active.
     * 
     * Contains information about the currently selected clue including
     * whether it's an across or down clue and the clue number.
     * 
     * @type {CwContext}
     * @example
     * ```javascript
     * // Set context to across clue #3
     * element._cwContext = { across: true, clue: 3 };
     * 
     * // Set context to down clue #5
     * element._cwContext = { across: false, clue: 5 };
     * ```
     */
    @property({ type: Object, state: true, attribute: false})
    _cwContext: CwContext
    

    /**
     * The type of word puzzle to display and interact with.
     * 
     * - 'crossword': Traditional crossword with numbered clues and intersecting words
     * - 'find-the-words': Word search puzzle where users find hidden words in a grid
     * 
     * @attr type
     * @type {'crossword' | 'find-the-words'}
     * @default 'crossword'
     * @example
     * ```html
     * <!-- Create a crossword puzzle -->
     * <webwriter-word-puzzle type="crossword"></webwriter-word-puzzle>
     * 
     * <!-- Create a find-the-words puzzle -->
     * <webwriter-word-puzzle type="find-the-words"></webwriter-word-puzzle>
     * ```
     */
    @property({ type: String, attribute: true, reflect: true })
    public accessor type: 'crossword' | 'find-the-words' = 'crossword';


    /**
     * Updates the words and clues across all child components.
     * 
     * Synchronizes the words and clues data between the main component
     * and its child components (grid, cluebox, and input components).
     * 
     * @param wordsClues - Array of word and clue objects to distribute
     * @internal
     */
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
     * Generates crossword puzzle based off of words in the clue box and 
     * writes it to the DOM.
     * 
     * Based off of Agarwal and Joshi 2020
     */
    protected generateCrossword() {
        // Initialization
        this.gridW.generateCrossword(this._wordsClues)
    }

    /**
     * Handles the preview toggle when switching between edit and view modes.
     * 
     * Called when the contenteditable attribute changes, this method
     * coordinates the preview state across child components.
     * 
     * @param newValue - Whether preview mode is enabled
     * @returns The preview state that was set
     * @internal
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
