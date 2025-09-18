/**
 * Clue display component for word puzzle widgets.
 * 
 * @packageDocumentation
 * @module crossword
 * @mergeModuleWith webwriter-word-puzzles
 */
import { html, HTMLTemplateResult, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { CwContext, WebwriterWordPuzzle } from './webwriter-word-puzzle';
import { WordClue } from '../lib/crossword-gen';
import { cluebox_styles } from '../styles/styles'

import {localized, msg} from "@lit/localize"
import LOCALIZE from "../../localization/generated"

// Shoelace
import "@shoelace-style/shoelace/dist/themes/light.css";


/**
 * Clue display component for solving word puzzles.
 * 
 * This component displays the clues and word lists for both crossword and
 * find-the-words puzzles. In crossword mode, it shows separate across and
 * down clue lists. In find-the-words mode, it shows the words to find.
 * It also handles highlighting the currently active clue.
 * 
 * @element webwriter-word-puzzle-cluebox
 * @since 1.0.0
 * 
 * @example
 * ```html
 * <webwriter-word-puzzle-cluebox
 *   ._wordsClues="${puzzleWords}"
 *   ._cwContext="${currentContext}">
 * </webwriter-word-puzzle-cluebox>
 * ```
 * 
 * @cssproperty --clue-highlight-color - Background color for the active clue
 * @cssproperty --clue-text-color - Text color for clues
 * @cssproperty --clue-number-color - Color for clue numbers
 */
@localized()
@customElement("webwriter-word-puzzle-cluebox")
export class WebwriterWordPuzzleCluebox extends LitElement {
    // All methods have the same names as in crosswords-js

    public localize = LOCALIZE

    /**
     * The panel elements of the find the words puzzle, containing the words.
     * 
     * See the constructor {@link WebwriterWordPuzzle.newClueBox | newClueBox()}
     */
    @query(".wordsbox")
    accessor wordsbox: HTMLTableElement

    /**
     * The panel elements of the crossword puzzle, containing the words and clues. (WIP)
     * 
     * These ones are intended for the crossword solver (i.e. student).
     * 
     * See the constructor {@link WebwriterWordPuzzle.newClueBox | newClueBox()}
     */
    @query(".clueboxAcross")
    accessor clueboxAcross: HTMLTableElement

    @query(".clueboxDown")
    accessor clueboxDown: HTMLTableElement

    /**
     * The list of words grouped with their clues, direction, and word number.
     */
    @property({type: Array, attribute: true, reflect: true})
    _wordsClues: WordClue[] = [{word: "", across: true}]

    /**
     * Current crossword context; across and clue number
     */
    @property({ type: Object, state: true, attribute: false })
    _cwContext: CwContext

    /**
     * @constructor
     * 
     * Does nothing I guess
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
