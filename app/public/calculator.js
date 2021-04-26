
// input = [
//     {x:1,y:300},
//     {x:2,y:300},
//     {x:3,y:300},
//     {x:4,y:300},
//     {x:5,y:300},
//     {x:6,y:300},
// ]
input = [
    { x: 3, y: 1 },
    { x: 3, y: 4 },
    { x: 6, y: 7 },
    { x: 3, y: 2 },
    { x: 3, y: 6 }

]

//declare the list of x and y
var list_x = []
var list_y = []
// do all the math you need to do
for (i = 0; i < input.length; i++) {
    var tmp = input[i];
    list_x.push(tmp.x);
    list_y.push(tmp.y);
}
//This function is to determine bot by using correlation coeffient
//calculate Correlation coefficient(the trend of line)
//r = 1(stright line up ),-1(straight line down),0 (no slop,spread)
function getRSquared(input) {
    //calculate avg x
    var avg_x = 0;
    for (i = 0; i < list_x.length; i++) {
        avg_x += list_x[i]
    }
    var avg_x = avg_x / list_x.length;//calculate the mean of x
    //calculate avg y
    var avg_y = 0;
    for (i = 0; i < list_y.length; i++) {
        avg_y += list_y[i]
    }
    var avg_y = avg_y / list_y.length; //calculate the mean of y

    //calculate sx
    var sx = 0;
    for (i = 0; i < list_x.length; i++) {
        sx += Math.pow((list_x[i] - avg_x), 2)
    }
    sx = Math.sqrt(sx / (list_x.length - 1))
    //calculate sy
    var sy = 0;
    for (i = 0; i < list_x.length; i++) {
        sy += Math.pow((list_y[i] - avg_y), 2);
    }
    sy = Math.sqrt(sy / (list_y.length - 1))

    //calculate (x-avgx)(y-avgy)
    var xy = 0
    for (i = 0; i < input.length; i++) {
        xy += ((list_x[i] - avg_x) * (list_y[i] - avg_y))
    }
    //devide the (xy) by sx * sy
    var CC = (xy / (sy * sx)) / (input.length - 1); //the correlation of coefficient

    return CC;
}
//Efficiency is defined as the ratio of displacment devided by distance.
//the straight line movement has the ratio closed to 1, while the curve line(like human) has lower efficiency ratio 
//Distance^2 = (x1 - x2)^2 -(y1-y2)^2
function getEfficiency(input) {

    first_point = input[0]               //first point(x,y)
    last_point = input[(input.length) - 1] //last point (x,y)
    //calculate displacement
    displacement = Math.sqrt(Math.pow((first_point.x - last_point.x), 2) + Math.pow((first_point.y - last_point.y), 2))
    distance = Math.abs(first_point.x - last_point.x) + Math.abs(first_point.y - last_point.y)
    var efficiency = displacement / distance

    return efficiency
}
//For keystrokes calculation taking time 
//{x,y} = x is the key, y is time of taking to press keys
//use (N-1) for the process of computing standard deviation 
//If the standard deviation is 0. We can determine it is a bot
function getDeviation(input) {
    var sum = 0

    //calculate avg y
    var avg_y = 0;
    for (i = 0; i < list_y.length; i++) {
        avg_y += list_y[i]
    }
    var avg_y = avg_y / list_y.length; //calculate the mean of y

    for (i = 0; i < list_y.length; i++) {
        sum += Math.pow(Math.abs(list_y[i] - avg_y), 2)
    }
    var SD = Math.sqrt(sum / ((list_y.length) - 1))

    return SD

}



var z = getDeviation(input);
console.log(z);
var y = getEfficiency(input);
console.log(y);
var x = getRSquared(input);
console.log(x);
// module.exports = {
//     getRSquared
// }
