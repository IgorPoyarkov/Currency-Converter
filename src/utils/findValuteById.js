import store from "../state/store";

export function findValuteById(
  searchId,
  sourceArray = store.getState().exchangeRates,
) {
  const result = sourceArray.find((valute) => valute.id === searchId);
  return result || null;
}
