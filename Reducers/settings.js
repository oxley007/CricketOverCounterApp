
//import { ADD_TOGGLE } from "../Constants/action-types";

import { combineReducers } from 'redux';

import {AsyncStorage} from 'react-native';

export const ADD_SETTINGS = 'ADD_SETTINGS';

export const updateSettings= ( settings ) => ({
  type: ADD_SETTINGS,
  settings,
});

const initialState = {
  settings: '33',
};

console.log('hitting rootReducer');
console.log(initialState);

//const rootReducer = (state = initialState, action) => {
export default (state = initialState, action) => {
  switch (action.type) {
    case ADD_SETTINGS:
    console.log(action.settings  + ' settings');
    return {
      ...state,
      settings: action.settings,
    };
    default:
      return state;
  }
};
