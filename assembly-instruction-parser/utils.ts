function splitAtFirst(str: string, delimiter: string) {
  const index = str.indexOf(delimiter);
  if (index === -1) return [str]; // delimiter not found
  return [str.substring(0, index), str.substring(index + delimiter.length)];
}

export { splitAtFirst };
