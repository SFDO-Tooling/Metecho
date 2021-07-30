/* eslint-disable one-var */

declare module '*.svg' {
  let svgVal: string;
  export default svgVal;
}

declare module '*.svg?raw' {
  let svgVal: string;
  export default svgVal;
}

declare module '*.png' {
  let pngVal: string;
  export default pngVal;
}

// TypeScript renamed "PositionError" to "GeolocationPositionError",
// but some packages (e.g. react-fns) still reference the old name.
type PositionError = GeolocationPositionError;
