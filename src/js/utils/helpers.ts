export const trackPagination = (coordinates: number, action: any): void => {
  const scrollHeight =
    (document.documentElement && document.documentElement.scrollHeight) ||
    (document.body && document.body.scrollHeight) ||
    Infinity;
  const clientHeight =
    (document.documentElement && document.documentElement.clientHeight) ||
    window.innerHeight;
  // Fetch more products if within 100px of bottom of page...
  const scrolledToBottom =
    scrollHeight - Math.ceil(coordinates + clientHeight) <= 100;

  /* istanbul ignore else */
  if (scrolledToBottom) {
    action();
  }
};
