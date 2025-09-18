/**
 * Component for cluebox, for users.
 * 
 * @packageDocumentation
 * @module crossword
 * @mergeModuleWith webwriter-word-puzzles
 */
import { html, HTMLTemplateResult } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { CwContext, WebwriterWordPuzzle } from './webwriter-word-puzzle';
import { WordClue } from '../lib/crossword-gen';
import { cluebox_styles } from '../styles/styles'

import {localized, msg} from "@lit/localize"
import LOCALIZE from "../../localization/generated"

// Shoelace
import "@shoelace-style/shoelace/dist/themes/light.css";


/**
 * Display component for showing puzzle clues and word lists to solvers.
 * 
 * This component presents clues in an organized, user-friendly format for puzzle solving.
 * It adapts its display based on the puzzle type:
 * 
 * **For crosswords:**
 * - Shows "Across" and "Down" clue sections
 * - Numbers correspond to grid positions
 * - Clicking clues highlights corresponding grid areas
 * - Tracks solving progress
 * 
 * **For word search:**
 * - Displays list of words to find
 * - Words get crossed out when found
 * - Shows completion progress
 * 
 * @element webwriter-word-puzzle-cluebox
 * @since 1.0.0
 * @status stable
 * 
 * @example Usage in crossword
 * ```html
 * <webwriter-word-puzzle-cluebox 
 *   type="crossword"
 *   _wordsClues='[{"word":"CAT","clueText":"Pet feline","clueNumber":1,"across":true}]'>
 * </webwriter-word-puzzle-cluebox>
 * ```
 * 
 * @example Usage in word search
 * ```html
 * <webwriter-word-puzzle-cluebox 
 *   type="find-the-words"
 *   _wordsClues='[{"word":"APPLE"},{"word":"BANANA"}]'>
 * </webwriter-word-puzzle-cluebox>
 * ```
 * 
 * @fires clue-selected - When user clicks on a crossword clue
 * @fires word-found - When a word is marked as found in word search
 * 
 * @csspart clues-container - Main container for all clues
 * @csspart across-section - Container for "Across" clues
 * @csspart down-section - Container for "Down" clues  
 * @csspart words-list - Container for word search word list
 * @csspart clue-item - Individual clue entries
 * @csspart clue-number - Clue number indicators
 * @csspart clue-text - Clue text content
 * @csspart word-item - Individual words in word search
 * @csspart word-found - Words that have been found
 * 
 * @cssproperty [--clue-font-size=14px] - Font size for clue text
 * @cssproperty [--clue-line-height=1.4] - Line height for clue readability
 * @cssproperty [--clue-active-color=#e3f2fd] - Background for currently selected clue
 * @cssproperty [--word-found-color=#c8e6c9] - Color for found words
 * @cssproperty [--clue-number-color=#1976d2] - Color for clue numbers
 */
/**
 * Display component for showing puzzle clues and word lists to solvers.
 */
@localized()
@customElement("webwriter-word-puzzle-cluebox")
export class WebwriterWordPuzzleCluebox extends LitElement {
    // All methods have the same names as in crosswords-js

    public localize = LOCALIZE

    /**
     * Reference to the HTML table displaying word search words.
     * 
     * Contains the list of words that players need to find in word search puzzles.
     * Words are marked as found when discovered in the grid.
     * 
     * @internal - Managed automatically by the component
     */
    @query(".wordsbox")
    accessor wordsbox: HTMLTableElement

    /**
     * Reference to the HTML table displaying "Across" clues.
     * 
     * Contains horizontal clues for crossword puzzles, with numbers
     * corresponding to grid positions where words begin.
     * 
     * @internal - Managed automatically by the component
     */
    @query(".clueboxAcross")
    accessor clueboxAcross: HTMLTableElement

    /**
     * Reference to the HTML table displaying "Down" clues.
     * 
     * Contains vertical clues for crossword puzzles, with numbers
     * corresponding to grid positions where words begin.
     * 
     * @internal - Managed automatically by the component
     */
    @query(".clueboxDown")
    accessor clueboxDown: HTMLTableElement

    /**
     * Array of words and clues to display in the clue panel.
     * 
     * Synchronized with the parent puzzle component. The display format
     * adapts based on puzzle type:
     * - Crosswords: Groups by direction (across/down) and shows clue text
     * - Word search: Shows simple word list for players to find
     * 
     * @example Crossword clues
     * ```typescript
     * [
     *   { word: "CAT", clueText: "Pet feline", clueNumber: 1, across: true },
     *   { word: "DOG", clueText: "Pet canine", clueNumber: 2, across: false }
     * ]
     * ```
     * 
     * @example Word search words
     * ```typescript
     * [
     *   { word: "APPLE" },
     *   { word: "BANANA" },
     *   { word: "CHERRY" }
     * ]
     * ```
     */
    @property({type: Array, attribute: true, reflect: true})
    _wordsClues: WordClue[] = [{word: "", across: true}]

    /**
     * Current crossword interaction context.
     * 
     * Tracks which clue is currently selected to provide appropriate
     * highlighting and visual feedback in the clue list.
     * 
     * @internal - Synchronized with parent component and grid
     */
    @property({ type: Object, state: true, attribute: false })
    _cwContext: CwContext

    /**
     * Initializes the clue display component.
     * 
     * @param parentComponent - Reference to the parent puzzle component
     * @internal
     */
    constructor(private parentComponent: WebwriterWordPuzzle) {
        super()
    }

    static get styles() {
        return cluebox_styles
    }

    /**
     * Sets the "current" attribute in the cluebox to highlight the cell corresponding to the current context for crosswords
     * and highlights the words that were already found for the Find the words puzzles.
     * 
     * @param newContext 
     * @param oldContext 
     * @returns {boolean} always returns false to prevent re-rendering the whole cluebox component.
     */
    highlightContext(context: CwContext): void {
        // Remove any existing "current" attributes from both tables if it is a crossword
        if(this.parentComponent.type == "crossword") {
            this.clueboxAcross.querySelectorAll('td[current]').forEach(cell => cell.removeAttribute("current"));
            this.clueboxDown.querySelectorAll('td[current]').forEach(cell => cell.removeAttribute("current"));
        }

        if (context.across != null && context.clue != null) {
            // Highlight current context for crosswords
            if(this.parentComponent.type == "crossword") {
                const targetTable = context.across ? this.clueboxAcross : this.clueboxDown;
                if (targetTable) {
                    const newCell = targetTable.querySelector(`td[clue="${context.clue}"]`);
                    if (newCell) {
                        newCell.setAttribute("current", "");
                    }
                }
            // Highlight correctly found word for Find the words puzzles
            }else {
                const newCell = this.wordsbox.querySelector(`td[clue="${context.clue}"][${context.across ? "across" : "down"}]`);
                if (newCell) {
                    newCell.setAttribute("current", "");
                }
            }
        }
    }
    
    
    
    
    
    render() {

        const clueboxTemplateCellsAcross = []
        const clueboxTemplateCellsDown = []

        const clueboxFindTheWords = []

        if(this._wordsClues != null) {
            for(let wordClue of this._wordsClues) {
                if(wordClue.across) {
                    // For find the words
                    clueboxFindTheWords.push(html`<tr><td clue="${wordClue.clueNumber}" across>${wordClue.word}</td></tr>`)

                    // For crossword
                    clueboxTemplateCellsAcross.push(html`<tr><td clue="${wordClue.clueNumber}" across>${clueboxCellContents(wordClue)}</td></tr>`)
                }
                else {
                    // For find the words
                    clueboxFindTheWords.push(html`<tr><td clue="${wordClue.clueNumber}" down>${wordClue.word}</td></tr>`)

                    // For crossword
                    clueboxTemplateCellsDown.push(html`<tr><td clue="${wordClue.clueNumber}" down>${clueboxCellContents(wordClue)}</td></tr>`)
                }
            }
        }

        if(clueboxTemplateCellsAcross.length == 0) {
            clueboxTemplateCellsAcross.push(html`<tr><td style="text-align: center">No words</td></tr>`)
        }
        if(clueboxTemplateCellsDown.length == 0) {
            clueboxTemplateCellsDown.push(html`<tr><td style="text-align: center">No words</td></tr>`)
        }


        /**
         * The contents of a single cell element
         * @param {WordClue} wordClue 
         * @returns {HTMLTemplateResult}
         */
        function clueboxCellContents(wordClue: WordClue): HTMLTemplateResult {
            if(wordClue != null) {
                return html`
                        <b>${wordClue.clueNumber != null ? 
                        "[" + wordClue.clueNumber + "]" : ""}</b> 
                        ${wordClue.clueText != null ? wordClue.clueText : html`<i style="color:gray;">No clue provided for this word</i>`}
                    ` 
            }
            else {
                return html``
            }
        }

        return html`
            <div class="tables-wrapper">
                ${this.parentComponent.type == "find-the-words" ? html`
                <table class="cluebox wordsbox">
                    <colgroup>
                        <col>
                    </colgroup>
                    <thead>
                        <tr>
                            <th>${msg("Words")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${clueboxFindTheWords}
                    </tbody>
                </table>`
                :
                html`
                <table class="cluebox clueboxAcross">
                    <colgroup>
                        <col>
                    </colgroup>
                    <thead>
                        <tr>
                            <th>${msg("Across")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${clueboxTemplateCellsAcross}
                    </tbody>
                </table>
                <table class="cluebox clueboxDown">
                    <colgroup>
                        <col>
                    </colgroup>
                    <thead>
                        <tr>
                            <th>${msg("Down")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${clueboxTemplateCellsDown}
                    </tbody>
                </table>`
                }
            </div>
            `
    }
}
