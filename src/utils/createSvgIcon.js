export default function createSvgIcon(iconId, className) {
  const svgNamespace = "http://www.w3.org/2000/svg";

  const svgEl = document.createElementNS(svgNamespace, "svg");
  if (className) {
    svgEl.setAttribute("class", className);
  }

  const useEl = document.createElementNS(svgNamespace, "use");

  useEl.setAttribute("href", `../../public/svg/sprite.svg#${iconId}`);

  svgEl.append(useEl);

  return svgEl;
}
