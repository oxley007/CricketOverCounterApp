
//import { ADD_TOGGLE } from "../Constants/action-types";

import { combineReducers } from 'redux';

import {AsyncStorage} from 'react-native';

export const ADD_RUNS = 'ADD_RUNS';

export const updateRuns = ( runs, runEvents, eventID, firstWicketIndex, secondWicketIndex, highestRunsPartnership ) => ({
  type: ADD_RUNS,
  runs,
  runEvents,
  eventID,
  firstWicketIndex,
  secondWicketIndex,
  highestRunsPartnership,
});

const initialState = {
  runs: 0,
  runEvents: [{eventID: 0, runsValue: 0, ball: -1, wicketEvent: false, runExtras: 0, runsType: 'deleted'}],
  eventID: 0,
  firstWicketIndex: 0,
  secondWicketIndex: 0,
  highestRunsPartnership: [],
};

console.log('hitting rootReducer');
console.log(initialState);

//const rootReducer = (state = initialState, action) => {
export default (state = initialState, action) => {
  switch (action.type) {
    case ADD_RUNS:
    console.log(action.runs  + ' runs');
    console.log(action.runEvents  + ' runEvents');
    console.log(action.eventID  + ' eventID');
    console.log(action.firstWicketIndex  + ' firstWicketIndex');
    console.log(action.secondWicketIndex  + ' secondWicketIndex');
    console.log(action.highestRunsPartnership  + ' highestRunsPartnership');
    return {
      ...state,
      runs: action.runs,
      runEvents: action.runEvents,
      eventID:  action.eventID,
      firstWicketIndex: action.firstWicketIndex,
      secondWicketIndex: action.secondWicketIndex,
      highestRunsPartnership: action.highestRunsPartnership,
    };
    default:
      return state;
  }
};
