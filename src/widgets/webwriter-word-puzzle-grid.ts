/**
 * Main WebWriter Word Puzzles Widget.
 * 
 * @packageDocumentation
 * @module crossword
 */
import { html } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { WebwriterWordPuzzle, CwContext } from './webwriter-word-puzzle';
import { WordClue, Cell, defaultCell, newCellDOM, GenerationResults, generateCrossword, generateCrosswordFromList } from '../lib/crossword-gen'
import { grid_styles } from '../styles/styles'

// TODO Replace with HelpOverlay, HelpPopup from "@webwriter/wui/dist/helpSystem/helpSystem.js"
// @webwriter/wui
import { SlAlert } from '@shoelace-style/shoelace';

// Shoelace
import "@shoelace-style/shoelace/dist/themes/light.css";

const DEFAULT_DIMENSION: number = 9

/**
 * Grid component for displaying and interacting with word puzzle grids.
 * 
 * This component renders the main puzzle grid where letters are placed and users
 * can interact to solve puzzles. It supports both crossword and word search formats
 * with different interaction patterns for each.
 * 
 * Features:
 * - Keyboard navigation for crossword solving
 * - Answer validation and visual feedback
 * - Grid highlighting for active clues
 * - Automatic puzzle generation and layout
 * - Touch-friendly interface for mobile devices
 * 
 * @element webwriter-word-puzzle-grid
 * @since 1.0.0
 * @status stable
 * 
 * @dependency @shoelace-style/shoelace
 * 
 * @example Basic crossword grid
 * ```html
 * <webwriter-word-puzzle-grid></webwriter-word-puzzle-grid>
 * ```
 * 
 * @fires cell-click - When a grid cell is clicked or focused
 * @fires answer-input - When user types in a cell
 * @fires word-found - When a word is successfully found in word search
 * 
 * @csspart grid - The main grid container
 * @csspart cell - Individual grid cells
 * @csspart cell-number - Cell numbers for crossword clues
 * @csspart cell-active - Currently selected/highlighted cells
 * @csspart cell-correct - Cells with correct answers
 * @csspart cell-incorrect - Cells with incorrect answers
 * 
 * @cssproperty [--grid-cell-size=30px] - Size of grid cells
 * @cssproperty [--grid-border-width=1px] - Border width for cells
 * @cssproperty [--grid-font-size=16px] - Font size for cell content
 * @cssproperty [--grid-active-color=#e3f2fd] - Background color for active cells
 * @cssproperty [--grid-correct-color=#c8e6c9] - Background color for correct answers
 * @cssproperty [--grid-incorrect-color=#ffcdd2] - Background color for incorrect answers
 */
/**
 * Grid component for displaying and interacting with word puzzle grids.
 */
@customElement("webwriter-word-puzzle-grid")
export class WebwriterWordPuzzleGrid extends LitElement {
    // All methods have the same names as in crosswords-js

    /**
     * Controls whether the grid is in preview/solving mode or edit mode.
     * 
     * In preview mode (true):
     * - Users can input answers to solve the puzzle
     * - Grid cells are interactive for typing
     * - Answer checking is available
     * 
     * In edit mode (false): 
     * - Grid shows the solution state
     * - Cells display correct answers
     * - Used for puzzle creation and editing
     * 
     * @default false
     */
    @property({ type: Boolean, state: true, attribute: false, 
        hasChanged(newValue: boolean, oldValue: boolean): boolean 
            {return this.onPreviewToggle(newValue, oldValue)} })
    _preview: boolean = false


    /**
     * 2D array representing the puzzle grid structure.
     * 
     * Each cell contains:
     * - `white`: Whether the cell accepts letters (true) or is blocked (false)
     * - `answer`: The correct letter for this cell
     * - `number`: Clue number if this cell starts a word
     * - `direction`: Word direction(s) through this cell ("across", "down", "both")
     * 
     * @example Grid structure
     * ```typescript
     * [
     *   [
     *     { white: true, answer: "C", number: 1, direction: "across" },
     *     { white: true, answer: "A", number: null, direction: "across" },
     *     { white: true, answer: "T", number: null, direction: "across" }
     *   ],
     *   // ... more rows
     * ]
     * ```
     */
    @property({ type: Array, state: true, attribute: true, reflect: true})
    grid: Cell[][]

    /**
     * Reference to the HTML div element that contains the rendered grid.
     * 
     * This element contains all the individual cell divs and handles
     * grid-level interactions like keyboard navigation and focus management.
     * 
     * @internal - Managed automatically by the component
     */
    @property({ type: HTMLDivElement, state: true, attribute: false})
    gridEl: HTMLDivElement

    /**
     * Reference to the SVG element used for word search puzzle highlighting.
     * 
     * Used to draw lines over found words in word search puzzles,
     * providing visual feedback when words are discovered.
     * 
     * Only used for "find-the-words" puzzle type.
     * 
     * @internal - Managed automatically by the component
     */
    @property({ type: SVGSVGElement, state: true, attribute: false})
    svgEl: SVGSVGElement

    /**
     * Array of words and clues associated with this grid.
     * 
     * Synchronized with the parent component's word list.
     * Used for puzzle generation and answer validation.
     * 
     * @see WebwriterWordPuzzle._wordsClues for complete documentation
     */
    @property({ type: Array, state: true, attribute: true, reflect: true})
    _wordsClues: WordClue[]

    /**
     * Current interaction context for crossword puzzles.
     * 
     * Tracks which clue/direction is active for highlighting
     * and keyboard navigation purposes.
     * 
     * @internal - Synchronized with parent component
     */
    @property({ type: Object, state: true, attribute: false})
    _cwContext

    /**
     * Currently selected row in the grid (0-based index).
     * 
     * Used for keyboard navigation and cell highlighting.
     * Updated when user clicks cells or uses arrow keys.
     */
    @state()
    cur_row: number

    /**
     * Currently selected column in the grid (0-based index).
     * 
     * Used for keyboard navigation and cell highlighting.
     * Updated when user clicks cells or uses arrow keys.
     */
    @state()
    cur_col: number


    /**
     * @constructor
     * Some constructor I apparently thought was a good idea.
     * 
     * Pretty much just makes a grid with 9x9 dimensions
     */
    constructor(private parentComponent: WebwriterWordPuzzle) {
        super()
        this.grid = Array.from({ length: DEFAULT_DIMENSION}, () => Array(DEFAULT_DIMENSION).fill(defaultCell()))
        this._cwContext = {across: null, clue: null}
    }

    /**
     * Styles for the crossword grid.
     * clue-label based off of crossword-js
     */
    static get styles() {
        return grid_styles
    }

    // TODO Add event listener for adding the focus class based on the clue number and direction


    /** 
     * For handling a keypress in the crossword grid. Goes to next relevant cell
     * 
    */
    private nextEmptyCell(e?: KeyboardEvent) {
        // Idk how to get typescript to stop crying about this even though it works
        let currentCell: HTMLDivElement
        if(e == null) {
            currentCell = this.getCellDOM(this.cur_row, this.cur_col)
        }
        else {
            currentCell = e.target
        }

        let nextWord: WordClue
        let nextCell: HTMLDivElement
        let row = (Number(currentCell.getAttribute("grid-row")))
        let col = (Number(currentCell.getAttribute("grid-col")))
        let init_row = (Number(currentCell.getAttribute("grid-row")))
        let init_col = (Number(currentCell.getAttribute("grid-col")))

        let timeoutLimit = 0
        for(let wordClue of this._wordsClues) {
            timeoutLimit += wordClue.word.length
        }
        timeoutLimit = timeoutLimit * 10

        let {across: acrossContext, clue: clueContext} =  this.getContextFromCell(row, col)

        if(this._cwContext.across != null) {
            acrossContext = this._cwContext.across
        }
        if(this._cwContext.clue != null) {
            clueContext = this._cwContext.clue
        }

        let initialAcross = acrossContext
        let initialClue = clueContext

        let currentWordIndex = this.getNextWordIndex(acrossContext, clueContext) - 1
        if (currentWordIndex == -1) {
            currentWordIndex = this._wordsClues.length - 1
        }
        let iNextW = -1

        let timeout = 0
        let pass = -1
        let nrow = 0
        let ncol = 0
        do {
            nextWord = null
            nrow = row + Number(!acrossContext)
            ncol = col + Number(acrossContext)

            pass += (row == init_row) && (col == init_col) ? 1 : 0
            
            // Edge case for a one-word crossword
            if(this._wordsClues.length > 1) {
                iNextW = this.getNextWordIndex(acrossContext, clueContext)
            }

            // If going further would be out of bounds, get next word
            if((ncol >= this.grid.length) 
                || (nrow >= this.grid.length) 
                // if no cell is defined
                || this.grid[nrow][ncol] == null
                // if the next cell is black
                || !this.grid[nrow][ncol].white) {
                if(iNextW == -1) {
                    iNextW = 0
                }
                nextWord = this._wordsClues[iNextW]
                row = nextWord.x
                col = nextWord.y
                nextCell = this.getCellDOM(row, col)
            }
            // otherwise, get the next cell
            else {
                    row = nrow
                    col = ncol
                    nextCell = this.getCellDOM(row, col)
            }

            timeout += 1
            if(timeout > timeoutLimit) {
                throw new Error("You've created an infinite loop, congratulations")
            }

            if(nextWord) {
                clueContext = nextWord.clueNumber
                acrossContext = nextWord.across
            }

            timeout += 1
            if(timeout >= timeoutLimit) {
                throw new Error("You've created an infinite loop, congratulations")
            }
        } while(pass < 2 && nextCell.querySelector(".cell-letter").textContent !== "")

        if(nextCell.querySelector(".cell-letter").textContent == "") {
            nextCell.focus()
            this.cur_col = Number(nextCell.getAttribute("grid-row"))
            this.cur_row = Number(nextCell.getAttribute("grid-col"))
            // Update context only if another word was chosen
            if(nextWord) {
                this.setContext(this._cwContext)
            }
        }
        else {
            // Blur if there are no empty cells
            currentCell.blur()
            this.setContext({across: null, clue: null})
        }
    }

         /**
         * Dispatches an event to change the current clue and direction context.
         * 
         * @param {number} clue the updated clue number
         * @param {boolean} across whether the updated direction is across
         */
    setContext(context: CwContext): void {
        let setContext = new CustomEvent("set-context", {bubbles: true, composed: true, detail: context})
        this.dispatchEvent(setContext)
    }


    getContextFromCell(row: number, col: number): CrosswordContext {
        let cell: HTMLDivElement = this.gridEl.querySelector('[grid-row="'+ row + '"][grid-col="' + col + '"]')
        let across: boolean
        let clue

        if(this._cwContext == null) {
            across = (cell.getAttribute("direction") == "across" || cell.getAttribute("direction") == "both")
        }
        else {
            if(cell.getAttribute("direction") == "both") {
                across = this._cwContext.across
            }
            else  {
                across = cell.getAttribute("direction") == "across"
            }
        }

        clue = this.getClueNumber(across, this.cur_row, this.cur_col)

        return {across, clue}
    }

    /**
     * Gets the current clue number for a cell based off of the grid object. (Not DOM)
     * 
     * @param {boolean} across 
     * @param {number} x 
     * @param {number} y 
     * @returns 
     */
    private getClueNumber(across: boolean, x: number, y: number): number {
            let shift_row = across ? 0 : 1
            let shift_col = 1 - shift_row

            while((x-shift_row >= 0 && y-shift_col >= 0) && this.grid[x-shift_row][y-shift_col].white) {
                x -= shift_row
                y -= shift_col
            }

            return this.grid[x][y].number
        }

    /**
     * Method for checking the answers.
     */
    checkAnswers(grid: Cell[][], gridDOM: HTMLDivElement) {
        DEV: console.log("Checking answers")
        let cellDOM: HTMLDivElement
        let cellDOMContents: HTMLDivElement

        for(let i = 0; i < grid.length; i++) {
            for(let j = 0; j < grid.length; j++) {
                cellDOM = this.getCellDOM(i, j, gridDOM)
                cellDOMContents = (this.getCellDOM(i, j, gridDOM)).querySelector(".cell-letter")
                if(cellDOMContents) {
                    if(cellDOMContents.innerText == grid[i][j].answer) {
                        cellDOM.setAttribute("correct", "")
                    }
                    else if(cellDOMContents.innerText != "" && grid[i][j].answer) {
                        cellDOM.setAttribute("incorrect", "")
                    }
                }
            }
        }
        setTimeout(() => { this.removeCellHighlighting(gridDOM); }, 5000);
    }

    private removeCellHighlighting(gridDOM: HTMLDivElement, inc?: boolean) {
        let correctCells = gridDOM.querySelectorAll("[correct]")
            for(let cell of correctCells) {
                cell.removeAttribute("correct")
            }
            if(inc) {
                let incorrectCells = gridDOM.querySelectorAll("[incorrect]")
                for(let cell of incorrectCells) {
                    cell.removeAttribute("incorrect")
                }
            }
    }

    /** Function for getting a cell based on its location in the DOM grid.
     * 
     * @param {number} row the row number, 1-indexed
     * @param {number} col the column number, 1-indexed
     * @returns {HTMLDivElement} the DOM element of the cell
    */
    private getCellDOM(row: number, col: number, gridDOM?: HTMLDivElement): HTMLDivElement {
        if(gridDOM) {
            return gridDOM.querySelector('[grid-row="'+ row + '"][grid-col="' + col + '"]')
        }
        return this.gridEl.querySelector('[grid-row="'+ row + '"][grid-col="' + col + '"]')
    }

    /** Function for getting the next word in context of the direction and current clue number.
     * Returns the empty cell element at the next word
     * 
     * @returns {HTMLDivElement} the DOM element of the cell
    */
   // May not need the arguments lol
    private getNextWordIndex(across: boolean, clue: number): number {
        if(this._wordsClues.length == 1) {
            return 0
        }
            let i = this._wordsClues.findIndex(wordClue => wordClue.clueNumber == clue && wordClue.across == across)
            i += 1
            if(i >= this._wordsClues.length) {
                i = this._wordsClues.findIndex(wordClue => wordClue.across == !across)
            }
        return i
    }

    /**
     * Constructor for the cells of the {@link WebwriterWordPuzzle.gridEl | grid} DOM element.
     * 
     * @param {Document} document the root node of the [DOM](https://en.wikipedia.org/wiki/Document_Object_Model#DOM_tree_structure)
     * @param {number} x the row of the cell, 0-indexed
     * @param {number} y the column of the cell, 0-indexed
     * @returns {HTMLDivElement} the DOM element for the cell
     */
    protected newCellDOM(document: Document, x: number, y: number, letter: string) {
        const cellDOM = newCellDOM(document, this.grid, this.parentComponent.type, x, y, letter)
        cellDOM.addEventListener('keydown', (e) => { this.cellKeydownHandler(e) });
        cellDOM.addEventListener('focusin', (e: FocusEvent) => {this.cellFocusHandler(e)});

        return cellDOM
    }

    /**
     * Event listener for a cellDOM element that handles keypresses. 
     * 
     * Tab switches to the next word, space changes context for direction, and
     * if the key was an alphabetic character, replaces text currently in the cell
     * with whatever was pressed and calls nextEmptyCell().
     * Arrow key navigation is also possible.
     * 
     * Overrides / prevents the default character insertion
     */
    private cellKeydownHandler(e: KeyboardEvent) {
        e.preventDefault(); // Prevent default character insertion
        const isAlphaChar = str => /^[a-zA-Z]$/.test(str);
        let cell: HTMLDivElement = (e.target)
        let nextCell: HTMLDivElement

        // For arrow keys
        let row = Number(cell.getAttribute("grid-row"))
        let col = Number(cell.getAttribute("grid-col"))

        e.stopPropagation(); // Prevent default character insertion
        switch(e.key) {
            // Go to next clue
            case "Tab":
                e.stopPropagation()
                let nextWord  = this._wordsClues[this.getNextWordIndex(this._cwContext.across, this._cwContext.clue)]
                row = nextWord.x
                col = nextWord.y
                this.setContext(this._cwContext)
                nextCell = this.getCellDOM(row, col)
                nextCell.focus()
                break;
            // Change direction context if the current cell goes in both directions
            case " ":
                if(cell.getAttribute("direction") == "both") {
                    this.setContext({across: this._cwContext.across, clue: this.getClueNumber(this._cwContext.across, Number(cell.getAttribute("grid-row")), Number(cell.getAttribute("grid-col")))})
                }
                break;
            // NAVIGATION ========================================================
            case "ArrowLeft":
                col -= 1
                if(col >= 0 && this.grid[row][col].white) {
                    nextCell = this.getCellDOM(row, col)
                    nextCell.focus()
                }
                break;
            case "ArrowRight":
                col += 1
                if(col < this.grid.length && this.grid[row][col].white) {
                    nextCell = this.getCellDOM(row, col)
                    nextCell.focus()
                }
                break;
            case "ArrowUp":
                row -= 1
                if(row >= 0 && this.grid[row][col].white) {
                    nextCell = this.getCellDOM(row, col)
                    nextCell.focus()
                }
                break;
            case "ArrowDown":
                row += 1
                if(row < this.grid.length && this.grid[row][col].white) {
                    nextCell = this.getCellDOM(row, col)
                    nextCell.focus()
                }
                break;
            case "Backspace":
            case "Delete":
                cell.querySelector('.cell-letter').textContent = ""
            // Insert character
            default: 
                if (isAlphaChar(e.key)) {
                    cell.querySelector('.cell-letter').textContent = e.key.toUpperCase()
                    cell.removeAttribute("incorrect")
                    this.nextEmptyCell(e)
                }
        }
    }


    /** Handler for when a cell gains focus. Sets the clue and direction context
     * 
     * @param {FocusEvent} e - the event. Its target attribute is used
    */
    private cellFocusHandler(e: FocusEvent) {
        this.cur_row = Number((e.target).getAttribute("grid-row"))
        this.cur_col = Number((e.target).getAttribute("grid-col"))
        //
        // Needs to be corrected bc it's 1-indexed in the DOM
        let x = this.cur_row
        let y = this.cur_col

        // Ensure current context isn't null
        let {across: acrossContext, clue: clueContext} =  this.getContextFromCell(this.cur_row, this.cur_col)

        // This is ideally not supposed to happen if a cell is already currently selected
        //if (this._crosswordContext.acrossContext == null) {
            this._cwContext.across = acrossContext
        //}

        this._cwContext.clue = clueContext

        // Iterate to beginning of word
        // NOTE: This may mean the context is changed even 
        if(this._cwContext.acrossContext) {
            while(y > 0 && this.grid[x][y-1].white) {
                y -= 1
            }
        }
        else {
            while(x > 0 && this.grid[x-1][y].white) {
                x -= 1
            }
        }
        //DEV: console.log("Word beginning (0-indexed): (" + x + ", " + y + ")")
        this.setContext(this._cwContext)
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
     * Generates crossword puzzle based off of words in the clue box, without given coordinates.
     * Calls the function in crossword-gen
     * 
     * @param {WordClue[]} wordsClues The list of words and clues from which to generate the crossword
     * @returns {WordClue[]} 
     */
    generateCrossword(wordsCluesInput: WordClue[]): WordClue[] {
        let {wordsAndClues, grid} = generateCrossword(wordsCluesInput)
        this.setWordsClues(wordsAndClues)
        this.grid = grid

        this.newCrosswordGridDOM(document)

        return wordsAndClues
    }

    // TODO Implement answer checking
    // It should compare the text content of the cell with the answer in this.grid

     /**
     * Build / construct the {@link WebwriterWordPuzzle.gridEl | grid} DOM element that will contain the words and clues
     *
     * Dimensions are based on {@link this.grid | grid}.
     *
     * @param {Document} document the root node of the [DOM](https://en.wikipedia.org/wiki/Document_Object_Model#DOM_tree_structure)
     * @returns {HTMLDivElement} the DOM element for the grid.
     * Source: crosswords-js
     */
    newCrosswordGridDOM(document) {
        let gridEl = document.createElement('div');
        gridEl.classList.add('grid')
        for (let x = 0; x < this.grid.length; x += 1) {
            for (let y = 0; y < this.grid.length; y += 1) {
                //  Build the cell element and place cell in grid element
                gridEl.appendChild(this.newCellDOM(document, x, y, this.grid[x][y].answer));
            }
        }

        if(this.parentComponent.type == "find-the-words") {
            // Create SVG element
            this.svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            this.svgEl.setAttribute("id", "line-layer");
            this.svgEl.setAttribute("style", "position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;");
    
            // Append SVG to grid
            gridEl.appendChild(this.svgEl);
        }

        this.gridEl = gridEl
        this.requestUpdate()
        return this.gridEl
    }

    render() {
        this.grid = generateCrosswordFromList(this._wordsClues)
        this.newCrosswordGridDOM(document)


        // Add event listeners for dragging over the words and getting feedback
        if(this.parentComponent.type == "find-the-words") {
            let isDragging = false;
            let startX = 0;
            let startY = 0;
            let startIndexX = 0;
            let startIndexY = 0;
            let lineEl = null;

            this.gridEl.addEventListener('mousedown', (e) => {
                isDragging = true;

                // Store the indices of the cell on which the dragging is started
                const cellLetter = e.target as HTMLElement;
                startIndexX = parseInt(cellLetter.getAttribute('data-x'), 10);
                startIndexY = parseInt(cellLetter.getAttribute('data-y'), 10);

                // Store the coordinates of the start dragging point for visualization
                const rect = this.svgEl.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                startX = x;
                startY = y;

                // Remove old line if still existing
                if (lineEl && lineEl.parentNode) {
                    lineEl.parentNode.removeChild(lineEl);
                }
                lineEl = null;

                // Create the new line
                lineEl = document.createElementNS("http://www.w3.org/2000/svg", "line");
                lineEl.setAttribute("x1", startX);
                lineEl.setAttribute("y1", startY);
                lineEl.setAttribute("x2", startX);
                lineEl.setAttribute("y2", startY);
                lineEl.setAttribute("stroke", "green");
                lineEl.setAttribute("stroke-width", "25");
                lineEl.setAttribute("stroke-opacity", "0.5");
                lineEl.setAttribute("stroke-linecap", "round");
                

                this.svgEl.appendChild(lineEl);
            });

            this.gridEl.addEventListener('mousemove', (e) => {
                if (!isDragging || !lineEl) {
                    lineEl.parentNode.removeChild(lineEl);
                    lineEl = null;
                    return
                };

                const rect = this.svgEl.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const currentX = x;
                const currentY = y;

                lineEl.setAttribute("x2", currentX);
                lineEl.setAttribute("y2", currentY);
            });

            this.gridEl.addEventListener('mouseup', (e) => {
                const cellLetter = e.target as HTMLElement;

                // Get the indices of the cell on which the mouse was ended dragging
                const endIndexX = parseInt(cellLetter.getAttribute('data-x'), 10);
                const endIndexY = parseInt(cellLetter.getAttribute('data-y'), 10);

                // Calculate the start of the word indices and end of the word indices
                // The use could potentially draw over the words from the end of the word to the start
                // In that case the coordinates are switched and this works because words can only be horizontal or vertical
                const startWordIndexX = Math.min(startIndexX, endIndexX)
                const startWordIndexY = Math.min(startIndexY, endIndexY)

                const endWordIndexX = Math.max(startIndexX, endIndexX)
                const endWordIndexY = Math.max(startIndexY, endIndexY)


                // Check if the word over which was drawn is in the word list
                const word = this._wordsClues.find((w) => {
                    // Not the right word if the gragging was not started on the correct character
                    if(w.x != startWordIndexX || w.y != startWordIndexY) {
                        return false;
                    }

                    // Check if it is the correct word by looking if the dragging was ended on the correct character
                    // Please dont wonder that x and y are not the normal way. Them seems to be switched in the implementation
                    // X is for rows, Y for columns
                    if(w.across) {
                        return w.x == endWordIndexX && w.y + w.word.length - 1 == endWordIndexY
                    }else {
                        return w.x + w.word.length - 1 == endWordIndexX && w.y == endWordIndexY
                    }
                })

                // Mark word as correct if a word was found
                if(word) {
                    for(var i = 0; i < word.word.length; i++) {
                        const cellDOM = word.across ? this.getCellDOM(word.x, word.y + i, this.gridEl) : this.getCellDOM(word.x + i, word.y, this.gridEl)
                        cellDOM.setAttribute("correct", "")
                        // Highlight the word in the words table
                        this.setContext({across: word.across, clue: this.getClueNumber(word.across, word.x, word.y)})
                    }
                }


                isDragging = false;
                if (lineEl && lineEl.parentNode) {
                    lineEl.parentNode.removeChild(lineEl);
                }
                lineEl = null;
            });
        }

        return (html`${this.gridEl}`)
    }

}

