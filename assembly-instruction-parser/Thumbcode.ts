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
    const prefix = thumbCode.substring(0, lastZeroOrOneIndex);
    const placeholdersString = thumbCode.substring(lastZeroOrOneIndex);

    this.placeholders = placeholdersString;
    this.prefix = prefix;
  }

  public compareToThumbCode(binaryThumbCode: string) {
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
