const { exec } = require("child_process");
require("dotenv").config();
const { v4: uuidv4 } = require("uuid");
const AWS = require("aws-sdk");
var fs = require("fs");
var args = process.argv.slice(2);
var command = args[0];
const MASTER_KEY_PATH = "/home/ubuntu/abe/master_key";
const PUB_KEY_PATH = "/home/ubuntu/abe/pub_key";
console.log(args);

const express = require("express");
const app = express();
var cors = require("cors");
const bodyParser = require("body-parser");
const router = express.Router();
const PORT = 3000;
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.listen(PORT, (error) => {
  if (!error)
    console.log(
      "Server is Successfully Running, and App is listening on port " + PORT
    );
  else console.log("Error occurred, server can't start", error);
});

// add router in the Express app.
app.use("/", router);

app.get("/", function (req, res, next) {
  res.json({ msg: "Hello World" });
});

router.post("/new", (request, response) => {
  //code to perform particular action.
  //To access POST variable use req.body()methods.
  console.log(request.body);
  let set_id = uuidv4();
  // TODO: ADD ALL DATA TO DATABASE
  response.json({ msg: "Success", setID: set_id });
});

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const uploadFile = async (localFilePath, cloudFilePath) => {
  const filename = localFilePath;
  const fileContent = fs.readFileSync(filename);

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `${cloudFilePath}`,
    Body: fileContent,
  };

  // s3.upload(params, (err, data) => {
  //   if (err) {
  //     console.log(err);
  //   }

  //   return data.Location;
  // });

  const data = await s3.upload(params).promise(); // this line
  console.log(`File uploaded successfully. ${data.Location}`);
  return data.Location;
};

// uploadFile(
//   "/home/ubuntu/steganography-server/test-files/testkey.txt",
//   "keys/testkey.txt"
// ).then((url) => console.log(url));

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
  /*
  cpabe-keygen -o kevin_priv_key pub_key master_key \
    business_staff strategy_team 'executive_level = 7' \
    'office = 2362' 'hire_date = '`date +%s`
  */
  let attrJoin = attributes.join(" ");
  // console.log(
  //   `cpabe-keygen -o ${keyName} ${PUB_KEY_PATH} ${MASTER_KEY_PATH} ${attrJoin}`
  // );

  executeTerminalCommand(
    `cpabe-keygen -o ${keyName} ${PUB_KEY_PATH} ${MASTER_KEY_PATH} ${attrJoin}`
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
