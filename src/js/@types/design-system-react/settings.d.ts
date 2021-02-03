export const settings: {
  setAssetsPaths: (path: string) => void;
  getAssetsPaths: () => string;
  setAppElement: (el: Element) => void;
  getAppElement: () => Element | undefined;
};
export default settings;
