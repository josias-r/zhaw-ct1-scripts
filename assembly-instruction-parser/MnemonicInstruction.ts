import { colorize } from "./colorize.ts";
import { splitAtFirst } from "./utils.ts";

function escapeRegex(string: string) {
  return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, "\\$&");
}

const REGISTER_TEMPLATE_REGEX = /(R[t]+|R[n]+|R[m]+|R[d]+)/g;
const IMMEDIATE_TEMPLATE_REGEX = /#0b[01]*[i]+[01]*/g;
const REGISTER_REGEX_STRING = "R\\d+";
const REGISTER_REGEX = new RegExp(REGISTER_REGEX_STRING, "g");
const IMMEDIATE_REGEX_STRING = "#(0x[0-9a-fA-F]+|0b[01]+|\\d+)";
const IMMEDIATE_REGEX = new RegExp(IMMEDIATE_REGEX_STRING, "g");
const REGISTER_MASK_TEMPLATE_REGEX = /reg0\\-7/g;
const REGISTER_MASK_REGEX_STRING = "(R\\d+, )*(R\\d+)";
const REGISTER_MASK_REGEX = new RegExp(REGISTER_MASK_REGEX_STRING + "}", "g");

type MnemonicInstructionDetails = {
  mnemonic: string;
  instruction: string[];
  comment: string[];
};

function parseIntValue(value: string) {
  if (value.startsWith("0x")) {
    return parseInt(value.substring(2), 16);
  }
  if (value.startsWith("0b")) {
    return parseInt(value.substring(2), 2);
  }
  return parseInt(value, 10);
}

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

  public compareToMnemonic(
    mnemonicInstruction: string
  ): false | [string, string][] {
    const [mnemonic, cleanInstruction] = splitAtFirst(mnemonicInstruction, " ");
    if (mnemonic !== this.mnemonic) {
      return false;
    }

    for (const instruction of this.instruction) {
      const match = this.matchInstruction(instruction, cleanInstruction);
      if (match) {
        return match;
      }
    }
    return false;
  }

  private matchInstruction(instruction: string, cleanInstruction: string) {
    // instruction stored as: LDR Rttt, [Rnnn, #0b0iiiii00]
    // we replace all R[tndm] the registerRegex
    let didMatchRegisterMaskTemplate = false;
    const matchedRegistersTemplate: string[] = [];
    const matchedImmediatesTemplate: string[] = [];
    const replacedTemplates = escapeRegex(instruction)
      .replaceAll(REGISTER_MASK_TEMPLATE_REGEX, () => {
        didMatchRegisterMaskTemplate = true;

        return REGISTER_MASK_REGEX_STRING;
      })
      .replaceAll(REGISTER_TEMPLATE_REGEX, (match) => {
        matchedRegistersTemplate.push(match);

        return REGISTER_REGEX_STRING;
      })
      .replaceAll(IMMEDIATE_TEMPLATE_REGEX, (match) => {
        matchedImmediatesTemplate.push(match);
        return IMMEDIATE_REGEX_STRING;
      });

    if (new RegExp(replacedTemplates).test(cleanInstruction)) {
      const registerMasksDict: [string, string][] = didMatchRegisterMaskTemplate
        ? [["r", "RRRRRRRR"]]
        : [];
      const matchedRegisters: string[] = [];
      const matchedImmediates: string[] = [];

      cleanInstruction
        .replaceAll(REGISTER_MASK_REGEX, (match) => {
          matchedRegisters.push(match);
          return "";
        })
        .replaceAll(REGISTER_REGEX, (match) => {
          matchedRegisters.push(match);
          return "";
        })
        .replaceAll(IMMEDIATE_REGEX, (match) => {
          matchedImmediates.push(match);
          return "";
        });

      const registerMatchDict: [string, string][] = didMatchRegisterMaskTemplate
        ? []
        : matchedRegisters.map((register, idx) => {
            const template = matchedRegistersTemplate[idx].substring(1);
            const binary = parseInt(register.substring(1)).toString(2);
            if (template.length < binary.length) {
              throw new Error("Invalid register length");
            }
            const zeroes = "0".repeat(template.length - binary.length);
            const binaryValue = zeroes + binary;

            return [template[0], binaryValue];
          });

      const immediateMatchDict: [string, string][] =
        didMatchRegisterMaskTemplate
          ? []
          : matchedImmediates.map((immediate, idx) => {
              const template = matchedImmediatesTemplate[idx];
              const intValue = parseIntValue(immediate.substring(1));
              const binary = intValue.toString(2);
              // i.e iiii00
              // or  iiii
              const templatePlaceholder = "i" + splitAtFirst(template, "i")[1];
              if (templatePlaceholder.length < binary.length) {
                throw new Error("Invalid immediate length");
              }
              const [IIIIII, addedZeroes] = splitAtFirst(
                templatePlaceholder + "0",
                "0"
              );
              // i.e. 01 => 0001 if template is iiii
              // or.  0111 => 000111 if template is iiii00
              const binaryPadded =
                "0".repeat(templatePlaceholder.length - binary.length) + binary;

              if (addedZeroes.length) {
                // ensure the parsed binary also ends with the amount of zeroes
                const binarySuffix = binaryPadded.substring(IIIIII.length);

                if (binarySuffix !== addedZeroes) {
                  throw new Error(
                    "Binary does not end with " +
                      addedZeroes +
                      " got " +
                      binary +
                      " (this might be allowed if cut off)"
                  );
                }
              }

              const binaryIIs = binaryPadded.substring(0, IIIIII.length);
              return ["i", binaryIIs];
            });

      return [
        ...registerMasksDict,
        ...registerMatchDict,
        ...immediateMatchDict,
      ];
    }

    return false;
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
      if (letter === "i") {
        const binaryRegex = new RegExp(`(0b[01]*)${searchTerm}([01]*)`, "g");
        const filledBinary = str.replaceAll(binaryRegex, `$1${binaryValue}$2`);
        return filledBinary.replaceAll(/0b[01]+/g, (match) => {
          return colorize(
            "orange",
            "0x" +
              parseInt(`0${match.substring(2)}`, 2)
                .toString(16)
                .toUpperCase()
          );
        });
      }
      if (letter === "r") {
        return str.replaceAll(searchTerm, colorize("red", binaryValue));
      }

      return str.replaceAll(
        searchTerm,

        colorize("cyan", parseInt(`0${binaryValue}`, 2).toString())
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
