const BallCalc = {
  getOverDiff(wicketBalls, partnershipOver, over, ball, partnershipBall) {
    //console.log(wicketBalls, partnershipOver, over, ball, partnershipBall);

      //need to workout the difference between the overs:
      //i.e. 1st wicket - 3.2, second wicket 5.4. 5 - 3 = 2
      let lastPartnerhsipOverBallSum = wicketBalls[wicketBalls.length - 1];
      console.log(lastPartnerhsipOverBallSum);
      var overSum = Math.trunc(lastPartnerhsipOverBallSum);
      console.log(overSum);
      console.log(over);
      partnershipOver = over - overSum;
      console.log(partnershipOver);
      //then the same with the balls:
      // 4 - 2 = 2
      //console.log(lastPartnerhsipOverBallSum % 1);
      let ballSum = lastPartnerhsipOverBallSum % 1;
      console.log(ballSum);
      ballSum *= 10;
      console.log(ballSum);
      let ballsumRound = Math.round(ballSum * 100) / 100;
      console.log(ballsumRound  + '  = Math.round(ballSum * 100) / 100');
      //let ballSumTrunc = Math.trunc(ballSum);
      //console.log(ballSumTrunc);
      console.log(ball + ' ball');
      console.log(ballSum + ' ballSum');
      if (ball != 0) {
      partnershipBall = ball - ballsumRound; //not working.
      console.log(partnershipBall + ' = ball - ballsumRound');
      }
      else {
        console.log(ballsumRound);
        partnershipBall = ballsumRound; //not working.
      }
      //total would be 2.2
      //however this doesn't work for when the balls for the second wicket is less than the first.
      //i.e. 1st wicket 3.4 and second wicket 5.2
      //5 - 3 = 2, 2 - 4 = -2.

      console.log(ball + ' ball before hitting if');

      if (partnershipBall < 0 && ball != 0) {
        //in this case if ball is a negative total, we need remove that negative number from 6
        console.log(partnershipBall);
        partnershipBall += 6;
        console.log(partnershipBall);
        //i.e. 6 - 2 = 4
        //And then remove 1 over from the overs
        // i.e. 2 - 1 = 1
        console.log(partnershipOver + ' before: partnershipBall < 0 && ball !== 6');
        partnershipOver += - 1;
        console.log(partnershipOver + ' After: partnershipBall < 0 && ball !== 6');
        //total would be 1.4
      }
      else if (partnershipBall < 0 && ball === 6) {
        console.log(partnershipBall);
        partnershipBall += 5;
        console.log(partnershipBall + ' ');
        //i.e. 6 - 2 = 4
        //And then remove 1 over from the overs
        // i.e. 2 - 1 = 1
        console.log(partnershipOver + ' before: partnershipBall < 0 && ball === 6');
        partnershipOver += - 1;
        console.log(partnershipOver + ' after: partnershipBall < 0 && ball === 6');
      }
      else {
        //all good.
      }

      let latestPartnership = `${partnershipOver}.${partnershipBall}`
      console.log(latestPartnership + ' latest partnership BallCalc');
      return latestPartnership;
    }
}

export default BallCalc;
