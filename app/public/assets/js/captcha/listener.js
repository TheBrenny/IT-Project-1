// listen to events that are occuring on the page and collate them into some sort of minimal javascript.
// keep only a certain amount of events (ie 100 events total)


// ===== Config
const submitURL = document.location.origin + "/captcha";
const mousePointCount = 200;
const submitMillis = 10000; // 10 seconds
const fetchMethod = "POST";
let verbose = false;


// ===== Global Vars (scoped to script)
const keysDown = {}; // stores the current keys that are down.
const dataPoints = { // stores the data to push to the server
    mouse: [], // stores the mouse movements
    mousePress: [], // stores the mouse presses
    keys: [], // stores the key presses
    focus: [], // stores the focus events
};
const keyCache = {}; // store a cache of the keys presses so we can modify their attributes
const mouseCache = {}; // store a cache of the mouse presses so we can modify their attributes
const focusCache = {}; // store a cache of the focus events so we can modify their attributes
let uniqueNumber = 0; // the number we use to generate unique names 
let submitInterval = null; // stores the response from setInterval so we have the chance to cancel the interval


// ===== Capturing methods!
function mouseMoveHandler(e) {
    let mouseMove = {
        x: e.clientX,
        y: e.clientY,
        time: Math.floor(e.timeStamp),
    };

    // push to the submission object, but keep the size of the array slim
    dataPoints.mouse.push(mouseMove);
    dataPoints.mouse = dataPoints.mouse.splice(-mousePointCount);
}

function mouseDownUpHandler(e) {
    if (e.type === "mousedown") {
        //cache the mouse press
        mouseCache[e.button] = {
            button: e.button,
            timeDown: Math.floor(e.timeStamp),
            timeUp: null,
            meta: {
                shift: e.shiftKey,
                ctrl: e.ctrlKey,
                alt: e.altKey,
                target: getUidOfTarget(e.target),
            }
        };
    } else { // e.type === "mouseup"
        // update the cache
        mouseCache[e.button].timeUp = Math.floor(e.timeStamp);
        dataPoints.mousePress.push(mouseCache[e.button]);

        //de-reference the cache
        mouseCache[e.button] = null;
    }
}

function keyOnOffHandler(e) {
    if (e.repeat) return; // ignore key held

    if (e.type === "keydown") {
        // cache the keypress
        keyCache[e.key] = {
            key: e.key,
            timeDown: Math.floor(e.timeStamp),
            timeUp: null,
            meta: {
                shift: e.shiftKey,
                ctrl: e.ctrlKey,
                alt: e.altKey,
                target: getUidOfTarget(e.target),
            }
        };
    } else { // e.type === "keyup"
        // update the keypress and prep for submission
        keyCache[e.key].timeUp = Math.floor(e.timeStamp);
        dataPoints.keys.push(keyCache[e.key]);

        // de-reference from cache
        keyCache[e.key] = null;
    }
}

function focusHandler(e) {
    let uid = getUidOfTarget(e.target);

    if (e.type === "focus") {
        focusCache[uid] = {
            id: uid,
            type: e.type,
            focusTime: Math.floor(e.timeStamp),
            blurTime: null
        };
    } else { // e.type === "blur"
        // prep for submission
        focusCache[uid].blurTime = Math.floor(e.timeStamp);
        dataPoints.focus.push(focusCache[uid]);

        // de-reference from cache
        focusCache[uid] = null;
    }

    dataPoints.focus.push();
}

function submitData() { // send the data to the server
    let out = JSON.stringify(dataPoints);
    dataPoints.mouse = [];
    dataPoints.mousePress = [];
    dataPoints.keys = [];
    dataPoints.focus = [];

    fetch(submitURL, {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        method: fetchMethod,
        body: out
    });
    // console.log(`fetch("${submitURL}", {\n\tmethod: "${fetchMethod}",\n\tbody: ${out}\n})`);
}


// Some util methods
function getUidOfTarget(target) {
    return target.id || target.name || (target.id = getNextID(target));
}

function getNextID(target) {
    return target.localName + "_" + uniqueNumber++;
}


// set up handlers
document.onmousemove = mouseMoveHandler;
document.onmousedown = mouseDownUpHandler;
document.onmouseup = mouseDownUpHandler;
document.onkeydown = keyOnOffHandler;
document.onkeyup = keyOnOffHandler;
document.querySelectorAll(`input:not([type="submit"]), textarea`).forEach(el => ((el.onfocus = focusHandler), (el.onblur = focusHandler)));

// Start the submitter intervals
submitInterval = setInterval(submitData, submitMillis);