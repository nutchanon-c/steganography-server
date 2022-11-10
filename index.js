// const { exec } = require("child_process");
import exec from "child_process";
// require("dotenv").config();
import dotenv from "dotenv";
dotenv.config();
// const { v4: uuidv4 } = require("uuid");
import { v4 as uuidv4 } from "uuid";
// const AWS = require("aws-sdk");
import AWS from "aws-sdk";
// import aw
// var fs = require("fs");
import fs from "fs";
var args = process.argv.slice(2);
var command = args[0];
const MASTER_KEY_PATH = "/home/ubuntu/abe/master_key";
const PUB_KEY_PATH = "/home/ubuntu/abe/pub_key";
const TEST_DOWNLOAD_URL =
  "https://ohmme888.s3.ap-southeast-1.amazonaws.com/911f4d34-829d-44a4-87de-886f0160be08/2.jpg";
console.log(args);

// const express = require("express");
import express from "express";
const app = express();
// var cors = require("cors");
import cors from "cors";
// const bodyParser = require("body-parser");
import bodyParser from "body-parser";
// const { createImageSet } = require("./gdb/gdb");
import https from "https";
import fetch from "node-fetch";
import {
  createESK,
  createImageSet,
  createPerson,
  createR_DataOwner_ImageSet,
  createR_EncSK_ImageSet,
  createR_SG_EncSK,
  createR_SG_ImageSet,
  createStegoImage,
} from "./gdb.js";
const router = express.Router();
const PORT = 3000;

const checkArrayEqual = (arr1, arr2) => {
  return arr1.sort().join(",") === arr2.sort().join(",");
};

const downloadFile = async (url, fileName) => {
  // const https = require("https"); // or 'https' for https:// URLs
  // const fs = require("fs");
  // const fetch = require("node-fetch");
  if (!fs.existsSync("./downloads")) {
    fs.mkdirSync("./downloads");
  }
  const file = fs.createWriteStream(`./downloads/${fileName}`);
  // https.get(url).then((response) => {
  //   response.pipe(file);
  //   // after download completed close filestream
  //   file.on("finish", () => {
  //     file.close();
  //     console.log("Download Completed");
  //     return `./downloads/${fileName}`;
  //   });
  //   return false;
  // });
  fetch(url).then((response) => {
    response.body.pipe(file);
    // after download completed close filestream
    file.on("finish", () => {
      file.close();
      console.log("Download Completed");
      return `./downloads/${fileName}`;
    });
    return false;
  });
};

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

router.post("/new", async (request, response) => {
  //code to perform particular action.
  //To access POST variable use req.body()methods.
  console.log(request.body);
  let set_id = uuidv4();
  createPerson(request.body.uuid, ["attr1", "attr2"]).then(() => {
    // createImageSet(null, set_id, ["attr1", "attr2"]);

    // TODO: ADD ALL DATA TO DATABASE
    createImageSet(set_id, ["attr1", "attr2"]).then((query) => {
      if (query) {
        console.log("added image set");
        createESK(request.body.keyPath).then((query1) => {
          if (query1) {
            createR_EncSK_ImageSet(set_id, request.body.keyPath).then(
              (query1) => {
                if (query1) {
                  for (let i = 0; i < request.body.files.length; i++) {
                    console.log(i);
                    createStegoImage(
                      request.body.files[i].url,
                      request.body.files[i].sequence
                    ).then((query) => {
                      if (query) {
                        console.log(`added stego image`);
                        createR_SG_ImageSet(
                          set_id,
                          request.body.files[i].url
                        ).then(() => {
                          createR_SG_EncSK(
                            request.body.files[i].url,
                            request.body.keyPath
                          ).then(() => {
                            createR_DataOwner_ImageSet(
                              request.body.uuid,
                              set_id
                            ).then(() => {
                              console.log("added");
                            });
                          });
                        });
                      }
                    });
                  }
                }
              }
            );
          }
        });
      }
    });
  });

  // TODO: CREATE RELATIONSHIP

  response.json({ msg: "Success", setID: set_id });
});

router.post("/request", (request, response) => {
  console.log(request.body);
  let set_id = request.body.set_id;
  let uuid = request.body.uuid;
  let user_attr = []; // TODO: QUERY USER'S ATTRIBUTES
  let set_attr = []; // TODO: QUERY FILE ATTR
  if (checkArrayEqual(user_attr, set_attr)) {
    response.json({
      files_url: ["url1", "url2"],
      key_url: "encrypted key url",
    });
  } else {
    response.json({
      msg: "Error, mismatch attributes",
    });
  }
});

router.post("/revoke", async (request, response) => {
  console.log(request.body);
  let uuid = request.body.uuid;
  let new_attr = request.body.new_attr;
  let isOwner = true; // TODO: CHECK OWNER
  let encryptedSessionKeyUrl = TEST_DOWNLOAD_URL; // TODO: query session key
  await downloadFile(encryptedSessionKeyUrl, `${uuid}.key.cpabe`).then(() => {
    console.log(`download key path: ./downloads/${uuid}.key.cpabe`);
  });

  // TODO: RE-ENCRYPT SESSION KEY
  let finished = true;
  if (finished) {
    response.json({ msg: "success" });
  } else {
    response.json({ error: "failed" });
  }
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
