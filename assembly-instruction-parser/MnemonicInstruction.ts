function splitAtFirst(str: string, delimiter: string) {
  const index = str.indexOf(delimiter);
  if (index === -1) return [str]; // delimiter not found
  return [str.substring(0, index), str.substring(index + delimiter.length)];
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

export { MnemonicInstruction };
