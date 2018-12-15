
//import { ADD_TOGGLE } from "../Constants/action-types";

import { combineReducers } from 'redux';

import {AsyncStorage} from 'react-native';

export const ADD_OVER = 'ADD_OVER';

export const updateOver = ( ball, over ) => ({
  type: ADD_OVER,
  ball,
  over,
});

const initialState = {
  ball: 0,
  over: 0,
};

console.log('hitting rootReducer');
console.log(initialState);

//const rootReducer = (state = initialState, action) => {
export default (state = initialState, action) => {
  switch (action.type) {
    case ADD_OVER:
    console.log(action.over  + ' over');
    console.log(action.ball  + ' ball');
    return {
      ...state,
      ball: action.ball,
      over: action.over,
    };
    default:
      return state;
  }
};
