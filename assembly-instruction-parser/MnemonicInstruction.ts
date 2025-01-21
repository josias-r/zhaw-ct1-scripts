function splitAtFirst(str: string, delimiter: string) {
  const index = str.indexOf(delimiter);
  if (index === -1) return [str]; // delimiter not found
  return [str.substring(0, index), str.substring(index + delimiter.length)];
}

type MnemonicInstructionDetails = {
  mnemonic: string;
  instruction: string[];
  comment: string[];
};

class MnemonicInstruction {
  mnemonic: string;
  instruction: string[];
  comment: string[];

  constructor(details: MnemonicInstructionDetails);
  constructor(fullInstruction: string);
  constructor(fullInstruction: string | MnemonicInstructionDetails) {
    const { mnemonic, instruction, comment } =
      typeof fullInstruction === "string"
        ? this.parseFullInstruction(fullInstruction)
        : fullInstruction;

    if (!mnemonic.trim() || !instruction.length || !comment.length) {
      console.error({
        mnemonic,
        instruction,
        comment,
      });
      throw new Error("Invalid instruction");
    }

    this.mnemonic = mnemonic.trim();
    this.instruction = instruction;
    this.comment = comment;
  }

  private parseFullInstruction(
    fullInstruction: string
  ): MnemonicInstructionDetails {
    const subStrings = fullInstruction.split("\\\\n");
    if (subStrings.length > 1) {
      const multiInstructions = subStrings.reduce<MnemonicInstructionDetails>(
        (acc, subString) => {
          const { mnemonic, instruction, comment } =
            this.parseFullInstruction(subString);
          return {
            mnemonic: mnemonic,
            instruction: [...acc.instruction, ...instruction],
            comment: [...acc.comment, ...comment],
          };
        },
        {
          mnemonic: "",
          instruction: [],
          comment: [],
        }
      );

      return multiInstructions;
    }
    const [restMnemonicParts, comment] = fullInstruction.split(";");
    const mnemonicParts = splitAtFirst(restMnemonicParts, " ");
    const mnemonic = mnemonicParts[0];
    const instruction = mnemonicParts[1];
    return {
      mnemonic,
      instruction: [instruction.trim()],
      comment: [comment.trim()],
    };
  }

  public insertPlaceholderValues(
    instructions: string[],
    comments: string[],
    letter: string,
    binaryValue: string
  ) {
    const searchTerm = letter.repeat(binaryValue.length);

    const replaceInString = (str: string) => {
      const COLOR_END = "\x1b[0m";

      if (letter === "i") {
        const COLOR_START = "\x1b[33m";

        const binaryRegex = new RegExp(`(0b[01]*)${searchTerm}([01]*)`, "g");
        const filledBinary = str.replaceAll(binaryRegex, `$1${binaryValue}$2`);
        return filledBinary.replaceAll(/0b[01]+/g, (match) => {
          return (
            COLOR_START +
            "#0x" +
            parseInt(`0${match.substring(2)}`, 2)
              .toString(16)
              .toUpperCase() +
            COLOR_END
          );
        });
      }
      if (letter === "r") {
        const COLOR_START = "\x1b[31m";

        return str.replaceAll(
          searchTerm,
          COLOR_START + binaryValue + COLOR_END
        );
      }

      const COLOR_START = "\x1b[36m";
      return str.replaceAll(
        searchTerm,
        COLOR_START + parseInt(`0${binaryValue}`, 2).toString() + COLOR_END
      );
    };

    const instruction = instructions.map(replaceInString);
    const comment = comments.map(replaceInString);
    return [instruction, comment];
  }

  public toString() {
    const renderedLines = this.instruction.map((instruction, idx) => {
      const comment = this.comment[idx] || "";
      return `${this.mnemonic} ${instruction} ; ${comment}`;
    });

    return renderedLines.join("\n");
  }
}

export { MnemonicInstruction };
