import { MnemonicInstruction } from "./MnemonicInstruction.ts";
import { Thumbcode } from "./Thumbcode.ts";

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
