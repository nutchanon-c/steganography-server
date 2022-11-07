const { exec } = require("child_process");
var args = process.argv.slice(2);
var command = args[0];
console.log(args);

const executeTerminalCommand = (command) => {
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
  });
};

const generateABEKey = (attributes) => {
  // TODO: implement
};

switch (command) {
  case "gen":
    console.log("generate");
    let attributes = args.slice(1);
    generateABEKey(attributes);
    break;
  default:
    console.log("unknown command");
    break;
}
