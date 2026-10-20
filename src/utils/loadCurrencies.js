import Valute from "../classes/Valute";

export async function loadCurrencies() {
  let resultTargetArray = [];
  let formattedDate = new Date().toLocaleDateString("ru-RU");

  try {
    const response = await fetch("https://www.cbr-xml-daily.ru/daily_json.js");
    const data = await response.json();

    const apiCurrencies = Object.values(data.Valute).map((valuteData) =>
      Valute.fromJSON(valuteData),
    );

    formattedDate = new Date(data.Date).toLocaleDateString("ru-RU");

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
  } catch (error) {
    console.error(
      "Ошибка при загрузке API, включена оффлайн-страховка:",
      error,
    );

    const ruble = new Valute(
      "R00000",
      "643",
      "RUB",
      1,
      "Российский рубль",
      1.0,
      1.0,
    );
    const mockAud = new Valute(
      "R01010",
      "036",
      "AUD",
      1,
      "Австралийский доллар",
      61.5983,
      61.7408,
    );
    resultTargetArray = [ruble, mockAud];
  }

  return { allCurrencies: resultTargetArray, formattedDate: formattedDate };
}
