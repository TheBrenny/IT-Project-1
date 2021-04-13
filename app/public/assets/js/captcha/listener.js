// listen to events that are occuring on the page and collate them into some sort of minimal javascript.
// keep only a certain amount of events (ie 100 events total)


// ===== Config
const submitURL = "";
const dataPointCount = 200;
const captureMillis = 50;
const submitMillis = (dataPointCount * captureMillis) * 1.2; // multiply by 1.2 to save from overlaps
let verbose = false;


// ===== Global Vars (scoped to script)
const mousePosition = { // stores the current mouse position
    x: 0,
    y: 0
};
const keysDown = {}; // stores the current keys that are down.
const dataPoints = { // stores the data to push to the server
    mouse: [], // stores the {x, y} coordinates of the mouse
    keys: [], // stores the {key, time} object of key presses
    focus: [], // stores the { } object of key presses
};
const startTime = new Date(); // the start time of this app
let uniqueNumber = 0; // the number we use to generate unique names 
let captureInterval = null; // stores the response from setInterval so we have the chance to cancel the interval
let submitInterval = null; // stores the response from setInterval so we have the chance to cancel the interval


// ===== Global Vars (scoped to script)
function mouseMoveHandler(e) {
    mousePosition.x = e.clientX;
    mousePosition.y = e.clientY;
}

function keyOnOffHandler(e) {
    if (e.repeat) return; // ignore key held

    dataPoints.keys.push({
        key: e.key,
        type: e.type,
        time: (new Date() - startTime),
        meta: {
            shift: e.shiftKey,
            ctrl: e.ctrlKey,
            alt: e.altKey,
            composing: e.isComposing,
            target: e.currentTarget
        }
    });

    if (verbose) console.log(e);
}

function focusHandler(e) {
    dataPoints.focus.push({
        id: e.target.id || e.target.name || (e.target.id = getNextID(e.target)),
        type: e.type,
        time: (new Date() - startTime)
    });
    console.log(e);
}

function captureData() {
    dataPoints.mouse.push(Object.assign({}, mousePosition));
    dataPoints.mouse = dataPoints.mouse.splice(-dataPointCount);

    if (verbose) console.log(dataPoints.mouse[0].x + "," + dataPoints.mouse[0].y + " | " + dataPoints.mouse[dataPoints.mouse.length - 1].x + "," + dataPoints.mouse[dataPoints.mouse.length - 1].y);
}

function submitData() {
    // this will be used to send the captured data to the server for processing and determination
    console.log(dataPoints);
}

function getNextID(target) {
    return target.localName + "_" + uniqueNumber++;
}

document.onmousemove = mouseMoveHandler;
document.onkeydown = keyOnOffHandler;
document.onkeyup = keyOnOffHandler;
document.querySelectorAll(`input:not([type="submit"]), textarea`).forEach(el => ((el.onfocus = focusHandler), (el.onblur = focusHandler)));

// Start the capturer and submitter on intervals
captureInterval = setInterval(captureData, captureMillis);
submitInterval = setInterval(submitData, submitMillis);