import createSvgIcon from "../utils/createSvgIcon";
import customSelectCreate from "./customSelect";
import store from "../state/store";

export default function currencyMenuCreate() {
  const containerEl = document.createElement("div");
  containerEl.classList.add("container");

  const currencyMenuEl = document.createElement("div");
  currencyMenuEl.classList.add("currency-menu");

  const menuTitleEl = document.createElement("h1");
  menuTitleEl.classList.add("currency-menu__title");
  menuTitleEl.textContent = "Конвертер валют";

  const rescheduledEl = document.createElement("button");
  rescheduledEl.classList.add("currency-menu__rescheduled", "btn");

  rescheduledEl.addEventListener("click", () => {
    const freshState = store.getState();

    store.dispatch({ type: "REVERSE_CURRENCIES" });

    store.dispatch({
      type: "SET_AMOUNT",
      payload: freshState.currencyConverter.amount,
    });

    const listEl = currencyMenuEl.querySelector(".custom-select__list");
    if (listEl) listEl.classList.remove("custom-select__list--visible");
  });

  let svgString = "";

  switch (true) {
    case store.getState().device.isTablet || store.getState().device.isMobile:
      svgString = "currency-menu__rescheduled-tablet";
      break;

    default:
      svgString = "currency-menu__rescheduled-icon";
      break;
  }

  rescheduledEl.append(
    createSvgIcon(svgString, "currency-menu__rescheduled-icon"),
  );

  currencyMenuEl.append(
    menuTitleEl,
    customSelectCreate("from"),
    rescheduledEl,
    customSelectCreate("to"),
  );

  containerEl.append(currencyMenuEl);

  let currentDeviceState =
    store.getState().device.isTablet || store.getState().device.isMobile;

  store.subscribe(() => {
    const { isTablet, isMobile } = store.getState().device;
    const nextDeviceState = isTablet || isMobile;

    if (currentDeviceState !== nextDeviceState) {
      currentDeviceState = nextDeviceState;

      const nextSvgString = nextDeviceState
        ? "currency-menu__rescheduled-tablet"
        : "currency-menu__rescheduled-icon";

      rescheduledEl.innerHTML = "";
      rescheduledEl.append(
        createSvgIcon(nextSvgString, "currency-menu__rescheduled-icon"),
      );
    }
  });

  return containerEl;
}
