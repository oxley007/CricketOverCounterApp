
//import { ADD_TOGGLE } from "../Constants/action-types";

import { combineReducers } from 'redux';

import {AsyncStorage} from 'react-native';

export const ADD_WICKET = 'ADD_WICKET';

export const updateWicket = ( wicket, wicketBalls ) => ({
  type: ADD_WICKET,
  wicket,
  wicketBalls,
});

const initialState = {
  wicket: 0,
  wicketBalls: [],
};

console.log('hitting rootReducer');
console.log(initialState);

//const rootReducer = (state = initialState, action) => {
export default (state = initialState, action) => {
  switch (action.type) {
    case ADD_WICKET:
    console.log(action.wicket  + ' wicket');
    console.log(action.wicketBalls  + ' wicketBalls');
    return {
      ...state,
      wicket: action.wicket,
      wicketBalls: action.wicketBalls,
    };
    default:
      return state;
  }
};
