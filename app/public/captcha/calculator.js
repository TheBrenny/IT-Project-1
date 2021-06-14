/**
 * This method partitions all the events into an array of "connected events".
 * That means each sub array is considered a group of events that relate to one
 * another. Ie, if the mouse moves to a text box and clicks and the user starts
 * typing, then there are three separate event partitions: the mouse movement,
 * the mouse press, and the key presses.
 * 
 * @param {Object} obj All the datapoints in an object with the keys "mouse",
 *                  "mousePress", "keys", and "focus".
 * @param {Number} maxEventGap A number indicating the maximum time between two
 *                  events before the subsequent event is considered a new
 *                  partition.
 * @returns {Array} An array of arrays with related events.
 */
function deriveDataPoints(obj, maxEventGap) {
    let allEvents = [];

    // Take the values that we care about from the events received
    let arr = [];
    for (let key of Object.keys(obj)) {
        arr = obj[key];
        switch (key) {
            case "mouse":
                // Mouse Coordinates
                allEvents = allEvents.concat(arr.map(e => Object.assign({
                    x: e.x,
                    y: e.y,
                    time: e.time,
                    type: "mouse"
                })));
                break;

            case "mousePress":
                // Mouse Press Coordinates
                allEvents = allEvents.concat(arr.map((e, i) => Object.assign({
                    x: i,
                    y: e.timeUp - e.timeDown,
                    time: e.timeDown,
                    type: "mousePress"
                })));
                break;

            case "keys":
                // Key Press length
                allEvents = allEvents.concat(arr.map((e, i) => Object.assign({
                    x: i,
                    y: e.timeUp - e.timeDown,
                    time: e.timeDown,
                    type: "keyPress"
                })));
                // Key Press gap timing
                allEvents = allEvents.concat(arr.slice(1).map((e, i) => Object.assign({ // jshint ignore:line
                    x: i,
                    y: arr[i + 1].timeDown - arr[i].timeUp, // this gives us the timing gap between two key presses
                    time: e.timeDown,
                    type: "skip"
                })));
                break;

            case "focus":
                // Focus Timing
                allEvents = allEvents.concat(arr.map((e, i) => Object.assign({
                    x: i,
                    y: e.blurTime - e.focusTime,
                    time: e.focusTime,
                    type: "focus"
                })));
                // Blur Timing -- Do we actually need this?
                // allEvents.concat(arr.map((e, i) => Object.assign({
                //     x: i,
                //     y: e.blurTime - e.focusTime,
                //     time: e.blurTime,
                //     type: "focus"
                // })));
                break;
        }
    }

    // Sort the events based on time
    allEvents.sort((a, b) => a.time - b.time);

    // Partition the events based on type and gaps in time
    let ret = [];
    let sub = [];
    let currentTime = 0;
    let currentType = "skip";
    let currentEvent = {};
    for (let i = 0; i < allEvents.length; i++) {
        currentEvent = allEvents[i];
        if (currentEvent.type === "skip") continue; // skip the skipables

        if (currentEvent.type !== currentType) {
            if (sub.length > 0) ret.push(sub);
            sub = [currentEvent];
        } else if (currentTime - currentEvent.time >= maxEventGap) {
            if (sub.length > 0) ret.push(sub);
            sub = [currentEvent];
        } else {
            sub.push(currentEvent);
        }

        currentType = currentEvent.type;
        currentTime = currentEvent.time;
    }
    if (sub.length > 0) ret.push(sub); // add the last sub array

    // Return the ret array which has partitioned events!
    return ret;
}

//This function is to determine bot by using correlation coeffient
//calculate Correlation coefficient(the trend of line)
//r = 1(stright line up ),-1(straight line down),0 (no slop,spread)
function getRSquared(input) {
    let i = 0; // save memory

    // calculate the average x and y coordinates
    let averageX = 0;
    let averageY = 0;
    for (i = 0; i < input.length; i++) {
        averageX += input[i].x;
        averageY += input[i].y;
    }
    averageX /= input.length; //calculate the mean of x
    averageY /= input.length; //calculate the mean of y

    // calculate sx and sy
    let sx = 0;
    let sy = 0;
    for (i = 0; i < input.length; i++) {
        sx += Math.pow(input[i].x - averageX, 2);
        sy += Math.pow(input[i].y - averageY, 2);
    }
    sx = Math.sqrt(sx / (input.length - 1));
    sy = Math.sqrt(sy / (input.length - 1));

    //calculate (x-avgx) * (y-avgy)
    let xy = 0;
    for (i = 0; i < input.length; i++) {
        xy += ((input[i].x - averageX) * (input[i].y - averageY));
    }

    //devide the (xy) by sx * sy
    let CC = (xy / (sx * sy)) / (input.length - 1); //the correlation of coefficient
    if ((sx * sy) == 0) CC = 1;

    CC = Math.pow(CC, 2);

    return CC;
}

//Efficiency is defined as the ratio of displacment devided by distance.
//the straight line movement has the ratio closed to 1, while the curve line(like human) has lower efficiency ratio 
//Distance^2 = (x1 - x2)^2 -(y1-y2)^2
function getEfficiency(input) {
    let first = input[0]; //first point(x,y)
    let last = input[input.length - 1]; //last point (x,y)

    //calculate displacement, distance and efficiency
    let displacement = Math.sqrt(Math.pow((first.x - last.x), 2) + Math.pow((first.y - last.y), 2));
    let distance = Math.abs(first.x - last.x) + Math.abs(first.y - last.y);
    let efficiency = displacement / distance;

    return efficiency;
}

function getEfficiency(input) {
    let first = input[0]; //first point(x,y)
    let last = input[input.length - 1]; //last point (x,y)

    //calculate displacement, distance and efficiency
    let displacement = getDistance(first, last);
    let distance = 0;
    for (let i = 1; i < input.length; i++) distance += getDistance(input[i], input[i - 1]);
    let efficiency = displacement / distance;

    return efficiency;
}

//For keystrokes calculation taking time 
//{x,y} = x is the key, y is time of taking to press keys
//use (N-1) for the process of computing standard deviation 
//If the standard deviation is 0. We can determine it is a bot
function getDeviation(input) {
    let sum = 0;

    //calculate avg y
    let avgY = 0;
    for (i = 0; i < input.length; i++) {
        avgY += input[i].y;
    }
    avgY = avgY / input.length; //calculate the mean of y

    for (i = 0; i < input.length; i++) {
        sum += Math.pow(Math.abs(input[i].y - avgY), 2);
    }
    let SD = Math.sqrt(sum / ((input.length) - 1));

    return SD;
}

function getDistance(a, b) {
    return Math.sqrt(Math.pow((a.x - b.x), 2) + Math.pow((a.y - b.y), 2));
}

module.exports = {
    getRSquared,
    getDeviation,
    getEfficiency,
    deriveDataPoints,
};