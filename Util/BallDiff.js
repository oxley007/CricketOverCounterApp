const BallDiff = {
  getpartnershipDiff(ball, over) {
    //totalBalls (70 or 11.4 overs)
    let totalBallsOvers = over * 6;
    let totalBalls = totalBallsOvers + ball;
    return [totalBallsOvers, totalBalls];

},

getpartnershipDiffTotal(quotient) {
  let quotientBalls = Math.floor(quotient/6);
  let remainderAvg = quotient % 6;
  return [quotientBalls, remainderAvg];
},

getLegitBall(ball, runEvents) {
  const ballTotal = runEvents.map(acc => {
    console.log(acc);
  if (acc.runsType.includes('NO-BALL') || acc.runsType.includes('WIDE')) {
    console.log('Hit as an extra');
    return ball = 0;
    //dont add a ball
  }
  else if (acc.runsType.includes('deleted')) {
    //ignore.
    console.log('hit as a deleted ball');
    return ball = 0;
  }
  else {
    console.log(ball + 'hit as a legit ball');
    return ball = 1;
    console.log(ball);
  }
});

return [ballTotal];

},

getWicketCount(runEvents) {
  const countWickets = runEvents.filter(wickets => wickets.wicketEvent === true);
  const totalWickets = countWickets.length;
  console.log(totalWickets);

  return [totalWickets];
},

getOverAndBallSeperation(currentPartnership) {
  let ballSumTruncOver = Math.trunc(currentPartnership);
  console.log(ballSumTruncOver);
  let ballSumBall = currentPartnership % 1
  console.log(ballSumBall);
  let ballsumBallRound = Math.round(ballSumBall * 10);
  console.log(ballsumBallRound);
  let ballSumTruncBall = Math.trunc(ballsumBallRound);
  console.log(ballSumTruncBall);
  return [ballSumTruncOver, ballSumTruncBall];

},

secondMax(arr) {
  console.log(arr);
let max = Math.max.apply(null, arr); // get the max of the array
arr.splice(arr.indexOf(max), 1); // remove max from the array
console.log(arr);
return Math.max.apply(null, arr); // get the 2nd max
}

}

export default BallDiff;

/*
current 4.4
hightest 11.1

current 4*6 = 24 + 4 = 28balls
highest 11*6 = 66 + 1 = 67ball

67 - 28 = 39
39 goes into 6 x times (6 overs)
get the reminader (3 balls)
need to survive 6.3over to get highest partnetship. boom.
*/
