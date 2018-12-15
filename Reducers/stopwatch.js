
import { combineReducers } from 'redux';

import {AsyncStorage} from 'react-native';

export const ADD_STOPWATCH = 'ADD_STOPWATCH';

export const updateStopwatch = ( secondsElapsed, laps, lastClearedIncrementer, incrementer, avgBall, avgSeconds ) => ({
  type: ADD_STOPWATCH,
  secondsElapsed,
  laps,
  lastClearedIncrementer,
  incrementer,
  avgBall,
  avgSeconds,
});

const initialState = {
  secondsElapsed: 0,
  laps: [],
  lastClearedIncrementer: null,
  incrementer: null,
  avgBall: [],
  avgSeconds: 0,
};

console.log('hitting rootReducer');
console.log(initialState);

//const rootReducer = (state = initialState, action) => {
export default (state = initialState, action) => {
  switch (action.type) {
    case ADD_STOPWATCH:
    console.log(action.secondsElapsed  + ' secondsElapsed');
    console.log(action.avgBall  + ' avgBall');
    return {
      ...state,
      secondsElapsed: action.secondsElapsed,
      laps: action.laps,
      lastClearedIncrementer: action.lastClearedIncrementer,
      incrementer: action.incrementer,
      avgBall: action.avgBall,
      avgSeconds: action.avgSeconds
    };
    default:
      return state;
  }
};



/*

import { combineReducers } from 'redux';

import {AsyncStorage} from 'react-native';

export const ADD_STOPWATCH = 'ADD_STOPWATCH';

export const updateStopwatch = ( secondsElapsed, laps, lastClearedIncrementer, incrementer, avgBall, avgSeconds ) => ({
  type: ADD_STOPWATCH,
  secondsElapsed,
  laps,
  lastClearedIncrementer,
  incrementer,
  avgBall,
  avgSeconds,
});

const initialState = {
  secondsElapsed: 0,
  laps: [],
  lastClearedIncrementer: null,
  incrementer: null,
  avgBall: [],
  avgSeconds: 0,
};

console.log('hitting rootReducer in stopwatch');
console.log(initialState + ' Stopwatch initial state');

//const rootReducer = (state = initialState, action) => {
export default (state = initialState, action) => {
  switch (action.type) {
    case ADD_STOPWATCH:
    console.log(action.secondsElapsed  + ' secondsElapsed');
    console.log(action.laps  + ' laps');
    return {
      ...state,
      secondsElapsed: action.secondsElapsed,
      laps: action.laps,
      lastClearedIncrementer: action.lastClearedIncrementer,
      incrementer: action.incrementer,
      avgBall: action.avgBall,
      avgSeconds: action.avgSeconds
    };
    default:
      return state;
  }
};

*/
