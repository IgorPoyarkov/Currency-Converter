import store from "../state/store";

export default function initResizeListener() {
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

  handleDeviceChange();
}
