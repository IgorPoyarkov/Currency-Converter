# Currency-Converter — конвертер валют ЦБ РФ

Конвертер валют на чистом JavaScript с собственным Redux-подобным стором и нулевым
количеством зависимостей в `package.json`.

**Демо:** https://igorpoyarkov.github.io/Currency-Converter/
**Данные:** публичный JSON ЦБ РФ — `https://www.cbr-xml-daily.ru/daily_json.js`

## Возможности

- конвертер: выбор валюты «из» и «в», кнопка реверса, ввод суммы, мгновенный пересчёт;
- курс отсчёта меняется в обе стороны независимо от того, какая сторона активна;
- список всех валют с текущим курсом, дельтой к прошлому значению и пагинацией по 33 строки;
- дата актуальности курса;
- при недоступности API приложение не падает, а переходит на резервную пару валют;
- вид списка и поведение селекта зависят от устройства (mobile / tablet / desktop).

## Ключевые решения

### 1. Свой стор вместо Redux

Весь стор — 20 строк: замыкание на состояние, массив слушателей, `dispatch`, который
пересчитывает состояние редьюсером и оповещает подписчиков. Он написан не «чтобы было
своё», а чтобы точно понимать, что происходит под капотом Redux в момент `dispatch`:

```js
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
```

Данные загружаются до создания стора — в модуле использован top-level await, поэтому
первый `render` уже видит реальные курсы и промежуточного «пустого» экрана нет:

```js
const currencies = await loadCurrencies();
```

### 2. Редьюсер — одна чистая функция на все изменения

Семь действий, каждое возвращает новый объект, вложенные объекты копируются явно.
Особо показательны два.

`SET_VALUTE_ID` не знает, какую сторону выбрал пользователь, — сторона лежит в состоянии:

```js
case "SET_VALUTE_ID": {
  const activeSide = state.currencyConverter.active;
  if (!activeSide) return state;

  return {
    ...state,
    currencyConverter: {
      ...state.currencyConverter,
      [activeSide]: { ...state.currencyConverter[activeSide],
                      id: action.payload, flag: true },
    },
  };
}
```

`REVERSE_CURRENCIES` меняет стороны местами и сбрасывает активную — иначе после реверса
следующий клик по селекту перезаписал бы только что «переехавшую» валюту:

```js
from: { ...state.currencyConverter.to },
to: { ...state.currencyConverter.from },
active: "",
```

### 3. Валюта — класс с арифметикой, а не объект с полями

Ключевая деталь: ЦБ публикует курс **за номинал** — за 10, 100 или 1000 единиц. Без
деления на номинал конвертация врёт в разы. Поэтому бизнес-логика живёт в модели:

```js
get singleValue() {
  return this._value / this._nominal;   // цена за одну единицу
}

get difference() {
  return Number((this._value - this._previous).toFixed(4));
}

convertTo(amount, targetValuteInstance) {
  if (!targetValuteInstance) return 0;
  return amount * (this.singleValue / targetValuteInstance.singleValue);
}
```

`convertTo` считает кросс-курс через рубль: обе валюты переводятся в «рубли за единицу»
и делятся. Так работают любые пары — доллар/евро, юань/лира — без отдельной таблицы
курсов между всеми валютами.

### 4. Формат API ЦБ переводится в доменную модель на входе

Ответ ЦБ приходит в `ID / NumCode / CharCode / Nominal / Value / Previous`. `fromJSON`
сразу приводит это к полям модели, и ни один компонент про CamelCase не знает:

```js
static fromJSON(data) {
  return new Valute(
    data.ID || data.id,
    data.NumCode || data.numCode,
    data.CharCode || data.charCode,
    data.Nominal || data.nominal,
    data.Name || data.name,
    data.Value || data.value,
    data.Previous || data.previous,
  );
}
```

Запасные имена в нижнем регистре — страховка «на случай, если придут уже нормализованные
данные». Сейчас в проект такие объекты в `fromJSON` не попадают ниоткуда, так что это
мёртвая ветка; оставлена она была из желания сделать модель всеядной, а по факту
только размывает контракт: непонятно, какой формат всё-таки считается каноническим.

### 5. Рубль добавляется руками, а при недоступности API работает страховка

В ответе ЦБ нет самого рубля — там только иностранные валюты. Поэтому рубль
дособирается в модель вручную, иначе конвертация «из рубля» не нашла бы валюту-источник:

```js
const ruble = new Valute(
  "R00000",
  "643",
  "RUB",
  1,
  "Российский рубль",
  1.0,
  1.0,
);
resultTargetArray = [ruble, ...apiCurrencies];
```

Загрузка обёрнута в `try/catch`: если ЦБ недоступен (а с `file://` или с GitHub Pages
запрос может не пройти по CORS), приложение стартует на резервной паре рубль ↔ австралийский
доллар и остаётся кликаибульным, вместо пустого списка и ошибок в консоли.

### 6. Устройство — часть состояния, а не только CSS

Стилей для смены поведения списка недостаточно: компоненту нужно знать, в каком
из двух режимов он сейчас отрисовывается. Поэтому брейкпоинт слушается в JS и
приходит в стейт событием:

```js
const mediaMobile = window.matchMedia("(max-width: 767px)");
const mediaTablet = window.matchMedia("(max-width: 1023px)");

const handleDeviceChange = () => {
  store.dispatch({
    type: "SET_DEVICE_STATUS",
    payload: {
      isMobile: mediaMobile.matches,
      isTablet: mediaTablet.matches && !mediaMobile.matches,
    },
  });
};

mediaMobile.addEventListener("change", handleDeviceChange);
mediaTablet.addEventListener("change", handleDeviceChange);

handleDeviceChange(); // стартовое значение, до первой перерисовки
```

Три детали. `handleDeviceChange()` вызывается сразу — иначе до первого изменения
размера экранa приложение жило бы с `isMobile: false` даже на телефоне.
`isTablet` вычисляется как «планшет и не телефон», иначе на телефоне оба флага
были бы `true` и проверки в компонентах пришлось бы выстраивать по приоритету.
И, наконец, `change` у `matchMedia` срабатывает только на пересечении границы,
а не на каждом пикселе ресайза — троттлинг не нужен.

Компонент подписывается на стор, но перерисовывает себя только когда устройство
действительно сменилось — своей селекторной подписки в сторе нет, поэтому сравнение
делает сам компонент:

```js
let currentDeviceState = isTablet || isMobile;

store.subscribe(() => {
  const nextDeviceState =
    store.getState().device.isTablet || store.getState().device.isMobile;

  if (currentDeviceState !== nextDeviceState) {
    currentDeviceState = nextDeviceState;
    /* переклеить иконку */
  }
});
```

### 7. Результат пересчёта считается в редьюсере

`SET_AMOUNT` сам находит обе валюты и вызывает `convertTo`, поэтому инпут суммы и блок
с результатом показывают одно значение, а не две версии правды.

## Что улучшил бы

1. **Подписку нельзя отменить.** `subscribe` возвращает `undefined`, а не функцию
   отписки. Сейчас это безопасно (компоненты создаются один раз), но при пересоздании
   блоков слушатели накоплятся и один `dispatch` вызовет их дважды.
2. **`SET_PAGINATION_PAGE` не ограничивает страницы:** `currentPage + action.payload`
   уходит за последнюю страницу и в отрицательные значения. Нужен `Math.min/max` или
   `(page + dir + total) % total`.
3. **Mock показывается молча.** Пользователь не видит, что перед ним не боевые курсы, —
   нужен хотя бы баннер «данные ЦБ недоступны».
4. **Производное значение лежит в стейте.** Результат конвертации — отдельное поле
   `resultConvert` рядом с `amount`. Из-за этого кнопка реверса обязана выстрелить
   ДВАЖДЫ, чтобы на экране появилась правильная цифра:

   ```js
   store.dispatch({ type: "REVERSE_CURRENCIES" });
   store.dispatch({
     type: "SET_AMOUNT",
     payload: freshState.currencyConverter.amount,
   });
   ```

   Второго диспатча не было бы, если бы результат считался селектором из
   `(amount, from, to)`. А пока каждое место, где валюту поменяли, но не пересчитали,
   оставляет на экране устаревшую сумму — и это не обнаруживается ничем, кроме
   внимательности.

5. **`sprite.svg` весит ~1 МБ** и скачивается целиком на первой загрузке, хотя
   используется несколько иконок. Правильно — либо отдельные файлы, либо сборка
   нужной части спрайта.
6. **В корне репозитория лежат `style.css` и `style.css.map`** — артефакты сборки,
   которым место в `.gitignore`.
7. **Брейкпоинты живут в двух местах.** `767px` и `1023px` захардкожены в
   `initResizeListener.js`, а те же значения лежат в SCSS-переменных `$vp-mobile` /
   `$vp-tablet`, из которых собраны миксины `vp-767` и `vp-1023`. Изменишь одну —
   стили и JS-логика разъедутся молча. Надёжный вариант: объявить значение в `:root`
   и читать его из JS через
   `getComputedStyle(document.documentElement).getPropertyValue("--vp-mobile")`,
   тогда источник правды остаётся один.

## Стек

Vanilla JS (ES-модули, top-level await, `matchMedia`) · Vite · Sass (БЭМ,
`_mixins` / `_variables`) · собственный store/reducer · SVG-спрайт · локальные шрифты

## Структура

```
├── index.html
├── public/svg/sprite.svg
└── src/
    ├── classes/     Valute — модель с курсовой арифметикой
    ├── components/  currencyMenu (две стороны конвертера + реверс),
    │                exchangeRates (список курсов + пагинация),
    │                customSelect (свой селект со вводом суммы, ~10 КБ)
    ├── state/       store.js — стор, reducer.js — все изменения состояния
    ├── utils/       loadCurrencies (API + mock), findValuteById,
    │                initResizeListener, createSvgIcon, render
    ├── fonts/       Open Sans, woff/woff2
    └── scss/        global/ (variables, mixins, reboot, btn) + blocks/
```

Поток один: `utils/loadCurrencies` → `state` → `components`, обратных зависимостей нет.

## Запуск

```bash
npm install
npm run dev
```

Сборка — `npm run build`, просмотр собранного — `npm run preview`.

## Про origin

Сделано самостоятельно, вне учебных курсов. Redux подключать было нечего по объёму,
но писать редьюсер «на бумаге» и в проде — разные ощущения, поэтому стор здесь свой:
он даёт ровно тот же набор понятий — состояние, действие, подписка — и при этом
полностью читается за минуту.
