const COLOR_END = "\x1b[0m";
const COLOR_RED = "\x1b[31m";
const COLOR_ORANGE = "\x1b[33m";
const COLOR_CYAN = "\x1b[36m";

function colorize(clr: "red" | "orange" | "cyan", str: string) {
  let colorStart;
  switch (clr) {
    case "red":
      colorStart = COLOR_RED;
      break;
    case "orange":
      colorStart = COLOR_ORANGE;
      break;
    case "cyan":
      colorStart = COLOR_CYAN;
      break;
    default:
      throw new Error("Invalid color");
  }

  return colorStart + str + COLOR_END;
}

export { colorize };
