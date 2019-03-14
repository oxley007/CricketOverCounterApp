
import { combineReducers } from 'redux';

import {AsyncStorage} from 'react-native';

export const ADD_PARTNERSHIP = 'ADD_PARTNERSHIP';

export const updatePartnership = ( highestPartnership, currentPartnership, avgWicket ) => ({
  type: ADD_PARTNERSHIP,
  highestPartnership,
  currentPartnership,
  avgWicket,
});

const initialState = {
  highestPartnership: 0,
  currentPartnership: 0,
  avgWicket: 0,
};

console.log('hitting rootReducer');
console.log(initialState);

//const rootReducer = (state = initialState, action) => {
export default (state = initialState, action) => {
  switch (action.type) {
    case ADD_PARTNERSHIP:
    console.log(action.highestPartnership  + ' highestPartnership');
    console.log(action.currentPartnership  + ' currentPartnership');
    console.log(action.avgWicket  + ' avgWicket');
    return {
      ...state,
      highestPartnership: action.highestPartnership,
      currentPartnership: action.currentPartnership,
      avgWicket: action.avgWicket,
    };
    default:
      return state;
  }
};
