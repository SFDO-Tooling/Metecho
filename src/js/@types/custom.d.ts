/* eslint-disable one-var */

declare module '*.svg' {
  const svgVal: string;
  export default svgVal;
}

declare module '*.png' {
  const pngVal: string;
  export default pngVal;
}

// TypeScript renamed "PositionError" to "GeolocationPositionError",
// but some packages (e.g. react-fns) still reference the old name.
type PositionError = GeolocationPositionError;
