import store from "../state/store";
import createSvgIcon from "../utils/createSvgIcon";
import { findValuteById } from "../utils/findValuteById";

export default function exchangeRatesCreate() {
  const containerEl = document.createElement("div");
  containerEl.classList.add("container");

  const exchangeRatesEl = document.createElement("div");
  exchangeRatesEl.classList.add("exchange-rates");

  const exchangeTitleEl = document.createElement("h2");
  exchangeTitleEl.classList.add("exchange-rates__title");
  exchangeTitleEl.ariaLabel = "Курсы валют на определенную дату";
  exchangeTitleEl.textContent = "Курсы валют ";

  const exchangeSubTitleEl = document.createElement("span");
  exchangeSubTitleEl.classList.add("exchange-rates__data");
  exchangeSubTitleEl.textContent = "на " + store.getState().formattedDate;

  const exchangeSelectWrapperEl = document.createElement("div");
  exchangeSelectWrapperEl.classList.add("exchange-rates__select-wrapper");

  const exchangeSelectEl = document.createElement("select");
  exchangeSelectEl.classList.add("exchange-rates__select");
  exchangeSelectEl.name = "exchange-rates__select";

  exchangeSelectEl.addEventListener("change", (e) => {
    store.dispatch({ type: "RATE_CURRENT_DATE", payload: e.target.value });
    exchangeSelectEl.classList.add("exchange-rates__select--active");
  });

  const placeholderOption = new Option("Выберите базовую валюту", "");
  placeholderOption.disabled = true;
  placeholderOption.selected = true;
  placeholderOption.hidden = true;
  exchangeSelectEl.add(placeholderOption);

  store.getState().exchangeRates.forEach((currency) => {
    const optionText = currency.name;
    const optionEl = new Option(optionText, currency.id);
    exchangeSelectEl.add(optionEl);
  });

  exchangeSelectWrapperEl.append(
    exchangeSelectEl,
    createSvgIcon("exchange-rates__select-icon", "exchange-rates__select-icon"),
  );

  const exchangeListEl = document.createElement("ul");
  exchangeListEl.classList.add("exchange-rates__list");

  const exchangeItemHeaderEl = document.createElement("li");
  exchangeItemHeaderEl.classList.add(
    "exchange-rates__item",
    "exchange-rates__item--header",
  );

  const exchangeItemHeaderRateEl = document.createElement("div");
  exchangeItemHeaderRateEl.classList.add(
    "exchange-rate",
    "exchange-rate--header",
  );

  const exchangeItemHeaderCharEl = document.createElement("span");
  exchangeItemHeaderCharEl.classList.add(
    "exchange-rate__cell",
    "exchange-rate__cell--char",
  );
  exchangeItemHeaderCharEl.textContent = "Код";

  const exchangeItemHeaderNominalEl = document.createElement("span");
  exchangeItemHeaderNominalEl.classList.add(
    "exchange-rate__cell",
    "exchange-rate__cell--nominal",
  );
  exchangeItemHeaderNominalEl.textContent = "Единица";

  const exchangeItemHeaderNamelEl = document.createElement("span");
  exchangeItemHeaderNamelEl.classList.add(
    "exchange-rate__cell",
    "exchange-rate__cell--name",
  );
  exchangeItemHeaderNamelEl.textContent = "Валюта";

  const exchangeItemHeaderValuelEl = document.createElement("span");
  exchangeItemHeaderValuelEl.classList.add(
    "exchange-rate__cell",
    "exchange-rate__cell--value",
  );
  exchangeItemHeaderValuelEl.textContent = "Курс базовой валюты";

  exchangeItemHeaderRateEl.append(
    exchangeItemHeaderCharEl,
    exchangeItemHeaderNominalEl,
    exchangeItemHeaderNamelEl,
    exchangeItemHeaderValuelEl,
  );
  exchangeItemHeaderEl.append(exchangeItemHeaderRateEl);

  function renderList() {
    const state = store.getState();

    exchangeListEl.innerHTML = "";

    state.exchangeRates.slice(1).forEach((rates) => {
      const exchangeItemEl = document.createElement("li");
      exchangeItemEl.classList.add("exchange-rates__item");
      exchangeItemEl.dataset.index = rates.id;

      const exchangeRateEl = document.createElement("div");
      exchangeRateEl.classList.add("exchange-rate");

      const exchangeRateCharEl = document.createElement("span");
      exchangeRateCharEl.classList.add(
        "exchange-rate__cell",
        "exchange-rate__cell--char",
      );
      exchangeRateCharEl.textContent = rates.charCode;
      exchangeRateCharEl.append(
        createSvgIcon(`flag__${rates.charCode}`, "exchange-rate__icon"),
      );

      const exchangeRateNominalEl = document.createElement("span");
      exchangeRateNominalEl.classList.add(
        "exchange-rate__cell",
        "exchange-rate__cell--nominal",
      );
      exchangeRateNominalEl.textContent = rates.nominal;

      const exchangeRateNamelEl = document.createElement("span");
      exchangeRateNamelEl.classList.add(
        "exchange-rate__cell",
        "exchange-rate__cell--name",
      );
      exchangeRateNamelEl.textContent = rates.name;

      const exchangeRateValuelEl = document.createElement("span");
      exchangeRateValuelEl.classList.add(
        "exchange-rate__cell",
        "exchange-rate__cell--value",
      );
      exchangeRateValuelEl.textContent = rates.value;

      store.subscribe(() => {
        const freshState = store.getState();
        const baseValute = findValuteById(freshState.rateCurrentDate.id);
        if (baseValute) {
          exchangeRateValuelEl.textContent = new Intl.NumberFormat("ru-RU", {
            maximumFractionDigits: 4,
          })
            .format(rates.convertTo(1, baseValute))
            .replace(",", ".");
        }
      });

      exchangeRateEl.append(
        exchangeRateCharEl,
        exchangeRateNominalEl,
        exchangeRateNamelEl,
        exchangeRateValuelEl,
      );

      switch (true) {
        case state.device.isTablet || state.device.isMobile: {
          exchangeRatesEl.classList.add("exchange-rates--tablet");
          if (rates.name.length >= 15 && rates.name.length < 22) {
            exchangeRateNamelEl.classList.add("exchange-rate__cell--size-big");
          } else if (rates.name.length >= 22) {
            exchangeRateNamelEl.classList.add("exchange-rate__cell--size-very");
          }

          const headerClone = exchangeItemHeaderRateEl.cloneNode(true);
          exchangeItemEl.append(exchangeRateEl);
          exchangeItemEl.prepend(headerClone);
          exchangeListEl.append(exchangeItemEl);
          break;
        }
        case state.device.isMobile:
          break;
        default:
          exchangeRatesEl.classList.remove("exchange-rates--tablet");
          exchangeItemEl.append(exchangeRateEl);
          exchangeListEl.append(exchangeItemEl);
          break;
      }
    });

    if (!state.device.isTablet && !state.device.isMobile) {
      exchangeListEl.prepend(exchangeItemHeaderEl);
    }
  }

  let currentDeviceState =
    store.getState().device.isTablet || store.getState().device.isMobile;

  store.subscribe(() => {
    const nextDeviceState =
      store.getState().device.isTablet || store.getState().device.isMobile;

    if (currentDeviceState !== nextDeviceState) {
      currentDeviceState = nextDeviceState;
      renderList();
    }
  });

  renderList();

  exchangeRatesEl.append(
    exchangeTitleEl,
    exchangeSubTitleEl,
    exchangeSelectWrapperEl,
    exchangeListEl,
  );
  containerEl.append(exchangeRatesEl);

  return containerEl;
}
