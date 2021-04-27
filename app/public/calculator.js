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
};