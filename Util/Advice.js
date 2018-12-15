const Advice = {
  getAvgBowlingOrBatting(over, currentPartnership, avgWicket, associated, wickets) {
    /*
    The if statements to decide what advice to display to user.
    */
    if (associated !== 'neutral') {
    if (over >= 2 && wickets >= 2) {
      if (associated === 'batting') {
        if (currentPartnership <= avgWicket) {
      return `The current partnership should aim for the innings average partnership of ${avgWicket} overs. Good luck!`;
    }
      if (currentPartnership > avgWicket) {
        return `Shot! This partnership has passed the average of ${avgWicket} overs. Keep batting!`;
      }
      else {
        return `The average innings partnership is ${avgWicket} overs.`;
      }
      }
      else if (associated === 'bowling') {
        if (currentPartnership >= avgWicket) {
          return `The partnership has passed the average of ${avgWicket} overs. See if you can break the partnership before i reaches the highest partnership of the innings ({highestPartnership} overs).`;
        }
        else {
        return `Partnerships win matches. Aim to take a wicket before the average partnership of ${avgWicket} overs. Current partnersip is ${currentPartnership} overs.`;
      }
      }
    }
    else if (wickets <= 1) {
      if (associated === 'batting') {
        return `The best way to build a big score is by creating long partnerships. Good luck!`;
      }
      else if (associated === 'bowling') {
        return `The best way to reducing the score is by breaking partnerships. Good luck!`;
      }
    }
    else {
      return `The best way to build a big score is by creating long partnerships.`;
    }
  }
  else {
    //if neutral return nothing.
    return '';
  }
  },

  getHighBowlingOrBatting(over, currentPartnership, avgWicket, associated, wickets, highestPartnership, avgWicketPlus1, currentVsHighPartnership) {
    if (associated !== 'neutral') {
    if (over >= 2 && wickets >= 1 && currentPartnership < highestPartnership) {
      if (associated === 'batting') {
          return `The current pair of batsmen need to survive ${currentVsHighPartnership} overs to achieve the highest partnership (overs) of the innings.`;
        }
      else if (associated === 'bowling') {
        return `Look to get a wicket within ${currentVsHighPartnership} overs so the current pair of batsmen don't achieve the highest partnership of the innings.`;
      }
    }
    else if (over >= 2 && wickets >= 1 && currentPartnership >= highestPartnership) {
      if (associated === 'batting') {
        return `Nice batting! This is now the highest partnership (${currentPartnership} overs) of the innings! Keep going!`;
      }
      else if (associated === 'bowling') {
        let currentPartnershipPlus2 = currentPartnership + 2;
        return `This is now the highest partnership (${currentPartnership} overs) of the innings. See if you can break it before it gets to ${currentPartnershipPlus2} overs!`;
      }
    }
    else {
      if (associated === 'batting') {
        return `See how long the partnership can last`;
      }
      else if (associated === 'bowling') {
        return `Look to ge a wicket early!`;
      }
    }
  }
  else {
    //if neutral return nothing.
    return '';
  }
}
}

export default Advice;
