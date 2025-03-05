import readline from "readline";
import TailFile from "@logdna/tail-file";

export async function startTail(file: string, onLine: (line: string) => void) {
  const tail = new TailFile(file).on("tail_error", (err) => {
    console.error("TailFile had an error!", err);
  });

  try {
    console.debug("Tailing file", file);
    await tail.start();
    const linesplitter = readline.createInterface({
      input: tail,
    });

    linesplitter.on("line", onLine);
  } catch (err) {
    console.error("Cannot start.  Does the file exist?", err);
  }
}
