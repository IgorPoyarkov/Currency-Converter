import { findValuteById } from "../utils/findValuteById";


export default function reducer(state, action) {
  switch (action.type) {
    case "SET_ACTIVE_SIDE":
      return {
        ...state,
        currencyConverter: {
          ...state.currencyConverter,
          active: action.payload,
        },
      };

    case "SET_VALUTE_ID": {
      const activeSide = state.currencyConverter.active;
      if (!activeSide) return state;

      return {
        ...state,
        currencyConverter: {
          ...state.currencyConverter,
          [activeSide]: {
            ...state.currencyConverter[activeSide],
            id: action.payload,
            flag: true,
          },
        },
      };
    }

    case "REVERSE_CURRENCIES":
      return {
        ...state,
        currencyConverter: {
          ...state.currencyConverter,
          from: { ...state.currencyConverter.to },
          to: { ...state.currencyConverter.from },
          active: "",
        },
      };

    case "SET_AMOUNT": {
      const amount = Number(action.payload) || 0;
      const fromId = state.currencyConverter.from.id;
      const toId = state.currencyConverter.to.id;

      const valuteFrom = findValuteById(fromId, state.exchangeRates);
      const valuteTo = findValuteById(toId, state.exchangeRates);

      let resultConvert = 0;
      if (valuteFrom && valuteTo) {
        const rawResult = valuteFrom.convertTo(amount, valuteTo);
        resultConvert = Number(rawResult.toFixed(4));
      }

      return {
        ...state,
        currencyConverter: {
          ...state.currencyConverter,
          amount: amount,
          resultConvert: resultConvert,
        },
      };
    }

    case "RATE_CURRENT_DATE":
      return {
        ...state,
        rateCurrentDate: {
          ...state.rateCurrentDate,

          id: action.payload,
        },
      };

    case "SET_DEVICE_STATUS":
      return {
        ...state,
        device: {
          ...state.device,
          isMobile: action.payload.isMobile,
          isTablet: action.payload.isTablet,
        },
      };

    case "SET_PAGINATION_PAGE":
      const page = state.paginationCustomSelect.currentPage;
      console.log(action.payload);
      return {
        ...state,
        paginationCustomSelect: {
          ...state.paginationCustomSelect,
          currentPage: page + action.payload,
        },
      };

    default:
      return state;
  }
}
