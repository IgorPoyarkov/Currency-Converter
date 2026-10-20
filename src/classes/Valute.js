export default class Valute {
  constructor(
    id = "1",
    numCode = "",
    charCode = "",
    nominal = 1,
    name = "",
    value = 1.0,
    previous = 1.0,
  ) {
    this._id = id;
    this._numCode = numCode;
    this._charCode = charCode;
    this._nominal = nominal;
    this._name = name;
    this._value = value;
    this._previous = previous;
  }

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

  get singleValue() {
    return this._value / this._nominal;
  }

  get difference() {
    return Number((this._value - this._previous).toFixed(4));
  }

  get id() {
    return this._id;
  }
  get numCode() {
    return this._numCode;
  }
  get charCode() {
    return this._charCode;
  }
  get nominal() {
    return this._nominal;
  }
  get name() {
    return this._name;
  }
  get value() {
    return this._value;
  }
  get previous() {
    return this._previous;
  }

  convertTo(amount, targetValuteInstance) {
    if (!targetValuteInstance) return 0;
    const fromPriceInRubles = this.singleValue;
    const toPriceInRubles = targetValuteInstance.singleValue;
    return amount * (fromPriceInRubles / toPriceInRubles);
  }
}
