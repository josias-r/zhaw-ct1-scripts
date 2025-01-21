import { ASSEMLBY_INSTRUCTIONS } from "./assembly-instruction-parser/loadAssemblyInstructions.ts";

const mnemonicInstruction = prompt("Please enter a mnemonicInstruction:");
// const mnemonicInstruction = "LDR R7, [R2, #0x4]";
// const mnemonicInstruction = "POP {PC,R1,R3}";
// const mnemonicInstruction = "STMIA R7! {R1,R3}"; // BROKERN
// const mnemonicInstruction = "STR R7, [R2, R3]";

function findBestMatch() {
  for (const assemblyInstruction of ASSEMLBY_INSTRUCTIONS) {
    if (!mnemonicInstruction) {
      throw new Error("Invalid mnemonicInstruction");
    }

    try {
      const didMatch =
        assemblyInstruction.compareToMnemonic(mnemonicInstruction);
      if (didMatch) {
        return { thumbCode: didMatch, assemblyInstruction };
      }
    } catch (error) {
      console.error(error);
    }
  }
  return null;
}

const bestMatch = findBestMatch();

if (bestMatch) {
  console.log(bestMatch.thumbCode);
  console.log(bestMatch.assemblyInstruction.toString());
} else {
  console.warn("No match found!");
}
