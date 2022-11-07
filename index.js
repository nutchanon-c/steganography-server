const { exec } = require("child_process");
var args = process.argv.slice(2);
var command = args[0];
const MASTER_KEY_PATH = "/home/ubuntu/abe/master_key";
const PUB_KEY_PATH = "/home/ubuntu/abe/pub_key";
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

const generateABEKey = (attributes, keyName) => {
  // TODO: implement
  /*
  cpabe-keygen -o kevin_priv_key pub_key master_key \
    business_staff strategy_team 'executive_level = 7' \
    'office = 2362' 'hire_date = '`date +%s`
  */

  executeTerminalCommand(
    `cpabe-keygen -o ${keyName} ${PUB_KEY_PATH} ${MASTER_KEY_PATH} ${attributes}`
  );

  console.log(`${keyName} generated`);
};

switch (command) {
  case "gen":
    console.log("generate");
    let keyName = args[1];
    let attributes = args.slice(2);
    console.log(`keyname: ${keyName}`);
    console.log(`attributes: ${attributes}`);
    if (attributes.length > 0) {
      generateABEKey(attributes, keyName);
    } else {
      console.log("Please specify at least 1 attribute");
    }
    break;
  default:
    console.log("unknown command");
    break;
}
