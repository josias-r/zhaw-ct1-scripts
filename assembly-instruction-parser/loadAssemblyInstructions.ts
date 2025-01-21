import { AssemblyInstructionDefinition } from "./AssemblyInstructionDefinition.ts";

const assemblyInstructionsFile = await Deno.readFile(
  "./assembly-instruction-parser/assembly-instructions.txt"
);

const ASSEMLBY_INSTRUCTIONS: AssemblyInstructionDefinition[] = [];
const decoder = new TextDecoder("utf-8");
const assemblyInstructions = decoder.decode(assemblyInstructionsFile);
assemblyInstructions.split("\n").forEach((instruction) => {
  if (["0", "1"].includes(instruction[0])) {
    ASSEMLBY_INSTRUCTIONS.push(new AssemblyInstructionDefinition(instruction));
  }
});

export { ASSEMLBY_INSTRUCTIONS };
