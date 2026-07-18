let size;
let puzzle;
let puzzleString;
let activeColor;
let iconX;
let iconCat;
let iconPencil;
let gameboard;
let steps;
let curStep;
let exps;
let guesses;
let invalid;

window.addEventListener("DOMContentLoaded", () => {
    iconX = document.getElementById("x-icon");
    iconCat = document.getElementById("cat-icon");
    iconPencil = document.getElementById("pencil-icon");
    gameboard = document.getElementById("gameboard");
    activeColor = "l"

    try {
        puzzleString = window.atob(window.location.hash.substring(1));
    }
    catch {
        puzzleString = "";
    }

    if (puzzleString === "") {
        puzzleString = activeColor.repeat(25);
    }

    refreshFromString();
    attachEvents();
});

function attachEvents() {
    document.getElementById("size-smaller").addEventListener("click", () =>
    {
        size--;
        let exp = new RegExp("(.{" + size + "}).", "g");
        puzzleString = puzzleString.replace(exp, "$1").substring(0, size*size);
        refreshFromString();
    });

    document.getElementById("size-larger").addEventListener("click", () =>
    {
        size++;
        let exp = new RegExp("(.{" + (size-1) + "})", "g");
        puzzleString = puzzleString.replace(exp, "$1" + activeColor) + activeColor.repeat(size);
        refreshFromString();
    });

    document.getElementById("step-prev").addEventListener("click", () =>
    {
        curStep--;
        if (curStep < 0) {
            curStep = 0;
        }
        viewStep();
    });

    document.getElementById("step-next").addEventListener("click", () =>
    {
        curStep++;
        if (curStep >= steps.length) {
            curStep = steps.length - 1;
        }
        viewStep();
    });

    document.getElementById("solve-go").addEventListener("click", () => {
        document.getElementById("solve-row").classList.add("hidden");
        document.getElementById("step-row").classList.remove("hidden");
        document.getElementById("step-exp").classList.remove("hidden");
        steps = [];
        exp = [];
        guesses = [];
        recordStep();
        exp.push("Original puzzle.");
        solve();
    });

    Array.prototype.forEach.call(document.getElementsByClassName("cell-painter"), (elm) => {
        elm.addEventListener("click", () => {
            Array.prototype.forEach.call(document.getElementsByClassName("cell-painter"), (elm) => elm.innerHTML = "");
            let icon = mapIcon("e");
            icon.classList.remove("hidden");
            elm.appendChild(icon);
            activeColor = elm.dataset.color;
        });
    });
}

function refreshFromString() {
    document.getElementById("solve-row").classList.remove("hidden");
    document.getElementById("step-row").classList.add("hidden");
    document.getElementById("step-exp").classList.add("hidden");

    window.location.hash = window.btoa(puzzleString);
    createPuzzleFromString();
    document.getElementById("size-display").innerHTML = size;

    fillPuzzleBoard(puzzle);
}

class Cell {
    color;
    icon;
    highlight;
    pencil;
    row;
    col;
    i;
}

function createPuzzleFromString() {
    size = Math.floor(Math.sqrt(puzzleString.length));
    puzzle = puzzleString.split("").map((color, i) => {
        let cell = new Cell();
        cell.color = color;
        cell.icon = "o";
        cell.highlight = false;
        cell.pencil = false;
        cell.row = Math.floor(i / size);
        cell.col = i % size;
        cell.i = i;

        return cell;
    });
}

function createStringFromPuzzle() {
    puzzleString = puzzle.map((cell) => cell.color).join("");
}

function fillPuzzleBoard(puzzle) {
    gameboard.innerHTML = "";

    for (let i = 0; i < size; i++) {
        let row = document.createElement("div");
        row.classList.add("gameboard-row");

        for (let j = 0; j < size; j++) {
            let cellObj = puzzle[i*size + j];

            let cell = document.createElement("div");
            cell.classList.add("gameboard-cell", "editable-cell", mapColor(cellObj.color));

            cell.addEventListener("click", () => {
                if (activeColor) {
                    puzzleString = puzzleString.substring(0, i*size + j) + activeColor + puzzleString.substring(i*size + j + 1);
                    refreshFromString();
                }
            });

            let icon = mapIcon(cellObj.icon);
            icon.classList.remove("hidden");
            
            if (cellObj.highlight) {
                icon.classList.add("icon-highlight");
            }

            cell.appendChild(icon);

            row.appendChild(cell);
        }

        gameboard.appendChild(row);
    }
}

function viewStep() {
    fillPuzzleBoard(steps[curStep]);
    document.getElementById("step-display").innerHTML = "Step " + curStep;
    document.getElementById("step-exp").innerHTML = exp[curStep];
}

function solve() {
    invalid = false;

    while (puzzle.filter((cell) => cell.icon === "c").length < size) {
        clearHighlights();

        let onePerRow = ruleOnePer("row");
        if (onePerRow !== -1) {
            placeCat(onePerRow);
            recordStep();
            continue;
        }

        let onePerCol = ruleOnePer("col");
        if (onePerCol !== -1) {
            placeCat(onePerCol);
            recordStep();
            continue;
        }

        let onePerColor = ruleOnePer("color");
        if (onePerColor !== -1) {
            placeCat(onePerColor);
            recordStep();
            continue;
        }

        let overlap = colorOverlap();
        if (overlap !== -1) {
            overlap.forEach((cell) => {
                puzzle[cell.i].icon = "x";
                puzzle[cell.i].highlight = true;
            });
            recordStep();
            continue;
        }

        let colorRow = colorInNProp("row");
        if (colorRow !== -1) {
            colorRow.forEach((cell) => {
                puzzle[cell.i].icon = "x";
                puzzle[cell.i].highlight = true;
            });
            recordStep();
            continue;
        }

        let revColorRow = propInNColor("row");
        if (revColorRow !== -1) {
            revColorRow.forEach((cell) => {
                puzzle[cell.i].icon = "x";
                puzzle[cell.i].highlight = true;
            });
            recordStep();
            continue;
        }

        let colorCol = colorInNProp("col");
        if (colorCol !== -1) {
            colorCol.forEach((cell) => {
                puzzle[cell.i].icon = "x";
                puzzle[cell.i].highlight = true;
            });
            recordStep();
            continue;
        }

        let revColorCol = propInNColor("col");
        if (revColorCol !== -1) {
            revColorCol.forEach((cell) => {
                puzzle[cell.i].icon = "x";
                puzzle[cell.i].highlight = true;
            });
            recordStep();
            continue;
        }

        if (puzzle.filter((cell) => cell.icon === "o").length === 0)
        {
            if (guesses.length === 0) {
                invalid = true;
                exp.push("Puzzle is unsolvable. Please check that it's entered correctly.");
                recordStep();
                break;
            }

            puzzle = guesses.pop();
            exp.push("Puzzle is now unsolvable, so the previous guess must have been incorrect.");
            let oldGuess = makeGuess();

            puzzle[oldGuess].icon = "x";
            puzzle[oldGuess].highlight = true;
            recordStep();
            continue;
        }

        exp.push("No more spaces can be eliminated by rule. Make a guess to test.")
        guesses.push(JSON.parse(JSON.stringify(puzzle)));
        placeCat(makeGuess());
        recordStep();
    }

    if (!invalid) {
        clearHighlights();
        exp.push("Puzzle is solved!");
        recordStep();
    }

    curStep = Math.min(1, steps.length);
    viewStep();
}

function recordStep() {
    steps.push(JSON.parse(JSON.stringify(puzzle)));
}

function clearHighlights() {
    puzzle.forEach((cell) => cell.highlight = false);
}

function placeCat(i) {
    puzzle[i].icon = 'c';
    puzzle[i].highlight = true;

    puzzle.filter((cell) => 
        (
            cell.row === puzzle[i].row || 
            cell.col === puzzle[i].col || 
            cell.color === puzzle[i].color || 
            (Math.abs(cell.col - puzzle[i].col) <= 1 && Math.abs(cell.row - puzzle[i].row) <= 1)
        ) && cell.icon === "o").forEach((cell => {
            cell.icon = "x";
            cell.highlight = true;
        }));
}

function makeGuess() {
    let blanks = puzzle.filter((cell) => cell.icon === "o");
    let bestGuess;
    let bestGuessLength = size;

    function bestGuessForProp(property) {
        let cells = [...new Set(blanks.map((cell) => cell[property]))];
        
        for (let c = 0; c < cells.length; c++) {
            let matched = blanks.filter((cell) => cell[property] === cells[c]);

            if (matched.length < bestGuessLength) {
                bestGuess = matched[0];
                bestGuessLength = matched.length;
            }
        }

        return [bestGuess, bestGuessLength];
    }

    bestGuessForProp("color");
    bestGuessForProp("col");
    bestGuessForProp("row");

    return bestGuess.i;
}

function colorOverlap() {
    let blanks = puzzle.filter((cell) => cell.icon === "o");
    let colors = [...new Set(blanks.map((cell) => cell.color))];
    let final = [];
    let finalColor;

    for (let i = 0; i < colors.length; i++) {
        let cells = blanks.filter((cell) => cell.color === colors[i]);

        let overlap = blanks.filter((cell) =>
        (
            cell.row === cells[0].row || 
            cell.col === cells[0].col || 
            (Math.abs(cell.col - cells[0].col) <= 1 && Math.abs(cell.row - cells[0].row) <= 1)
        ) && cell.i !== cells[0].i);

        for (let j = 1; j < cells.length; j++) {
            overlap = overlap.filter((cell) =>
            (
                cell.row === cells[j].row || 
                cell.col === cells[j].col || 
                (Math.abs(cell.col - cells[j].col) <= 1 && Math.abs(cell.row - cells[j].row) <= 1)
            ) && cell.i !== cells[j].i);

            if (overlap.length === 0) {
                break;
            }
        }

        if (overlap.length > final.length) {
            final = overlap;
            finalColor = colors[i];
        }
    }

    if (final.length === 0) {
        return -1;
    }

    exp.push("A cat placed in any of the remaining " + translateColor(finalColor) + " squares would rule out these squares.")
    return final;
}

function getCombinations(input, k) {
    if (k > input.length) {
        return [];
    }

    let subsets = [];

    let s = new Array(k);

    function getSubset(inp, subset) {
        let set = new Array(subset.length);

        for (let i = 0; i < subset.length; i++) {
            set[i] = inp[subset[i]];
        }

        return set;
    }

    for (let i = 0; (s[i] = i) < k - 1; i++);  
    subsets.push(getSubset(input, s));

    while (true) {
        let i;
        for (i = k - 1; i >= 0 && s[i] == input.length - k + i; i--); 
        if (i < 0) {
            break;
        }

        s[i]++;
        for (++i; i < k; i++) {
            s[i] = s[i - 1] + 1; 
        }
        subsets.push(getSubset(input, s));
    }

    return subsets;
}

function colorInNProp(property) {
    let blanks = puzzle.filter((cell) => cell.icon === "o");
    let colors = [...new Set(blanks.map((cell) => cell.color))];
    for (let intSize = 1; intSize < size; intSize++) {
        let combinations = getCombinations(colors, intSize);
        for (let c = 0; c < combinations.length; c++) {
            let props = [...new Set(blanks.filter((cell) => combinations[c].includes(cell.color)).map((cell) => cell[property]))]
            if (props.length <= intSize) {
                let elim = blanks.filter((cell) => !combinations[c].includes(cell.color) && props.includes(cell[property]));
                if (elim.length > 0) {
                    exp.push("All the color(s) " + combinations[c].map(translateColor).join(", ") + " are within " + intSize + " " + translateProperty(property) + "(s).");
                    return elim;
                }
            }
        }
    }

    return -1;
}

function propInNColor(property) {
    let blanks = puzzle.filter((cell) => cell.icon === "o");
    let props = [...new Set(blanks.map((cell) => cell[property]))];
    for (let intSize = 1; intSize < size; intSize++) {
        let combinations = getCombinations(props, intSize);
        for (let c = 0; c < combinations.length; c++) {
            let colors = [...new Set(blanks.filter((cell) => combinations[c].includes(cell[property])).map((cell) => cell.color))]
            if (colors.length <= intSize) {
                let elim = blanks.filter((cell) => !combinations[c].includes(cell[property]) && colors.includes(cell.color));
                if (elim.length > 0) {
                    exp.push("All the " + translateProperty(property) + "(s) " + combinations[c].map((n) => n+1).join(", ") + " contain only " + intsize + " different color(s).")
                    return elim;
                }
            }
        }
    }

    return -1;
}

function ruleOnePer(property) {
    let blanks = puzzle.filter((cell) => cell.icon === "o");
    let values = [...new Set(blanks.map((cell) => cell[property]))];
    for (let i = 0; i < values.length; i++) {
        let cells = blanks.filter((cell) => cell[property] === values[i]);
        if (cells.length === 1) {
            exp.push("Apply rule: Only a single cat is allowed per " + translateProperty(property) + ".");
            return cells[0].i;
        }
    }

    return -1;
}

function translateProperty(property) {
    switch (property) {
        case "col":
            return "column";
        default:
            return property;
    }
}

function translateColor(color) {
    switch (color) {
        case "l":
            return "lime";
        case "g":
            return "green";
        case "p":
            return "purple";
        case "b":
            return "brown";
        case "o":
            return "orange";
        case "k":
            return "sky";
        case "u":
            return "blue";
        case "i":
            return "pink";
        case "r":
            return "red";
        case "y":
            return "yellow";
        case "c":
            return "ochre";
        default:
            return "";
    }
}

function mapIcon(icon) {
    switch (icon) {
        case "x":
            return iconX.cloneNode(true);
        case "c":
            return iconCat.cloneNode(true);
        case "e":
            return iconPencil.cloneNode(true);
        default:
            return document.createElement("svg");
    }
}

function mapColor(color) {
    switch (color) {
        case "l":
            return "cell-lime";
        case "g":
            return "cell-green";
        case "p":
            return "cell-purple";
        case "b":
            return "cell-brown";
        case "o":
            return "cell-orange";
        case "k":
            return "cell-sky";
        case "u":
            return "cell-blue";
        case "i":
            return "cell-pink";
        case "r":
            return "cell-red";
        case "y":
            return "cell-yellow";
        case "c":
            return "cell-ochre";
        default:
            return "";
    }
}