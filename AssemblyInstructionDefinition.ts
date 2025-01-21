function splitAtFirst(str: string, delimiter: string) {
  const index = str.indexOf(delimiter);
  if (index === -1) return [str]; // delimiter not found
  return [str.substring(0, index), str.substring(index + delimiter.length)];
}

class ThumbcodePlaceholders {
  //   placeholders: {
  //     letter: string;
  //     length: number;
  //   }[] = [];

  placeholdersString: string;

  constructor(placeholdersString: string) {
    this.placeholdersString = placeholdersString;
    // // split every time the letter changes, i.e. nnnmmmtt -> [nnn, mmm, tt]
    // // $ is a special character to also count the last letter
    // const placeholders = `${placeholdersString}$`.split("").reduce<{
    //   result: {
    //     letter: string;
    //     length: number;
    //   }[];
    //   current: {
    //     letter: string;
    //     length: number;
    //   };
    // }>(
    //   ({ result, current }, letter) => {
    //     const letterDidChange = current.letter !== letter;
    //     console.log(current.letter, letter, letterDidChange);
    //     if (letterDidChange) {
    //       result.push({ ...current });
    //       current.letter = letter;
    //       current.length = 1;
    //     } else {
    //       current.length++;
    //     }
    //     return {
    //       result: result,
    //       current: current,
    //     };
    //   },
    //   {
    //     result: [],
    //     current: {
    //       letter: placeholdersString[0],
    //       length: 0,
    //     },
    //   }
    // );
    // this.placeholders = placeholders.result;
    // if (this.toString() !== placeholdersString) {
    //   throw new Error("Issue encountered while parsing placeholders");
    // }
  }

  public traversePlaceholders(cb: (letter: string, idx: number) => void) {
    this.placeholdersString.split("").forEach(cb);
  }

  public toString() {
    return this.placeholdersString;
  }
}

class Thumcode {
  prefix: string;
  placeholders: ThumbcodePlaceholders;
  get thumbCode() {
    const fullThumbCode = this.prefix + this.placeholders.toString();
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
    this.placeholders = new ThumbcodePlaceholders(placeholdersString);

    this.prefix = prefix;
  }

  public compareToThumbCode(binaryThumbCode: string) {
    if (binaryThumbCode.startsWith(this.prefix)) {
      return this.prefix.length;
    }

    return 0;
  }

  public toString() {
    return this.thumbCode;
  }
}

class MnemonicInstruction {
  mnemonic: string;
  instruction: string;
  comment: string;

  constructor(details: {
    mnemonic: string;
    instruction: string;
    comment: string;
  });
  constructor(fullInstruction: string);
  constructor(
    fullInstruction:
      | string
      | {
          mnemonic: string;
          instruction: string;
          comment: string;
        }
  ) {
    if (typeof fullInstruction === "object") {
      this.mnemonic = fullInstruction.mnemonic;
      this.instruction = fullInstruction.instruction;
      this.comment = fullInstruction.comment;

      if (!this.mnemonic || !this.instruction || !this.comment) {
        throw new Error("Invalid instruction format");
      }
      return;
    }

    const [restMnemonicParts, comment] = fullInstruction.split(";");
    const mnemonicParts = splitAtFirst(restMnemonicParts, " ");
    const mnemonic = mnemonicParts[0];
    const instruction = mnemonicParts[1];

    this.mnemonic = mnemonic;
    this.instruction = instruction;
    this.comment = comment;

    if (!this.mnemonic || !this.instruction || !this.comment) {
      throw new Error("Invalid instruction format");
    }
  }

  public toString() {
    return `${this.mnemonic} ${this.instruction} ; ${this.comment}`;
  }
}

class AssemblyInstructionDefinition {
  thumbCode: Thumcode;
  mnemonic: MnemonicInstruction;

  constructor(instruction: string) {
    // instruction example:
    // 0000 0000 00mm mddd MOVS Rddd, Rmmm ; Rddd = Rmmm
    const thumbCode = instruction.substring(0, 19).replace(/\s/g, "");
    const mnemonicInstructionString = instruction.substring(20);

    this.thumbCode = new Thumcode(thumbCode.trim());
    this.mnemonic = new MnemonicInstruction(mnemonicInstructionString);
  }

  public compareToThumbCode(binaryThumbCode: string) {
    return this.thumbCode.compareToThumbCode(binaryThumbCode);
  }

  public getMnemonicWithValues(binaryThumbCode: string) {
    const cleanBinaryThumbCode = binaryThumbCode.replace(/\s/g, "");

    const matchLength = this.compareToThumbCode(cleanBinaryThumbCode);
    if (matchLength === 0) {
      throw new Error("Binary thumb code does not match this instruction");
    }

    const thumbCodeWithoutPrefix = cleanBinaryThumbCode.substring(matchLength);

    const placeholdersDictionary: {
      [key: string]: {
        binaryValue: string;
      };
    } = {};
    this.thumbCode.placeholders.traversePlaceholders((letter, idx) => {
      const bitValue = thumbCodeWithoutPrefix[idx];

      if (!placeholdersDictionary[letter]) {
        placeholdersDictionary[letter] = {
          binaryValue: "",
        };
      }

      placeholdersDictionary[letter].binaryValue += bitValue;
    });

    let mnemonicInstruction = this.mnemonic.instruction;
    let mnemonicComment = this.mnemonic.comment;

    Object.entries(placeholdersDictionary).forEach(
      ([letter, { binaryValue }]) => {
        const searchTerm = letter.repeat(binaryValue.length);
        mnemonicInstruction = mnemonicInstruction.replaceAll(
          searchTerm,
          parseInt(`0${binaryValue}`, 2).toString()
        );
        mnemonicComment = mnemonicComment.replaceAll(
          searchTerm,
          parseInt(`0${binaryValue}`, 2).toString()
        );
      }
    );

    return new MnemonicInstruction({
      mnemonic: this.mnemonic.mnemonic,
      instruction: mnemonicInstruction,
      comment: mnemonicComment,
    });
  }

  public toString() {
    return `${this.thumbCode} ${this.mnemonic.toString()}`;
  }
}

export { AssemblyInstructionDefinition };
