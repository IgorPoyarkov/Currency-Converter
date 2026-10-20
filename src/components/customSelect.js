import store from "../state/store";
import createSvgIcon from "../utils/createSvgIcon";
import { findValuteById } from "../utils/findValuteById";

let sharedListEl = null;

export default function customSelectCreate(mixInClass) {
  const customSelectEl = document.createElement("div");
  customSelectEl.classList.add("custom-select");

  if (mixInClass) {
    customSelectEl.classList.add(`currency-menu__select-${mixInClass}`);
  }

  const inputEl = document.createElement("input");
  inputEl.classList.add("custom-select__input");
  inputEl.id = `${mixInClass}-input`;
  inputEl.type = "text";

  const labelEl = document.createElement("label");
  labelEl.classList.add("custom-select__label");
  labelEl.htmlFor = `${mixInClass}-input`;

  switch (mixInClass) {
    case "to":
      labelEl.textContent = "Хочу приобрести";
      break;
    default:
      labelEl.textContent = "У меня имеется";
      break;
  }

  const buttonEl = document.createElement("button");
  buttonEl.classList.add("custom-select__button", "btn");

  buttonEl.append(
    createSvgIcon("custom-button__icon", "custom-select__button-icon"),
  );

  buttonEl.addEventListener("click", (e) => {
    e.preventDefault();
    store.dispatch({ type: "SET_ACTIVE_SIDE", payload: mixInClass });

    if (sharedListEl) {
      sharedListEl.classList.toggle("custom-select__list--visible");

      switch (mixInClass) {
        case "to":
          sharedListEl.classList.toggle(`custom-select__list--${mixInClass}`);
          break;

        default:
          sharedListEl.classList.remove(`custom-select__list--to`);
          break;
      }
    }
  });

  const textareaEl = document.createElement("input");
  textareaEl.classList.add("custom-select__textarea");
  textareaEl.id = `textarea-${mixInClass}`;
  textareaEl.type = "text";

  if (mixInClass === "to") {
    textareaEl.readOnly = true;

    store.subscribe(() => {
      const freshState = store.getState();

      textareaEl.value = new Intl.NumberFormat("ru-RU", {
        maximumFractionDigits: 4,
      })
        .format(freshState.currencyConverter.resultConvert)
        .replace(",", ".");

      if (freshState.currencyConverter.amount === 0) {
        textareaEl.value = "";
      }
    });
  } else {
    textareaEl.addEventListener("input", (e) => {
      let inputVal = e.target.value;

      inputVal = inputVal.replace(/,/g, ".");

      inputVal = inputVal.replace(/[^0-9.]/g, "");

      const pieces = inputVal.split(".");
      if (pieces.length > 2) {
        inputVal = pieces[0] + "." + pieces.slice(1).join("");
      }

      const cleanNumberString = inputVal.replace(/\s/g, "");

      store.dispatch({ type: "SET_AMOUNT", payload: cleanNumberString });

      if (inputVal === "") {
        e.target.value = "";
        return;
      }

      if (inputVal.endsWith(".")) {
        const leftPart = parseFloat(pieces[0]) || 0;
        e.target.value = new Intl.NumberFormat("ru-RU").format(leftPart) + ".";
      } else if (pieces.length === 2) {
        const leftPart = parseFloat(pieces[0]) || 0;
        const rightPart = pieces[1];
        e.target.value =
          new Intl.NumberFormat("ru-RU").format(leftPart) + "." + rightPart;
      } else {
        const wholeNumber = parseFloat(inputVal) || 0;
        e.target.value = new Intl.NumberFormat("ru-RU").format(wholeNumber);
      }
    });
  }

  store.subscribe(() => {
    const freshState = store.getState();
    const currentConverterData = freshState.currencyConverter[mixInClass];
    const updatedCurrency = findValuteById(currentConverterData.id);

    if (updatedCurrency && !freshState.device.isMobile) {
      inputEl.value = updatedCurrency.name + " " + updatedCurrency.charCode;
    } else {
      inputEl.value = updatedCurrency.charCode;
    }

    if (currentConverterData.flag) {
      inputEl.classList.add("custom-select__input--active");
    } else {
      inputEl.classList.remove("custom-select__input--active");
    }
  });

  const initialState = store.getState();
  const initCurrency = findValuteById(
    initialState.currencyConverter[mixInClass].id,
  );
  if (initCurrency) {
    inputEl.value = initCurrency.name + " " + initCurrency.charCode;
  }

  const currentList = customSelectListCreate();

  if (currentList) {
    customSelectEl.append(inputEl, labelEl, buttonEl, textareaEl, currentList);
  } else {
    customSelectEl.append(inputEl, labelEl, buttonEl, textareaEl);
  }

  return customSelectEl;
}

function customSelectListCreate() {
  if (sharedListEl) return null;

  sharedListEl = document.createElement("ul");
  sharedListEl.classList.add("custom-select__list");

  const initialState = store.getState();

  if (initialState.device.isMobile) {
    const clossSelectListEl = document.createElement("button");
    clossSelectListEl.classList.add("custom-select__closs", "btn");
    clossSelectListEl.addEventListener("click", (e) => {
      e.preventDefault();
      sharedListEl.classList.toggle("custom-select__list--visible");
    });

    sharedListEl.prepend(clossSelectListEl);
  }

  let upPageEl = null;
  let dnPageEl = null;

  function paginationCustomSelect(currentPage = 1) {
    const totalPage = Math.round(
      initialState.exchangeRates.length /
        initialState.paginationCustomSelect.rows,
    );

    function createButtonToPaginationCustomSelect(
      modif = "up",
      className = "custom-select__pagination",
    ) {
      const buttonToPaginationCustomSelectEl = document.createElement("button");
      buttonToPaginationCustomSelectEl.classList.add(
        className,
        `${className}--${modif}`,
        "btn",
      );

      buttonToPaginationCustomSelectEl.append(
        createSvgIcon(
          "pagination-arrow__icon",
          "custom-select__pagination-icon",
        ),
      );

      buttonToPaginationCustomSelectEl.addEventListener("click", () => {
        let counter = 0;
        if (modif === "up") {
          counter--;
        } else {
          counter++;
        }

        store.dispatch({ type: "SET_PAGINATION_PAGE", payload: counter });

        if (sharedListEl) {
          const { isTablet, isMobile } = store.getState().device;

          if (isTablet || isMobile) {
            sharedListEl.scrollIntoView({ behavior: "auto", block: "start" });
          }
        }
      });
      return buttonToPaginationCustomSelectEl;
    }

    if (totalPage > 1) {
      upPageEl = createButtonToPaginationCustomSelect();
      dnPageEl = createButtonToPaginationCustomSelect("dn");

      updatePaginationVisibility(currentPage, totalPage);

      sharedListEl.prepend(upPageEl, dnPageEl);
    }
  }

  function updatePaginationVisibility(currentPage, totalPage) {
    if (!upPageEl || !dnPageEl) return;

    if (currentPage > 1) {
      upPageEl.classList.add("custom-select__pagination--visibility");
    } else {
      upPageEl.classList.remove("custom-select__pagination--visibility");
    }

    if (currentPage >= totalPage) {
      dnPageEl.classList.remove("custom-select__pagination--visibility");
    } else {
      dnPageEl.classList.add("custom-select__pagination--visibility");
    }
  }

  function createCustomSelectList() {
    function render() {
      const state = store.getState();
      const currentPase = state.paginationCustomSelect.currentPage;
      const rows = state.paginationCustomSelect.rows;
      const totalPage = Math.round(state.exchangeRates.length / rows);

      const oldItems = sharedListEl.querySelectorAll(".custom-select__item");
      oldItems.forEach((item) => item.remove());

      const renderList = state.exchangeRates.slice(
        (currentPase - 1) * rows,
        rows * currentPase,
      );

      updatePaginationVisibility(currentPase, totalPage);

      renderList.forEach((currency) => {
        const itemEl = document.createElement("li");
        itemEl.classList.add("custom-select__item");
        itemEl.dataset.index = currency.id;

        const currencyEl = document.createElement("div");
        currencyEl.classList.add("custom-select__currency");

        currencyEl.addEventListener("click", () => {
          const freshState = store.getState();
          const currencyConverterActive = freshState.currencyConverter.active;

          if (currencyConverterActive) {
            store.dispatch({ type: "SET_VALUTE_ID", payload: currency.id });
            store.dispatch({
              type: "SET_AMOUNT",
              payload: freshState.currencyConverter.amount,
            });

            switch (currencyConverterActive) {
              case "to":
                sharedListEl.classList.toggle(
                  `custom-select__list--${currencyConverterActive}`,
                );
                break;
              default:
                sharedListEl.classList.remove(`custom-select__list--to`);
                break;
            }
          }
          sharedListEl.classList.toggle("custom-select__list--visible");
        });

        const currencyNameEl = document.createElement("span");
        currencyNameEl.classList.add("custom-select__currency-name");
        currencyNameEl.textContent = currency.name;

        const currencyCharEl = document.createElement("span");
        currencyCharEl.classList.add("custom-select__currency-char");
        currencyCharEl.textContent = currency.charCode;

        currencyEl.append(currencyNameEl, currencyCharEl);
        itemEl.append(currencyEl);
        sharedListEl.append(itemEl);
      });
    }

    store.subscribe(render);

    render();
  }

  const startPage = initialState.paginationCustomSelect?.currentPage || 1;
  paginationCustomSelect(startPage);
  createCustomSelectList();

  return sharedListEl;
}
