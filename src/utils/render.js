import currencyMenuCreate from "../components/currencyMenu";
import exchangeRatesCreate from "../components/exchangeRates";
import initResizeListener from "./initResizeListener";

export default function render() {
  const appEl = document.querySelector(".app");
  if (!appEl) return null;

  initResizeListener();

  appEl.append(currencyMenuCreate(), exchangeRatesCreate());

  return appEl;
}
