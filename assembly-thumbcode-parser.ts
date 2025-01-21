import { AssemblyInstructionDefinition } from "./AssemblyInstructionDefinition.ts";

const assemblyInstructionsFile = await Deno.readFile(
  "./assembly-instructions.txt"
);

const ASSEMLBY_INSTRUCTIONS: AssemblyInstructionDefinition[] = [];
const decoder = new TextDecoder("utf-8");
const assemblyInstructions = decoder.decode(assemblyInstructionsFile);
assemblyInstructions.split("\n").forEach((instruction) => {
  if (["0", "1"].includes(instruction[0])) {
    ASSEMLBY_INSTRUCTIONS.push(new AssemblyInstructionDefinition(instruction));
  }
});

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
