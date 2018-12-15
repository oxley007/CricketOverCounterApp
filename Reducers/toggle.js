
//import { ADD_TOGGLE } from "../Constants/action-types";

import { combineReducers } from 'redux';

import {AsyncStorage} from 'react-native';

export const ADD_TOGGLE = 'ADD_TOGGLE';

export const updateToggle = toggle => ({
  type: ADD_TOGGLE,
  toggle,
});

const initialState = {
  toggle: false,
};

console.log('hitting rootReducer');
console.log(initialState);

//const rootReducer = (state = initialState, action) => {
export default (state = initialState, action) => {
  switch (action.type) {
    case ADD_TOGGLE:
    return {
      ...state,
        toggle: action.toggle,
    };
    default:
      return state;
  }
};
