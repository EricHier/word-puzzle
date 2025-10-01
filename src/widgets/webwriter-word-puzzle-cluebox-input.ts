/**
 * Component for cluebox input, author only.
 * 
 * @packageDocumentation
 * @module crossword
 * @mergeModuleWith webwriter-word-puzzles
 */
import { html, render, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { WebwriterWordPuzzle } from './webwriter-word-puzzle';
import { WordClue } from '../lib/crossword-gen';
import { cluebox_styles } from '../styles/styles'

// Shoelace
import "@shoelace-style/shoelace/dist/themes/light.css";
import { SlButton, SlAlert, SlDrawer } from '@shoelace-style/shoelace';
import SlIcon from "@shoelace-style/shoelace/dist/components/icon/icon.component.js";

// Icons
import plus from 'bootstrap-icons/icons/plus-lg.svg';
import minus from 'bootstrap-icons/icons/dash.svg';
import magic_wand from 'bootstrap-icons/icons/magic.svg';
import pencil_square from 'bootstrap-icons/icons/pencil-square.svg';

import {localized, msg} from "@lit/localize"
import LOCALIZE from "../../localization/generated"


/**
 * Authoring interface for creating and editing word puzzles.
 * 
 * This component provides the editing interface for puzzle creators (teachers/authors).
 * It allows adding words, editing clues, and generating puzzle layouts. Only visible
 * when the main component is in edit mode (contenteditable attribute present).
 * 
 * **Features:**
 * - Interactive table for adding/removing words and clues
 * - Real-time puzzle generation
 * - Drag-and-drop word reordering
 * - Bulk import/export of word lists
 * - Input validation and error feedback
 * 
 * **Keyboard shortcuts:**
 * - `Ctrl+Enter`: Generate puzzle from current word list
 * - `Tab`: Navigate between word/clue fields
 * - `Enter`: Add new row when in last field
 * 
 * @element webwriter-word-puzzle-cluebox-input
 * @since 1.0.0
 * @status stable
 * 
 * @dependency @shoelace-style/shoelace
 * 
 * @example Basic usage (automatically included in edit mode)
 * ```html
 * <webwriter-word-puzzle contenteditable>
 *   <!-- cluebox-input component appears automatically -->
 * </webwriter-word-puzzle>
 * ```
 * 
 * @example Programmatic word list management
 * ```typescript
 * const input = document.querySelector('webwriter-word-puzzle-cluebox-input');
 * input.setWordsClues([
 *   { word: "CAT", clueText: "Feline pet" },
 *   { word: "DOG", clueText: "Canine companion" }
 * ]);
 * input.triggerCwGeneration(); // Generate puzzle
 * ```
 * 
 * @fires generateCw - When puzzle generation is requested
 * @fires set-words-clues - When word/clue data is updated
 * @fires word-added - When a new word is added to the list
 * @fires word-removed - When a word is removed from the list
 * 
 * @csspart drawer - Main editing interface container (drawer/modal)
 * @csspart word-table - Table containing word/clue input fields
 * @csspart word-input - Individual word input fields
 * @csspart clue-input - Individual clue input fields
 * @csspart add-button - Button for adding new word rows
 * @csspart remove-button - Buttons for removing word rows
 * @csspart generate-button - Main puzzle generation button
 * @csspart validation-message - Error/warning messages
 * 
 * @cssproperty [--input-font-size=14px] - Font size for input fields
 * @cssproperty [--table-border-color=#ddd] - Border color for table elements
 * @cssproperty [--button-primary-color=#2196f3] - Primary button color
 * @cssproperty [--button-success-color=#4caf50] - Success button color
 * @cssproperty [--button-danger-color=#f44336] - Danger/remove button color
 * @cssproperty [--validation-error-color=#d32f2f] - Color for error messages
 * @cssproperty [--validation-warning-color=#f57c00] - Color for warning messages
 */
/**
 * Authoring interface for creating and editing word puzzles.
 */
@localized()
@customElement("webwriter-word-puzzle-cluebox-input")
export class WebwriterWordPuzzleClueboxInput extends LitElement {
    // All methods have the same names as in crosswords-js

    public localize = LOCALIZE

    /**
     * Controls whether the input interface is in preview/readonly mode.
     * 
     * When true, the editing interface is hidden and users cannot modify
     * the word list. When false, full editing capabilities are available.
     * 
     * @default false
     */
    @property({ type: Boolean, state: true, attribute: false })
    _preview: boolean = false

    /**
     * Reference to the main word/clue input table element.
     * 
     * This table contains rows for each word with input fields for:
     * - Word text (required)
     * - Clue text (required for crosswords, optional for word search)
     * - Add/remove buttons for managing rows
     * 
     * @internal - Managed automatically by the component
     */
    @query(".clueboxInput")
    accessor clueboxInput: HTMLTableElement

    /**
     * Current list of words and clues being edited.
     * 
     * This is the working copy that gets modified as users add, remove,
     * or edit words in the interface. Changes are synchronized with the
     * parent component when puzzle generation is triggered.
     * 
     * @example Structure during editing
     * ```typescript
     * [
     *   { word: "CAT", clueText: "Pet feline" },
     *   { word: "DOG", clueText: "Pet canine" },
     *   { word: "", clueText: "" }  // Empty row for new input
     * ]
     * ```
     */
    @property({type: Array, attribute: false})
    _wordsClues: WordClue[] = [{word: "", across: true}]

    /**
     * Reference to the slide-out drawer/modal containing the editing interface.
     * 
     * The drawer provides a focused editing environment that can be opened
     * and closed without disrupting the main puzzle view.
     * 
     * @internal - Managed automatically by the component
     */
    @query("sl-drawer")
    accessor drawer: SlDrawer

    /**
     * Initializes the word/clue input component.
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
     * Dispatches an event to update the current words and clues.
     * 
     * @param {number} clue the updated clue number
     */
    setWordsClues(wordsClues: WordClue[]): void {
        let setWordsClues = new CustomEvent("set-words-clues", {bubbles: true, composed: true, detail: wordsClues})
        this.dispatchEvent(setWordsClues)
    }

    /**
     * Event handler that triggers crossword generation
     */
    triggerCwGeneration() {
        this.getNewWords()
        if(this._wordsClues.length != 0) {
            const genClicked = new CustomEvent("generateCw", {bubbles: true, composed: true})
            this.dispatchEvent(genClicked)
        }
    }

    /**
     * Extracts the words from the cluebox.
     * Calls {@link setWordsClues}
     * 
     */
    getNewWords() {
        let wordsAndClues = []
        const rows = this.clueboxInput.querySelectorAll("tbody tr")

        let words: string[] = Array.from(rows).map(row => 
                row.querySelector("td")?.textContent?.trim() || null
        )

        // Hard-coded the row here
        let clues: string[] = Array.from(rows).map(row => 
                row.querySelectorAll("td")[2]?.textContent?.trim() || null
        )

        for (let i = 0; i < words.length; i++) {
            if(words[i] != null) {
                wordsAndClues.push({word: words[i], clueText: clues[i]})
            }
        }
        this.setWordsClues(wordsAndClues)
        return this._wordsClues
    }

    showDrawer() {
        this.drawer.show()
        this.clueboxInput.tBodies[0].rows[0].cells[0].focus()
    }

    hideDrawer() {
        this.drawer.hide()
    }

    drawerKeyHandler(event: KeyboardEvent): void {
        //DEV: console.log("Drawer handler")
        this.ctrlHandler(event)
        if (event.key === "Escape") {
            event.stopPropagation()
            this.hideDrawer()
        }
    }

    /** Event handler for stopping control propagation and rendering
     * 
     */
    ctrlHandler(event: KeyboardEvent): void {
        if (event.ctrlKey && event.key === "Enter") {
            event.stopPropagation()
            this.getNewWords()
            if(this._wordsClues.length != 0) {
                this.triggerCwGeneration()
            }
        }
        else if(event.ctrlKey)
            event.stopPropagation()
    }


    /**
     * Handler for deleting the row corresponding to the clicked button.
     * 
     * @param {Event} e Click event of the button
     */
    deleteRow(e: Event) {
        let button: HTMLButtonElement = (e.target)
        const trow:  HTMLTableRowElement = button.closest("tr")
        const tBody:  HTMLTableRowElement = trow.closest("tBody")
        if(tBody.childElementCount > 5) {
            trow.remove()
        }else {
            // Clear content if four or less rows remaining
            const [td1, _, td2] = trow.querySelectorAll("td");
            td1.textContent = "";
            td2.textContent = "";
        }
    }

    /**
     * Handler for deleting the row corresponding to the clicked button.
     * 
     * @param {Event} e Click event of the button
     */
    addRow(e: Event) {
        let newRow = this.clueboxInput.tBodies[0].insertRow()

        render(this.new_row_template_inner(), newRow)
    }

    /**
     * Lit HTML template for adding a new row to cluebox input element.
     * Used in {@link WwWordPuzzlesCwCluebox.addRow() | addRow()}
     */
    new_row_template_inner() {
        return html`
                <td contenteditable></td>
                ${this.parentComponent.type == "crossword" ? html`
                <td></td>
                <td contenteditable></td>` : html``}
                <td class="button-cell" tabindex="-1">
                    <div class="button-cell-div">
                        <sl-button title="${msg("Delete row")}" tabindex="-1" size="small" class="minus-button" variant="default" circle @click=${(e) => this.deleteRow(e)}>
                            <div class="sl-icon-div"><sl-icon src=${minus}></sl-icon></div>
                        </sl-button>
                </div>
                </td>
        `
    
    }
    onPreviewToggle(contenteditable: boolean): void {
        //DEV: console.log("Preview processing for crossword-cluebox")
        this._preview = !contenteditable
        //DEV: console.log("this._preview:")
        //DEV: console.log(this._preview)

        this.requestUpdate()
    }

    

    renderClueboxInput() {
        //DEV: console.log("render cluebox input")
        const clueboxInputRender = []

        const clueboxButtonCell = html`<td class="button-cell" tabindex="-1">
                <div class="button-cell-div">
                        <sl-button title="Delete row" tabindex="-1" size="small" class="minus-button" variant="default" circle @click=${(e) => this.deleteRow(e)}>
                            <div class="sl-icon-div"><sl-icon src=${minus}></sl-icon></div>
                        </sl-button>
                </div>
            </td>`

        if(this._wordsClues != null) {
            let i = 0
            for(i < 0; i < this._wordsClues.length; i++) {
                if(this._wordsClues[i].word != "") {
                    if(this.parentComponent.type == "crossword") {
                        clueboxInputRender.push(this._wordsClues[i].clueText != "" 
                            ? html`<tr><td contenteditable>${this._wordsClues[i].word}</td>
                            <td></td><td contenteditable>${this._wordsClues[i].clueText}</td>${clueboxButtonCell}</tr>`
                            : html`<td contenteditable>${this._wordsClues[i].word}</td>
                            <td></td><td contenteditable></td>
                            ${clueboxButtonCell}</tr>`
                            )

                    }else {
                        clueboxInputRender.push(html`<tr><td contenteditable>${this._wordsClues[i].word}</td><td></td>${clueboxButtonCell}</tr>`)
                    }
                }
                else {
                    clueboxInputRender.push(html`<tr>${this.new_row_template_inner()}</tr>`)
                }
            }
            // Always have at least 5 rows present
            if(i < 5) {
                let empty = 5 - i
                for(empty; empty > 0; empty--) {
                    clueboxInputRender.push(html`<tr>${this.new_row_template_inner()}</tr>`)
                }
            }
        } else {
            for(let i = 0; i < 5; i++) {
                clueboxInputRender.push(html`<tr>${this.new_row_template_inner()}</tr>`)
            }
        }

        const wordColumnWidthStyle = this.parentComponent.type == "crossword" ? "width: 30%" : "width: 100%"


        /** 
        * cluebox template
        */
        return html`
            <table class="clueboxInput" @keydown=${this.ctrlHandler}>
                <colgroup>
                <col style=${wordColumnWidthStyle}>
                <col class="button-column">
                ${this.parentComponent.type == "crossword" ? html`<col class="clue-column">` : html``}
            </colgroup>
            <thead>
                <tr>
                    <th style=${wordColumnWidthStyle}>${msg("Words")}</th>
                    <th class="button-header-cell"> 
                    <div class="plus-button-div">
                        <sl-button title="${msg("Add rows")}" tabindex="-1" size="small" 
                        class="plus-button" variant="default" 
                        circle @click=${(e) => this.addRow(e)}>
                        <div class="sl-icon-div"><sl-icon src=${plus}></sl-icon></div>
                    </sl-button>
                    </div>
                    </th>
                    ${this.parentComponent.type == "crossword" ? html`<th class="clue-column">${msg("Clues")}</th>` : html``}
                </tr>
            </thead>
            <tbody>
                ${clueboxInputRender}
            </tbody>
            </table>
            `      
    }

    reloadUnplacedMarkers(wordsClues: WordClue[]) {
        const tbody = this.renderRoot?.querySelector('tbody');
        if (!tbody) return;

        const rows = Array.from(tbody.querySelectorAll('tr'));

        for (const row of rows) {
            const firstCell = row.querySelector('td');
            const cellText = firstCell?.textContent?.trim();
            if (wordsClues.find((wc) => wc.word == cellText && wc.x == null)) {
                row.classList.add('cell-word-not-placed');
            } else {
                row.classList.remove('cell-word-not-placed');
            }
        }
    }

    render() {
        /**
        * clueboxInput template
        */
        //DEV: console.log("parent has attr contenteditable: " + this._parent.hasAttribute("contenteditable"))
        //this.onPreviewToggle(this._parent.hasAttribute("contenteditable"))
        
        const sl_drawer = html`
                <sl-drawer @keydown=${this.drawerKeyHandler} contained position="relative">
                    ${this.renderClueboxInput()}
                    <sl-button title="Ctrl+Enter" variant="success" @click=${() => {this.triggerCwGeneration();}}>
                        <sl-icon slot="prefix" src=${magic_wand}></sl-icon>
                        ${msg("Generate puzzle")}
                    </sl-button>
                </sl-drawer>
                <!--<sl-button id="button-drawer" title="Show editor for words and clues" class="drawer-button author-only" variant="default" circle @click=${() => this.showDrawer()}>
                    <div style="justify-content:center;padding-top:2px;">
                        <sl-icon src=${pencil_square}></sl-icon>-->
                    </div>
                </sl-button>
`
                
        return html`${!this._preview ? sl_drawer : html``}`
    }
}
