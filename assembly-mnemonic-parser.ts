import { AssemblyInstructionDefinition } from "./assembly-instruction-parser/AssemblyInstructionDefinition.ts";
import { ASSEMLBY_INSTRUCTIONS } from "./assembly-instruction-parser/loadAssemblyInstructions.ts";

const searchThumbCode = prompt("Please enter a searchThumbCode:");

// const searchThumbCode = "0100 0111 0010 1010";
if (!searchThumbCode) {
  throw new Error("Invalid searchThumbCode");
}

const bestMatch =
  ASSEMLBY_INSTRUCTIONS.reduce<AssemblyInstructionDefinition | null>(
    (currentBestMatch, assemblyInstruction) => {
      const matchLength =
        assemblyInstruction.compareToThumbCode(searchThumbCode);
      const currentBestMatchLength =
        currentBestMatch?.compareToThumbCode(searchThumbCode) || 0;

      if (matchLength > 0 && matchLength === currentBestMatchLength) {
        console.warn("Two equally good matches found!");
      }

      if (matchLength > 0 && matchLength > currentBestMatchLength) {
        return assemblyInstruction;
      }

      return currentBestMatch;
    },
    null
  );

if (bestMatch) {
  console.log(bestMatch.getMnemonicWithValues(searchThumbCode).toString());
} else {
  console.warn("No match found!");
}
