import { loadCurrencies } from "../utils/loadCurrencies";
import reducer from "./reducer";

const currencies = await loadCurrencies();

let rawState = {
  exchangeRates: currencies.allCurrencies,
  formattedDate: currencies.formattedDate,
  currencyConverter: {
    from: { flag: false, id: "R00000" },
    to: { flag: false, id: "R00000" },
    active: "",
    amount: 0,
    resultConvert: 0,
  },
  rateCurrentDate: {
    id: "R00000",
  },

  device: {
    isMobile: false,
    isTablet: false,
  },
  paginationCustomSelect: { currentPage: 1, rows: 33 },
};

const listeners = [];

const store = {
  getState() {
    return rawState;
  },

  subscribe(listener) {
    listeners.push(listener);
  },

  dispatch(action) {
    rawState = reducer(rawState, action);
    listeners.forEach((callback) => callback());
  },
};

export default store;
