class Thumbcode {
  prefix: string;
  placeholders: string;

  get thumbCode() {
    const fullThumbCode = this.prefix + this.placeholders;
    // split into groups of 4
    const groups = fullThumbCode.match(/.{1,4}/g);
    return groups?.join(" ") || "";
  }

  constructor(thumbCode: string) {
    if (thumbCode.length !== 16) {
      throw new Error("Thumb code must be 16 characters long");
    }
    // split at first NOT 0 or 1
    const lastZeroOrOneIndex = thumbCode.search(/[^01]/);
    const actualSplitIndex =
      lastZeroOrOneIndex === -1 ? 16 : lastZeroOrOneIndex;

    const prefix = thumbCode.substring(0, actualSplitIndex);
    const placeholdersString = thumbCode.substring(actualSplitIndex);

    this.placeholders = placeholdersString;
    this.prefix = prefix;
  }

  public compareToThumbCode(binaryThumbCode: string) {
    if (binaryThumbCode.length !== 16) {
      throw new Error("Binary thumb code must be 16 characters long");
    }
    if (binaryThumbCode.startsWith(this.prefix)) {
      return this.prefix.length;
    }

    return 0;
  }

  public traversePlaceholders(cb: (letter: string, idx: number) => void) {
    this.placeholders.split("").forEach(cb);
  }

  public toString() {
    return this.thumbCode;
  }
}

export { Thumbcode };
