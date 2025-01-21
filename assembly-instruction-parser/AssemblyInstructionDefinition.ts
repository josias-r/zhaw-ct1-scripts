import { colorize } from "./colorize.ts";
import { MnemonicInstruction } from "./MnemonicInstruction.ts";
import { Thumbcode } from "./Thumbcode.ts";
import { splitAtFirst } from "./utils.ts";

class AssemblyInstructionDefinition {
  thumbCode: Thumbcode;
  mnemonic: MnemonicInstruction;

  constructor(instruction: string) {
    // instruction example:
    // 0000 0000 00mm mddd MOVS Rddd, Rmmm ; Rddd = Rmmm
    const thumbCode = instruction.substring(0, 19).replace(/\s/g, "");
    const mnemonicInstructionString = instruction.substring(20);

    this.thumbCode = new Thumbcode(thumbCode.trim());
    this.mnemonic = new MnemonicInstruction(mnemonicInstructionString);
  }

  public compareToThumbCode(binaryThumbCode: string) {
    const cleanBinaryThumbCode = binaryThumbCode.replace(/\s/g, "");
    return this.thumbCode.compareToThumbCode(cleanBinaryThumbCode);
  }

  public compareToMnemonic(mnemonicInstruction: string): false | string {
    const [mnemonic, instruction] = splitAtFirst(
      mnemonicInstruction.trim(),
      " "
    );
    if (!mnemonic) {
      throw new Error("Invalid mnemonic instruction");
    }

    // remove all spaces
    const cleanInstruction = instruction.replace(/\s/g, "");
    // insert spaces again, but only after commas
    const cleanInstructionWithSpaces = cleanInstruction.replace(/,/g, ", ");

    const match = this.mnemonic.compareToMnemonic(
      `${mnemonic} ${cleanInstructionWithSpaces}`
    );
    if (match) {
      return this.buildBinaryThumbCodeFromMatchDict(match);
    }

    return false;
  }

  private buildBinaryThumbCodeFromMatchDict(
    matchDict: [string, string][]
  ): string {
    const matchDictWithState: {
      [key: string]: {
        binaryValue: string;
        currentIdx: number;
      };
    } = {};
    matchDict.forEach(([letter, value]) => {
      if (matchDictWithState[letter]) {
        if (matchDictWithState[letter].binaryValue !== value) {
          throw new Error(
            "Duplicate placeholder values found but values are different"
          );
        }
      }

      matchDictWithState[letter] = {
        binaryValue: value,
        currentIdx: 0,
      };
    });

    const placeholders = this.thumbCode.placeholders.split("");
    const mappedPlaceholders = placeholders.map((placeholder) => {
      const corrsepondingMatch = matchDictWithState[placeholder];
      if (!corrsepondingMatch) {
        throw new Error("Missing value for placeholder");
      }
      const correspondingValue =
        corrsepondingMatch.binaryValue[corrsepondingMatch.currentIdx];
      corrsepondingMatch.currentIdx++;

      switch (placeholder) {
        case "m":
        case "n":
        case "t":
        case "d":
          return colorize("cyan", correspondingValue);
        case "i":
          return colorize("orange", correspondingValue);
        case "r":
          return colorize("red", correspondingValue);
        default:
          throw new Error("Unknown placeholder");
      }
    });

    // validate all where used
    Object.keys(matchDictWithState).forEach((key) => {
      if (
        matchDictWithState[key].currentIdx !==
        matchDictWithState[key].binaryValue.length
      ) {
        throw new Error("Not all placeholder values were used");
      }
    });

    const fullBinaryString = [
      ...this.thumbCode.prefix.split(""),
      ...mappedPlaceholders,
    ].flatMap((item, idx) => {
      if (idx % 4 === 0 && idx !== 0) {
        return [" ", item];
      }
      return [item];
    });

    return fullBinaryString.join("");
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

    this.thumbCode.traversePlaceholders((letter, idx) => {
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
        [mnemonicInstruction, mnemonicComment] =
          this.mnemonic.insertPlaceholderValues(
            mnemonicInstruction,
            mnemonicComment,
            letter,
            binaryValue
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
