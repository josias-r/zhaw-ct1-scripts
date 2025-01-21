import { ASSEMLBY_INSTRUCTIONS } from "./assembly-instruction-parser/loadAssemblyInstructions.ts";

function findBestMatch(mnemonicInstruction: string) {
  for (const assemblyInstruction of ASSEMLBY_INSTRUCTIONS) {
    try {
      const didMatch =
        assemblyInstruction.compareToMnemonic(mnemonicInstruction);
      if (didMatch) {
        return { thumbCode: didMatch, assemblyInstruction };
      }
    } catch (error) {
      return error.message;
    }
  }
  return "unknown";
}

const assemblyInputFile = await Deno.readFile(
  "./assembly-input.txt"
);

const decoder = new TextDecoder("utf-8");
const assemblyInput = decoder.decode(assemblyInputFile);

let output = "";
assemblyInstructions.split("\n").forEach((inputLine) => {
  const bestMatch = findBestMatch(inputLine);

  if (typeof bestMatch === "object") {
    output += "\n" + "valid: " + bestMatch.thumbCode + " (" + inputLine + ")";
  } else {
    output += "\n" + "invalid: " + bestMatch + " (" + inputLine + ")";
  }
});

await Deno.writeTextFile("./assembly-output.txt", output);
