import LZString from 'lz-string';

export const compressQuizData = (data) => {
  const jsonStr = JSON.stringify(data);
  return LZString.compressToEncodedURIComponent(jsonStr);
};

export const decompressQuizData = (encodedStr) => {
  const jsonStr = LZString.decompressFromEncodedURIComponent(encodedStr);
  if (!jsonStr) return null;
  return JSON.parse(jsonStr);
};
