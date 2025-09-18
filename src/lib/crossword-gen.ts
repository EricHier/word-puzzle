/**
 * Library for generating placements on a crossword grid for a given list of words.
 * 
 * @packageDocumentation
 * @module crossword
 * @mergeModuleWith webwriter-word-puzzles
 */

/**
 * Represents a single cell in the puzzle grid.
 * 
 * Each cell contains information about its state, content, and role in the puzzle.
 * White cells are part of the puzzle and can contain letters, while black cells
 * are blocked/inactive areas of the grid.
 * 
 * @interface Cell
 * @example
 * ```typescript
 * // A white cell with the letter 'A' and clue number 1
 * const cell: Cell = {
 *   white: true,
 *   answer: 'A',
 *   number: 1,
 *   direction: 'across'
 * };
 * 
 * // A black/blocked cell
 * const blockedCell: Cell = {
 *   white: false
 * };
 * ```
 */
export interface Cell {
    /** Whether this cell is active (true) or blocked/black (false) */
    white: boolean;
    /** The correct letter for this cell (if it's a white cell) */
    answer?: string;
    /** The clue number if this cell starts a word */
    number?: number;
    /** The word direction(s) this cell participates in ('across', 'down', 'both') */
    direction?: string;
}

/**
 * Represents a word and its associated metadata in a puzzle.
 * 
 * Contains all information needed to place and reference a word in the puzzle,
 * including its position, direction, clue text, and numbering. Used for both
 * crossword and find-the-words puzzle types.
 * 
 * @interface WordClue
 * @example
 * ```typescript
 * // A complete word entry for a crossword
 * const wordClue: WordClue = {
 *   word: "JAVASCRIPT",
 *   clueText: "Popular programming language",
 *   x: 2,
 *   y: 1,
 *   across: true,
 *   clueNumber: 7
 * };
 * 
 * // A word for find-the-words (minimal info needed)
 * const findWord: WordClue = {
 *   word: "PUZZLE",
 *   x: 0,
 *   y: 3,
 *   across: false
 * };
 * ```
 */
export interface WordClue {
    /** The word itself (uppercase letters only) */
    word: string,
    /** The clue text for crosswords (optional for find-the-words) */
    clueText?: string,
    /** Starting x-coordinate (column) on the grid (0-indexed) */
    x?: number,
    /** Starting y-coordinate (row) on the grid (0-indexed) */
    y?: number,
    /** Whether the word runs across (true) or down (false) */
    across?: boolean,
    /** The numbered clue reference for crosswords */
    clueNumber?: number
}


/**
 * Function to create a default cell object.
 */
export function defaultCell(): Cell {
    return {
        white: false,
        answer: null, // NOTE Should this be here, or should
        number: null,
        direction: null
    }
}

/**
* Constructor for the cells of the {@link WwWordPuzzlesCrossword.gridEl | grid} DOM element.
*
* @param {Document} document the root node of the [DOM](https://en.wikipedia.org/wiki/Document_Object_Model#DOM_tree_structure)
* @param {number} x the row of the cell, 0-indexed
* @param {number} y the column of the cell, 0-indexed
* eventual @param {HTMLDivElement} modelCell the representation of this grid cell in the  _crosswordModel_.
* @returns {HTMLDivElement} the DOM element for the _cell_
* Source: crosswords-js, partially
*/
export function newCellDOM(document: Document, grid: Cell[][], type: string, x: number, y: number, letter: string) {
    const cellDOM: HTMLDivElement = document.createElement('div');
    cellDOM.className = 'cell'
    cellDOM.style.gridRowStart = (x+1).toString()
    cellDOM.style.gridColumnStart = (y+1).toString()
    cellDOM.setAttribute("grid-row", (x).toString())
    cellDOM.setAttribute("grid-col", (y).toString())

    // This is just temporary for testing
    try {
    if (!grid[x][y].white) {
        if(type == "crossword") {
            cellDOM.setAttribute("black", "")
            cellDOM.setAttribute("answer", "false");
            cellDOM.contentEditable = "false";

        }else {
            cellDOM.setAttribute("white", "")
            cellDOM.setAttribute("answer", "false");
            cellDOM.contentEditable = "false";
    
            const cellLetter = document.createElement('div');
            cellLetter.classList.add('cell-letter')
            const randomLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
            cellLetter.innerText = randomLetter
            cellDOM.appendChild(cellLetter)

        }
    }
    else {
        if(type == "crossword") {
            cellDOM.contentEditable = "true";
        }else {
            cellDOM.contentEditable = "false";
        }
        cellDOM.removeAttribute("black")
        cellDOM.setAttribute("answer", "true");
        cellDOM.setAttribute("direction", grid[x][y].direction);
        // Create div for adding a letter
        const cellLetter = document.createElement('div');
        cellLetter.classList.add('cell-letter')
        // Add x and y data to the cell and letter for checking in find the words if the cursor was dragged over the correct characters
        cellDOM.setAttribute('data-x', x.toString());
        cellDOM.setAttribute('data-y', y.toString());
        cellLetter.setAttribute('data-x', x.toString());
        cellLetter.setAttribute('data-y', y.toString());
        if(type == "find-the-words") {
            cellLetter.innerText = letter
        }
        cellDOM.appendChild(cellLetter)
        // Add a small div for the clue number if the cell has one
        if (type == "crossword" && grid[x][y].number) {
            const numberText = document.createElement('div');
            numberText.classList.add('clue-label');
            numberText.contentEditable = "false";
            numberText.innerHTML = grid[x][y].number.toString();
            cellDOM.appendChild(numberText);
        }
    }
    }
    catch(error) {
        DEV: console.log("newCellDOM(): Error at (" + x + "," + y + ")")
    }

    return cellDOM
}

/**
 * ```typescript
 * {
 *   wordsAndClues: WordClue[],
 *   grid: Cell[][]
 * }
 * ```
 */
export interface GenerationResults {
    wordsAndClues: WordClue[],
    grid: Cell[][]
}

function deleteElement<Type>(list: Type[], element: Type): Type {
    list.splice(list.indexOf(element), 1)
    return element
}

/**
     * Generates crossword puzzle based off of words in the clue box, without given coordinates.
     * 
     * Based off of Agarwal and Joshi 2020
     * @param {WordClue[]} wordsClues The list of words and clues from which to generate the crossword
     * @returns {WordClue[]} 
     */
export function generateCrossword(wordsClues: WordClue[]): GenerationResults {

    // TODO Figure out generation / backtracking recursively

    // Calculate minimum dimensions of crossword
    const minDim = wordsClues.map(word => word.word.length).reduce((max, len) => Math.max(max, len), 0)

    /** The best grid found so far.
     * Smallest grid with the largest amount of words placed
     */
    let bestGrid: Cell[][] // @type {Cell[][]}
    let bestWordsPlaced: WordClue[] = []  // @type {string[]}

    /** Grid for testing adding / removing words */
    let scratchpadGrid: Cell[][] = [] // @type {Cell[][]}
    let scratchWordsPlaced: WordClue[] = []  // @type {string[]}

    // Initialize scratchpadGrid
    for(let i = 0; i < wordsClues.reduce((accumulator, currentValue) => accumulator + currentValue.word.length, 0); i++) {
        scratchpadGrid[i] = []
        for (let j = 0; j < wordsClues.reduce((accumulator, currentValue) => accumulator + currentValue.word.length, 0); j++) {
            scratchpadGrid[i][j] = defaultCell()
        }
    }

    /** The rankings of the words; indices correspond to original word list */
    let rankings: number[] = Array(wordsClues.length).fill(-1) // @type{number[]}

    /** The words in a list from high to low based off of ranking.
     * This may change based on backtracking so that the order 
     * doesn't correspond to the actual ranking anymore
     */
    let rankedList: WordClue[]
    rankedList = sortWords() // @type{string[]}

    /** How many clues there currently are. Used to calculate next clue number.
     */
    let clueCount = 0 // @type{number}

    /** Number of iterations until the algorithm stops */
    let epoch = 3000 // @type{number}

    // Rank the words
    for(let i = 0; i < wordsClues.length; null) {
        rankings[i] = rankWord(i)
        i++
    }

    let crosswordGenTimeout = 0

    try {
        generateCrosswordGrid(wordsClues, 0)
    }
    catch(error) {
        DEV: console.log("Crossword generation interrupted")
        DEV: console.log(error.message)
        DEV: console.log(error.stack)
    }

    //DEV: console.log("Words and clues:")
    //DEV: console.log(wordsClues)

    // iterate through the cells and number them properly just in case
    clueCount = 0

    for(let i = 0; i < bestGrid.length; i++) {
        let previousNumber = 0
        for (let j = 0; j < bestGrid.length; j++) {
            if(bestGrid[i][j].number) {
                previousNumber = bestGrid[i][j].number
                bestGrid[i][j].number = clueCount + 1
                clueCount += 1
            }
        }
    }

    for(let wordClue of bestWordsPlaced) {
        if(!wordClue.clueText) {
//            wordClue.clueText = "* No clue for this word *"
        }
        if(!(wordClue.clueText && (wordClue.across != null) && wordClue.clueNumber && wordClue.word)) {
            //DEV: console.log("Not all of the values for a WordClue type are defined for " + wordClue.word)
        }
    }

    // The following changes the original order, but I don't think that's necessarily bad?

    // Sort words by clue number
    bestWordsPlaced.sort((a, b) => a.clueNumber - b.clueNumber)
    // Sort words by across / down
    bestWordsPlaced.sort((a, b) => Number(b.across) - Number(a.across))
    //DEV: console.log("bestWordsPlaced sorted by clue number and across / down:")
    //DEV: console.log(bestWordsPlaced)

    // Bring words into inital order
    const orderWordsClues = wordsClues.map((wc) => bestWordsPlaced.find((bw) => bw.word == wc.word && bw.clueText == wc.clueText) || null).filter((nn) => nn != null)

    wordsClues = orderWordsClues
    DEV: console.log(bestGrid)

    return {wordsAndClues: orderWordsClues, grid: bestGrid} 


    // =====================================================================================
    // HELPER FUNCTIONS
    // =====================================================================================

    /** Function that returns possible places for a word in the grid.
     * Returns null if there are no possible places.
     * @param { Cell[][] } inputGrid a given input grid
     * @param { WordClue } newWordClue 
     * @returns { boolean } - true if the word can be placed into G with at least one letter intersecting with another word
    */
    function placeable(inputGrid: Cell[][], wordsCluesPl: WordClue[], newWordClue: WordClue, firstWord?: boolean): WordClue[] {
        if (firstWord) {
            let possiblePlacementX = Math.floor(minDim/2 - 1);
            let possiblePlacementY = Math.floor(minDim/2) - Math.floor(newWordClue.word.length/2);

            let possiblePlacement: WordClue = {...newWordClue}

            possiblePlacement.x = possiblePlacementX
            possiblePlacement.y = possiblePlacementY
            possiblePlacement.across = true

            
            return [possiblePlacement]
        }

        /** Function for determining whether a word is placeable in the grid. */
        let possiblePlacements: WordClue[]  = []

        // For every word already placed in the grid,
        // Go through all of its possible intersections with the new word
        for (let placedWord of wordsCluesPl) {
            if(placedWord.x != null && placedWord.y != null && placedWord.across != null) {
                let intersections = intersecting(newWordClue.word, placedWord.word)
                let possibleDirection: string
                if (placedWord.across) {
                    possibleDirection = "down"
                }
                else {
                    possibleDirection = "across"
                }

                // Calculate coordinates of a possible placement
                for (let intersection of intersections) {
                    // New word should be vertical
                    let possibleX, possibleY: number
                    if (possibleDirection == "down") {
                        possibleX = placedWord.x - intersection[0]
                        possibleY = placedWord.y + intersection[1]
                    }
                    // New word should be horizontal
                    else {
                        possibleX =  placedWord.x + intersection[1]
                        possibleY = placedWord.y - intersection[0]
                    }

                    // Test for collisions with existing words and whether adjacent squares would be white
                    let noClash = true
                    let notAdjacent = true

                    // Don't place a word if there is a white cell right before or after it starts
                    let col_shift = 1
                    let row_shift = 1

                    if(possibleDirection == "across"){
                        col_shift = newWordClue.word.length
                    }
                    else {
                        row_shift = newWordClue.word.length
                    }

                    if(possibleX - row_shift >= 0 && possibleY - col_shift >= 0) {
                        notAdjacent = notAdjacent && !inputGrid[possibleX - row_shift][possibleY - col_shift].white
                    }

                    if(possibleX + row_shift < inputGrid.length && possibleY + col_shift < inputGrid.length) {
                        notAdjacent = notAdjacent && !inputGrid[possibleX + row_shift][possibleY + col_shift].white
                    }

                    for (let i = 0; i < newWordClue.word.length; i++) {
                        if (possibleDirection == "across") {
                            if (i != intersection[0]) {
                                if(i + possibleY >= 0 && i + possibleY < inputGrid.length) {
                                    // Don't place a word if there is a collision where the char isn't the same
                                    if (possibleX >= 0 && possibleX < inputGrid.length) {
                                        if(newWordClue.word[i] != inputGrid[possibleX][possibleY + i].answer) {
                                            noClash = noClash && !inputGrid[possibleX][possibleY + i].white
                                        }
                                    }

                                    // Checks for white cells above / below the word
                                    if(possibleX - 1 >= 0 && possibleX - 1 < inputGrid.length) {
                                        notAdjacent = notAdjacent && !inputGrid[possibleX - 1][possibleY + i].white
                                    }
                                    if(possibleX + 1 >= 0 && possibleX + 1 < inputGrid.length) {
                                        notAdjacent = notAdjacent && !inputGrid[possibleX + 1][possibleY + i].white
                                    }
                                }
                            }
                        }
                        else {
                            if (i != intersection[0]) {
                                if(i + possibleX >= 0 && i + possibleX < inputGrid.length) {
                                    // Don't place a word if there is a collision where the char isn't the same
                                    if (possibleY >= 0 && possibleY < inputGrid.length) {
                                        if(newWordClue.word[i] != inputGrid[possibleX + i][possibleY].answer) {
                                            noClash = noClash && !inputGrid[possibleX + i][possibleY].white
                                        }
                                    }

                                    // Test for adjacent squares
                                    if(possibleY - 1 >= 0 && possibleY - 1 < inputGrid.length) {
                                        notAdjacent = notAdjacent && !inputGrid[possibleX + i][possibleY - 1].white
                                    }
                                    if(possibleY + 1 >= 0 && possibleY + 1 < inputGrid.length) {
                                        notAdjacent = notAdjacent && !inputGrid[possibleX + i][possibleY + 1].white
                                    }
                                }
                        }
                    }
                }

                    let possiblePlacement: WordClue = {...newWordClue}

                    possiblePlacement.x = possibleX
                    possiblePlacement.y = possibleY
                    possiblePlacement.across = possibleDirection == "across"

                    if(possiblePlacement.x != null && possiblePlacement.y != null && possibleDirection != null) {
                        if(noClash && notAdjacent){
                            possiblePlacements.push({...possiblePlacement})
                        }
                    }

                }
            }
        }

        // test all the placements to make sure they don't cross over already assigned squares, 
            // or have adjacent squares that don't belong to that word
        //DEV: console.log("Possible placements for " + newWordClue.word + ": ")
        //DEV: console.log(possiblePlacements)
        return possiblePlacements
    }

    /** Tuple for word intersections */
    type WordIntersections = [wordNew: number, wordGrid: number]

    /** Helper function that returns the indices where 2 words intersect.
     * 
     * @returns { [number, number] } - indices of the words that match. [wordPlace, wordGrid]
    */
    function intersecting(wordPlace: string, wordGrid: string): WordIntersections[] {
            let intersections: WordIntersections[] = []

            for (let i = 0; i < wordPlace.length; i++) {
                for (let j = 0; j < wordGrid.length; j++) {
                    if(wordPlace[i].toUpperCase() == wordGrid[j].toUpperCase()) {
                        intersections.push([i, j])
                    }
                }
            }

        return intersections
    }


    /** Local helper function for adding a word with a placement 
     * to an existing list of words and placements,
     * ensuring a correct grid.
     * 
     * @param {WordClue[]} wordsClues - the list of words and clues without the placement information for the new word. THIS IS ALTERED IN PLACE
     * @param {WordClue} wordToPlace - the word with placement information. 
    */
    function updatePlacements(wordsClues: WordClue[], possiblePlcmnts: WordClue[], p: number): WordClue[] {
        // I don't think this is iterating over chars 
        // TODO Troubleshoot, something's wrong here

        let x = possiblePlcmnts[p].x
        let y = possiblePlcmnts[p].y

        if(possiblePlcmnts[p].x < 0 || possiblePlcmnts[p].y < 0) {
            let shiftX = Math.abs(Math.max(possiblePlcmnts[p].x, 0))
            let shiftY = Math.abs(Math.max(possiblePlcmnts[p].y, 0))
            // Shift the coordinates for the possible placements
            for(let plcmnt of possiblePlcmnts) {
                plcmnt.x += shiftX
                plcmnt.y += shiftY
            }
            // Shift coordinates for placed words
            for(let wrdcl of wordsClues) {
                if(wrdcl.x != null && wrdcl.y != null) {
                    wrdcl.x += shiftX
                    wrdcl.y += shiftY
                    // Set clue number if coordinates are the same
                    if(wrdcl.x == possiblePlcmnts[p].x && wrdcl.y == possiblePlcmnts[p].y) {
                        possiblePlcmnts[p].clueNumber = wrdcl.clueNumber
                    }
                }
            }
        }


        // Add a clue number for the placement, if it wasn't added before
        if(possiblePlcmnts[p].clueNumber == null) {

            possiblePlcmnts[p].clueNumber = clueCount + 1
            clueCount += 1
        }

        // Add the placement to the list of words
        let i = wordsClues.findIndex((word) => word.word == possiblePlcmnts[p].word)
        wordsClues[i] = possiblePlcmnts[p]


        // Add padding
        let leftmost: number, rightmost: number, topmost: number, bottommost: number

        leftmost = wordsClues[0].y
        rightmost = wordsClues[0].y
        topmost = wordsClues[0].x
        bottommost = wordsClues[0].x

        for(let wordClue of wordsClues) {
            if(wordClue.x != null && wordClue.y != null) {
                leftmost = leftmost > wordClue.y ? wordClue.y : leftmost
                topmost = topmost > wordClue.x ? wordClue.x : topmost
                rightmost = rightmost < wordClue.y ? wordClue.y : rightmost
                bottommost = bottommost < wordClue.x ? wordClue.x : bottommost

                if(wordClue.across) {
                    if(rightmost < wordClue.y + wordClue.word.length - 1) {
                        rightmost = wordClue.y + wordClue.word.length - 1
                    }
                }
                else {
                    if(bottommost < wordClue.x + wordClue.word.length - 1) {
                        bottommost = wordClue.x + wordClue.word.length - 1
                    }
                }
            }
        }

        let horizontalPadding: number = 0, verticalPadding: number = 0
        let dimension = Math.max(rightmost - leftmost + 1, bottommost - topmost + 1)

        if(rightmost - leftmost >= bottommost - topmost) {
            verticalPadding = Math.floor((dimension - (bottommost - topmost + 1)) / 2)
        }
        else {
            horizontalPadding = Math.floor((dimension - (rightmost - leftmost + 1)) / 2)
        }


        for(let wordClue of wordsClues) {
            if(wordClue.x != null && wordClue.y != null) {
                wordClue.x = wordClue.x - topmost + verticalPadding
                wordClue.y = wordClue.y - leftmost + horizontalPadding
            }
        }

        for(let plcmnt of possiblePlcmnts) {
            // Avoid adjusting a placement twice
            // (Since it was most probably passed by reference)
            if(plcmnt != possiblePlcmnts[p]) {
                plcmnt.x = plcmnt.x - topmost + verticalPadding
                plcmnt.y = plcmnt.y - leftmost + horizontalPadding
            }
        }

        return wordsClues
    }

    /** Local helper function for ranking a word to place onto the grid next.
     * This ranking strategy is independent of the grid content.
     * The wordsClues array is used
     * 
     * @param { number } wordIndex - the index of the word to be added to the grid (based off original word list)
     * @returns { number } - the rank of the word
    */
    function rankWord(wordIndex: number): number {
        // Word-level intersections rather than letter-level intersections are used.
        let rank = 0
        
        for(let i = 0; i < wordsClues.length; i++) {
            if (i != wordIndex) {
                wordLoop: for(let letter of wordsClues[wordIndex].word) {
                    // Iterate over the letters of every word
                    letterLoop: for (let letterOther of wordsClues[i].word) {
                        if (letter == letterOther) {
                            rank += 1
                            break wordLoop
                        }
                    }
                }
            }
        }
        return rank
    } 

    /** Local helper function for sorting the list of words based off of their ranking,
     * in ascending order.
     * 
     * Uses {@link wordsClues}
     * 
     * @returns { WordClue[] } - the list of words sorted by rank in ascending order
    */
    function sortWords(): WordClue[] {
        // Create an array of indices
        const indices = rankings.map((_, index) => index)
        //DEV: console.log("indices: " + indices)

        // Sort the indices based on the values in the original array
        indices.sort((a, b) => {
            if (rankings[a] < rankings[b]) return -1;
            if (rankings[a] > rankings[b]) return 1;
            return 0; // For equal values
        });
        //DEV: console.log("sorted indices: " + indices)

        rankedList = []

        for (let i = 0; i < wordsClues.length; i++) {
            rankedList[i] = wordsClues[indices[i]]
        }

        return rankedList;
    }

    /**
     * Helper functions for generating intermediate crossword grids.
     * Uses {@link bestGrid} and {@link bestWordsPlaced}
     * 
     * @param {Cell[][]} inputGrid
     * @param {WordClue[]} words
     * @returns {number} 0 if a grid was found, 1 otherwise - EDIT THIS
     */
    function generateCrosswordGrid(wordsCluesGen: WordClue[], depth: number): number {

        ///DEV: console.log("wordsCluesGen pre-generateCrosswordFromList():")
        ///DEV: console.log(wordsCluesGen)
        let inputGrid = generateCrosswordFromList(wordsCluesGen)
        //DEV: console.log("wordsCluesGen post-generateCrosswordFromList():")
        //DEV: console.log(wordsCluesGen)

        if(bestGrid != null) {
            // TODO Check if number of words and clues for inputGrid is larger than bestGrid's and if so, don't do this
            // Return immediately if inputGrid is larger than the bestGrid
            if(inputGrid.length > bestGrid.length) {
                return 1
            }
        }
        //DEV: console.log("Depth: " + depth)

        crosswordGenTimeout += 1
        if(crosswordGenTimeout == epoch) {
            throw new Error("Epoch reached")
        }

        // Limit recursion based on depth and number of possible combinations
        let wordsPlaced = nrWordsPlaced(wordsCluesGen)
        let wordsLeft = wordsCluesGen.length - nrWordsPlaced(wordsCluesGen)

        // Return if best grid is as long as the longest word
        if(wordsLeft == 0 && bestGrid != null) {
            if(bestGrid.length == wordsCluesGen.map(word => word.word.length).reduce((max, len) => Math.max(max, len), 0)) {
                return 0
            }
        }

        let wordsCluesCopy = wordsCluesGen.map(wC => ({...wC}));
        //
        // TODO Fix the issue with the 0-ranking word thing. Just exclude such words
        // Save the best grid up until this point, this supports best grid with not all words placed
        if((wordsLeft > 0 && depth - wordsPlaced > (wordsLeft * (wordsLeft - 1)) / 2) || wordsLeft == 0) {
            if(inputGrid != null) {
                return setBestGrid(inputGrid)
            }
        }

        let i = 0
        while(i < wordsCluesCopy.length && (wordsCluesCopy[i].x != null && wordsCluesCopy[i].y != null)) {
            i++
        }
        
        if(i < wordsCluesCopy.length) {
            let firstFlag = i == 0
            let possiblePlacementsCw = placeable(inputGrid, wordsCluesCopy, wordsCluesCopy[i], firstFlag)
                for(let i = 0; i < possiblePlacementsCw.length; i++) {
                    // Add word
                    updatePlacements(wordsCluesCopy, possiblePlacementsCw, i)
                    wordsCluesCopy = setClueNumbers(wordsCluesCopy)
                    // Recurse
                    generateCrosswordGrid(wordsCluesCopy, depth + 1)
                    // Remove placement
                    removePlacement(wordsCluesCopy, possiblePlacementsCw[i])
                }
                // Move the word to the end of the list, generate again at this level
                moveWordToEnd(wordsCluesCopy, wordsCluesCopy[i])
                return generateCrosswordGrid(wordsCluesCopy, depth + 1)
        }
        // Why doesn't this work if wordsCluesGen is used instead of wordsCluesCopy?
        else {
            return setBestGrid(inputGrid)
        }

        function setBestGrid(grid: Cell[][]): number {
           if(bestGrid == null) {
                bestGrid = grid
                // DEV: console.log("wordsCluesCopy:")
                // DEV: console.log(wordsCluesCopy)
                // DEV: console.log("wordsCluesGen:")
                // DEV: console.log(wordsCluesGen)
                bestWordsPlaced = wordsCluesCopy
                DEV: console.log("New best grid:")
                DEV: console.log(bestGrid)
                return 0
            }
            else if(bestGrid.length > grid.length && grid.length != 0) {
                if(nrWordsPlaced(bestWordsPlaced) <= nrWordsPlaced(wordsCluesCopy)) {
                    bestGrid = grid
                    bestWordsPlaced = wordsCluesCopy
                    DEV: console.log("New best grid:")
                    DEV: console.log(bestGrid)
                    return 0
                }
                else {
                    return 1
                }
            }
            //DEV: console.log("New grid but NOT best:")
            //DEV: console.log(inputGrid)
        }

        /**
         * Returns the number of words placed
         * @param wordList 
         * @returns {number} Number of words placed
         */
        function nrWordsPlaced(wordList: WordClue[]): number {
            let nrPlacedWords = 0
            for(let wordClue of wordList) {
                nrPlacedWords += wordClue.x != null && !isNaN(wordClue.x)
                    && wordClue.y != null && !isNaN(wordClue.y) ? 1 : 0
            }
            return nrPlacedWords
        }

        function moveWordToEnd(wordList: WordClue[], moveW: WordClue) {
            wordList.push(deleteElement(wordList, moveW))
        }

        function removePlacement(wordList: WordClue[], placedW: WordClue) {
            let i = wordList.findIndex((wordL) => wordL.word == placedW.word)
            wordList[i] = {...placedW}
            wordList[i].clueNumber = null
            wordList[i].across = null
            wordList[i].x = null
            wordList[i].y = null
        }

        function setClueNumbers(wordList: WordClue[]): WordClue[]{
            //DEV: console.log("Setting clue numbers")
            //DEV: console.log("wordList beffore:")
            //DEV: console.log(wordList)
            let wordListCopy = wordList.map(wC => ({...wC}));
            wordListCopy.sort((a, b) => a.y - b.y)
            wordListCopy.sort((a, b) => a.x - b.x)

            let clueNr = 1
            for(let i = 0; i < wordListCopy.length; i++) {
                if(i != 0 && wordListCopy[i].x == wordListCopy[i-1].x && wordListCopy[i].y == wordListCopy[i-1].y && wordListCopy[i].x != null) {
                    wordListCopy[i].clueNumber = wordListCopy[i-1].clueNumber
                }
                else {
                    wordListCopy[i].clueNumber = clueNr
                    clueNr += 1
                }
            }

            for(let wordClCpy of wordListCopy) {
                for(let wordCl of wordList) {
                    if(wordClCpy.word == wordCl.word) {
                        wordCl.clueNumber = wordClCpy.clueNumber
                    }
                }
            }

            //DEV: console.log("wordList after:")
            //DEV: console.log(wordList)
            return wordList
        }
    }
}

    /**
     * Generates crossword puzzle based off of a list of words with their given placements.
     * 
     * @param {WordClue[]} wordsClues The list of words and clues from which to generate the crossword
     * @returns {Cell[][]} The crossword object
     */
export function generateCrosswordFromList(wordsClues: WordClue[]): Cell[][] {

    // Initialization
    //DEV: console.log("Crossword generation from list triggered")
    if(wordsClues == null) {
        let grid: Cell[][] = []

            for(let i = 0; i < 8; i++) {
                grid[i] = []
                for (let j = 0; j < 8; j++) {
                    grid[i][j] = defaultCell()
                }
            }
        return grid
    }

    let leftmost: number, rightmost: number, topmost: number, bottommost: number

    leftmost = wordsClues[0].y
    rightmost = wordsClues[0].y
    topmost = wordsClues[0].x
    bottommost = wordsClues[0].x

    // Shifting words and clues
    for(let wordClue of wordsClues) {
        if(wordClue.x != null && wordClue.y != null) {
            leftmost = leftmost > wordClue.y ? wordClue.y : leftmost
            topmost = topmost > wordClue.x ? wordClue.x : topmost

            if(wordClue.across) {
                if(rightmost < wordClue.y + wordClue.word.length - 1) {
                    rightmost = wordClue.y + wordClue.word.length - 1
                }
                if(bottommost < wordClue.x) {
                    bottommost = wordClue.x
                }
            }
            else {
                if(rightmost < wordClue.y) {
                    rightmost = wordClue.y
                }
                if(bottommost < wordClue.x + wordClue.word.length - 1) {
                    bottommost = wordClue.x + wordClue.word.length - 1
                }
            }
        }
    }

    let dimension = Math.max(rightmost - leftmost + 2, bottommost - topmost + 2)
    let grid: Cell[][] = []

    for(let i = 0; i < dimension; i++) {
        grid[i] = []
        for (let j = 0; j < dimension; j++) {
            grid[i][j] = defaultCell()
        }
    }

    for(let wordClue of wordsClues) {
        if(wordClue.x != null && wordClue.y != null && !isNaN(wordClue.x) && !isNaN(wordClue.y)) {
            if(wordClue.clueNumber != null) {
                grid[wordClue.x][wordClue.y].number = wordClue.clueNumber
            }

            for(let c = 0; c < wordClue.word.length; c++) {

                let i = 0, j = 0

                switch(wordClue.across) {
                    case true: 
                        j = c
                        break
                    default:
                        i = c
                        break
                }
                grid[wordClue.x + i ][wordClue.y + j].answer = wordClue.word[c].toUpperCase()
                grid[wordClue.x + i ][wordClue.y + j].white = true

                let direction = wordClue.across ? "across" : "down"
                if(grid[wordClue.x + i ][wordClue.y + j].direction != null) {
                    let direction_opposite = !wordClue.across ? "across" : "down"
                    if(grid[wordClue.x + i ][wordClue.y + j].direction == direction_opposite) {
                        grid[wordClue.x + i ][wordClue.y + j].direction = "both"
                    }
                    else {
                        grid[wordClue.x + i ][wordClue.y + j].direction = direction
                    }
                }
                else {
                        grid[wordClue.x + i ][wordClue.y + j].direction = direction
                }
            }
        }
    }

    return grid
}
