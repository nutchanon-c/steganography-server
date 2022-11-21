// const { exec } = require("child_process");
import { exec } from "child_process";
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
  edit_encSK,
  edit_psAttr,
  query_EncSK,
  query_file_owner,
  query_image,
  query_imageset_permissionAttributes,
  query_user_attributes,
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

router.get("/newID", (request, response) => {
  let set_id = uuidv4();
  let res = { id: set_id };
  console.log(`set_id res: ${res.id}`);
  response.json({ id: set_id });
});

router.post("/new", async (request, response) => {
  //code to perform particular action.
  //To access POST variable use req.body()methods.
  console.log(request.body);
  let set_id = request.body.set_id;
  console.log(`SET ID IN NEW ${set_id}`);
  const user_attributes = request.body.user_attributes;
  const keyPath = request.body.keyPath;
  const uuid = request.body.uuid;
  createPerson(uuid, user_attributes).then(() => {
    // createImageSet(null, set_id, ["attr1", "attr2"]);

    // ADD ALL DATA TO DATABASE
    createImageSet(set_id, user_attributes).then((query) => {
      if (query) {
        console.log("added image set");
        createESK(keyPath).then((query1) => {
          if (query1) {
            createR_EncSK_ImageSet(set_id, keyPath).then((query1) => {
              if (query1) {
                for (let i = 0; i < request.body.files.length; i++) {
                  console.log(i);
                  const fileUrl = request.body.files[i].url;
                  createStegoImage(
                    fileUrl,
                    request.body.files[i].sequence
                  ).then((query) => {
                    if (query) {
                      console.log(`added stego image`);
                      createR_SG_ImageSet(set_id, fileUrl).then(() => {
                        createR_SG_EncSK(fileUrl, keyPath).then(() => {
                          createR_DataOwner_ImageSet(uuid, set_id).then(() => {
                            console.log("added");
                          });
                        });
                      });
                    }
                  });
                }
              }
            });
          }
        });
      }
    });
  });

  response.json({ msg: "Success", setID: set_id });
});

router.post("/request", (request, response) => {
  console.log(request.body);
  let set_id = request.body.set_id;
  let uuid = request.body.uuid;
  query_user_attributes(uuid).then((attr) => {
    console.log(`attr: ${attr}`);

    // user_attr = ["sysadmin"]; // TODO: FIX HARD CODE
    query_imageset_permissionAttributes(set_id).then((picAttrString) => {
      let set_attr = picAttrString.split(",");
      console.log(`set attr: ${set_attr}, user attr: ${attr.split(",")}`);
      if (checkArrayEqual(attr.split(","), picAttrString.split(","))) {
        query_EncSK(set_id, picAttrString).then((encSK_url) => {
          // get all image url of an image set
          query_image(set_id).then((sets) => {
            console.log(`sets: ${sets}, key: ${encSK_url}`);
            response.json({
              files: sets,
              key_url: encSK_url,
            });
          });
        });
      } else {
        response.json({
          msg: "Error, mismatch attributes",
        });
      }
    });
  });
});

router.post("/revoke", async (request, response) => {
  console.log(request.body);
  let uuid = request.body.uuid;
  let new_attr = request.body.new_attr;
  let set_id = request.body.set_id;
  let finished = false;

  query_file_owner(set_id).then((owner) => {
    var isOwner = owner === uuid;
    console.log(`isOwner ${isOwner} ${owner} ${uuid}`);
    {
      if (isOwner) {
        query_imageset_permissionAttributes(set_id).then((set_attr) => {
          query_EncSK(set_id, set_attr).then((url) => {
            let encryptedSessionKeyUrl = url;
            downloadFile(encryptedSessionKeyUrl, `${uuid}.key.cpabe`).then(
              () => {
                console.log(`download key path: ./downloads/${uuid}.key.cpabe`);
                setTimeout(function () {
                  // console.log("Executed after 1 second");
                  // decryptSK(`./downloads/${uuid}.key.cpabe`, `./sysadmin-key`);
                  executeTerminalCommand(
                    `cpabe-dec ${PUB_KEY_PATH} sysadmin-key ./downloads/${uuid}.key.cpabe`
                  );
                  setTimeout(function () {
                    // console.log("Executed after 1 second");
                    executeTerminalCommand(
                      `cpabe-enc -k ${PUB_KEY_PATH} ./downloads/${uuid}.key "${new_attr.join(
                        " and "
                      )}"`
                    );
                    setTimeout(function () {
                      // console.log("Executed after 1 second");
                      uploadFile(
                        `./downloads/${uuid}.key`,
                        `${uuid}/${set_id}/${set_id}.key.cpabe`
                      ).then((location) => {
                        edit_encSK(
                          `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uuid}/${set_id}/${set_id}.key.txt.cpabe`,
                          location
                        ).then(() => {
                          edit_psAttr(set_id, ["sysadmin"], new_attr).then(
                            () => {
                              finished = true;
                              if (finished) {
                                response.json({ msg: "success" });
                              } else {
                                response.json({ error: "failed" });
                              }
                            }
                          );
                        });
                      });
                    }, 1000);
                  }, 1000);
                  // generateABEKey(new_attr, `./downloads/${uuid}.key`);
                }, 1000);
              }
            );
          });
        });
      } else {
        finished = false;
      }
    }
  });
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

  const data = await s3.upload(params).promise(); // this line
  console.log(`File uploaded successfully. ${data.Location}`);
  return data.Location;
};

const executeTerminalCommand = (command) => {
  return exec(command, (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      return true;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return false;
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

const decryptSK = (keyName, abekey) => {
  return executeTerminalCommand(
    `cpabe-dec ${PUB_KEY_PATH} ${abekey} ${keyName}`
  );
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
