let cells = [];
let w = 4;
let cols, rows;
let ruleset = [];

let seed;
let hueOffset;
let hueStep;
let morphFreq;
let morphRange;

function setup() {
    createCanvas(window.innerWidth, window.innerHeight);

    pixelDensity(2);

    colorMode(HSB, 360, 100, 100);

    cols = floor(window.innerWidth / w);
    rows = floor(window.innerHeight / w);

    newSeed(getSeedFromURL());
    randomizeParams();

    cells = new Array(cols).fill(0);
    cells[floor(cols / 2)] = 1;

    generate();
    noLoop();
}

function sanitizeSeed(raw) {
    if (raw === null || raw === undefined) return undefined;
    const str = String(raw).trim();
    if (!/^\d{1,15}$/.test(str)) return undefined;
    const value = Number(str);
    if (!Number.isSafeInteger(value)) return undefined;
    return value;
}

function getSeedFromURL() {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("seed");
    if (raw === null) return undefined;
    const value = sanitizeSeed(raw);
    if (value === undefined) console.log("Ignoring invalid seed param:", raw);
    return value;
}

function updateURLSeed(value) {
    const url = new URL(window.location.href);
    url.searchParams.set("seed", String(value));
    window.history.replaceState({}, "", url);
}

function newSeed(forcedSeed) {
    seed = (forcedSeed !== undefined) ? forcedSeed : floor(random(1000000));
    randomSeed(seed);
    console.log("seed:", seed);
    updateURLSeed(seed);
}

function randomizeParams() {
    hueOffset = random(360);
    hueStep = random(0, 90);
    morphFreq = random(0.01, 0.25);
    morphRange = random(0, 255);
}

function calculateRuleset(ruleNum) {
    const binary = ruleNum.toString(2).padStart(8, "0");
    return binary.split("").reverse().map(x => parseInt(x));
}

function generate() {
    background("#0a0a0a");
    cells = new Array(cols).fill(0);
    cells[floor(cols / 2)] = 1;

    for (let gen = 0; gen < rows; gen++) {

        let morph = map(sin(gen * morphFreq), -1, 1, 0, morphRange);
        ruleset = calculateRuleset(floor(morph));

        for (let i = 0; i < cols; i++) {
            if (cells[i] > 0) {
                let type = cells[i];
                let h, s, b;

                if (type === 9) {
                    h = 0; s = 0; b = 100;
                } else if (type === 1) {
                    h = (hueOffset) % 360;
                    s = 80; b = 100;
                } else {
                    h = (hueOffset + type * hueStep) % 360;
                    s = 85;
                    b = 95;
                }

                fill(h, s, b);
                noStroke();
                rect(i * w, gen * w, w, w);
            }
        }

        const nextCells = new Array(cols).fill(0);
        for (let i = 0; i < cols; i++) {
            const left = cells[(i - 1 + cols) % cols] > 0 ? 1 : 0;
            const center = cells[i] > 0 ? 1 : 0;
            const right = cells[(i + 1) % cols] > 0 ? 1 : 0;

            const index = left * 4 + center * 2 + right;

            if (random(1) < 0.025) {
                if (floor(random(2)) === 1) {
                    nextCells[i] = 9;
                } else {
                    nextCells[i] = 0;
                }
            } else {
                if (ruleset[index] === 1) {
                    nextCells[i] = index + 1;
                } else {
                    nextCells[i] = 0;
                }
            }
        }
        cells = nextCells;
    }
}

function mousePressed() {
    newSeed();
    randomizeParams();
    generate();
}

function keyTyped() {
    if (key === "s" || key === "S") {
        saveCanvas("cellular-automata", "png");
    }

    if (key === "r" || key === "R") {
        const input = window.prompt("Enter seed:");
        if (input !== null && input.trim() !== "") {
            const parsed = sanitizeSeed(input);
            if (parsed !== undefined) {
                newSeed(parsed);
                randomizeParams();
                generate();
            } else {
                console.log("Invalid seed:", input);
            }
        }
    }
}
