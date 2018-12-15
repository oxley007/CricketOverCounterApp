
//import { ADD_TOGGLE } from "../Constants/action-types";

import { combineReducers } from 'redux';

import {AsyncStorage} from 'react-native';

export const ADD_RESET = 'ADD_RESET';

export const updateReset = ( reset ) => ({
  type: ADD_RESET,
  reset,
});

const initialState = {
  reset: 0,
};

console.log('hitting rootReducer');
console.log(initialState);

//const rootReducer = (state = initialState, action) => {
export default (state = initialState, action) => {
  switch (action.type) {
    case ADD_RESET:
    console.log(action.reset  + ' reset');
    return {
      ...state,
      reset: action.reset,
    };
    default:
      return state;
  }
};
