"use strict";

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const neo4j = require("neo4j-driver");
require("dotenv").config();
//Credential Parameters
const uri = process.env.NEO4J_URL;
const user = process.env.NEO4J_USER;
const password = process.env.NEO4J_PASSWORD;
//Connect
console.log("Try to conect to graph database");
const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
// const session = driver.session();
console.log("Connected");

//Attributes variables
//Change to prompt
const personName = "Wong";
const person2Name = "Chan";
const person3Name = "Wut";
const person4Name = "Charn";
const emotion = "Depressed";
var number = 1;

//Debug 1
console.log("Start");

//Query Section
//Create Nodes
export async function createPerson(uid, attriList) {
  const session = driver.session({ database: "neo4j" });
  // console.log("In wongSad function");
  try {
    // console.log("Try to query");
    const result = await session.run(
      "CREATE (p:Person {name: $uid, uid: $uid, attriList: $attriList}) RETURN p",
      {
        name: uid,
        uid: uid,
        attriList: attriList.join(","),
      }
    );

    const singleRecord = result.records[0];
    const node = singleRecord.get(0);

    // console.log(node.properties.name);
  } catch {
  } finally {
    await session.close();
  }

  // on application exit:
  // await driver.close();
}

export async function createImageSet(psid, permitAttriList) {
  const session = driver.session({ database: "neo4j" });

  try {
    // console.log("Try to query");
    const result = await session.run(
      `
      MERGE (i:UserIds {value:"userid"}) ON CREATE SET i.user_id = 1 ON MATCH SET i.user_id = i.user_id + 1
      CREATE (u:IS {psid:i.user_id, name:'psid', psid: '${psid}', permitAttriList: '${permitAttriList.join(
        ","
      )}'})
      RETURN u
      
      `
    );

    const singleRecord = result.records[0];
    const node = singleRecord.get(0);

    // console.log(node.properties.name);
    return true;
  } finally {
    await session.close();
  }

  // on application exit:
  await driver.close();
}

export async function createStegoImage(filePath, seqNo) {
  const session = driver.session({ database: "neo4j" });

  try {
    // console.log("Try to query");
    const result = await session.run(
      `
      CREATE (u:SG {name: 'stego_image', filePath:'${filePath}', seqNo: '${seqNo}'})
      RETURN u
      
      `
    );

    const singleRecord = result.records[0];
    const node = singleRecord.get(0);

    // console.log(node.properties.name);
  } finally {
    await session.close();
    return true;
  }

  // on application exit:
  await driver.close();
}

export async function createESK(filePath) {
  const session = driver.session({ database: "neo4j" });

  try {
    // console.log("Try to query");
    const result = await session.run(
      `
      CREATE (u:ESK {name: '${filePath}', filePath: '${filePath}'})
      RETURN u
      
      `
    );

    const singleRecord = result.records[0];
    const node = singleRecord.get(0);

    // console.log(node.properties.name);
    return true;
  } finally {
    await session.close();
  }

  // on application exit:
  await driver.close();
}

//Create Relation
export async function createRelationship(
  personName,
  person2Name,
  person3Name,
  person4Name,
  number
) {
  const session = driver.session({ database: "neo4j" });

  try {
    // console.log("Before relation");
    if (number == 1) {
      //relationship dataowner -> IS; IS -> SI; IS -> ESK; ESK -> SI
      `
      MATCH (p1:Person)
      MATCH (p2:ImageSet)
      MATCH (p3:StegoImage)
      MATCH (p4:ESK)

      WHERE p1.name = 'name'AND p2.name = 'uid' AND p3.name = 'filePath' AND p4.name = 'filePath'
      MERGE (p1)-[:ABLE_TO_ACCESS]->(p2)
      MERGE (p2)-[:CONTAINS]->(p3)
      MERGE (p2)-[:HAS]->(p4)
      MERGE (p4)-[:BELONG_TO]->(p3)
       
      RETURN p1, p2, p3, p4
      
      `;

      // Write transactions allow the driver to handle retries and transient errors.
      const writeResult = await session.writeTransaction((tx) =>
        tx.run(writeQuery, {
          person1Name,
          person2Name,
          person3Name,
          person4Name,
        })
      );
      // console.log("Help");
      // Check the write results.
      writeResult.records.forEach((record) => {
        const person1Node = record.get("p1");
        const person2Node = record.get("p2");
        const person3Node = record.get("p3");
        const person4Node = record.get("p4");

        // console.log(
        //   `Created friendship between: ${person1Node.properties.name}, ${person2Node.properties.name}, ${person3Node.properties.name}, ${person4Node.properties.name}`
        // );
      });
      // console.log("1");
    } /*else if (number == 2) {
      //relationship  <-> PSID
      const writeQuery = `MERGE (p1:Person { name: $person1Name })
            MERGE (p2:Person { name: $person2Name })
            MERGE (p2)-[:HAS]->(p1)
            MERGE (p1)-[:BELONG_TO]->(p2)
            RETURN p1, p2`;
      console.log("2");
    } else if (number == 3) {
      //relationship ESK <-> PSID
      const writeQuery = `MERGE (p1:Person { name: $person1Name })
            MERGE (p2:Person { name: $person2Name })
            MERGE (p1)-[:USE_FOR]->(p2)
            MERGE (p2)-[:HAS]->(p1)
            RETURN p1, p2`;
      console.log("3");
    }*/ else {
      console.error(`Something went wrong: ${error}`);
    }

    // Write transactions allow the driver to handle retries and transient errors.
    const writeResult = await session.writeTransaction((tx) =>
      tx.run(writeQuery, { person1Name, person2Name })
    );
    // console.log("Help");
    // Check the write results.
    writeResult.records.forEach((record) => {
      const person1Node = record.get("p1");
      const person2Node = record.get("p2");
      // console.log(
      //   `Created friendship between: ${person1Node.properties.name}, ${person2Node.properties.name}`
      // );
    });
  } catch (error) {
    console.error(`Something went wrong: ${error}`);
  } finally {
    // Close down the session if you're not using it anymore.
    await session.close();
  }
}

//Create Relation btw EncSKey and Image set node
export async function createR_EncSK_ImageSet(imageSet, EncSK) {
  const session = driver.session({ database: "neo4j" });
  try {
    // console.log("Executing Create Relation between EncSK and ImageSet");
    let writeQuery = `
    MATCH (p2:IS)
    MATCH (p4:ESK)

    WHERE p2.psid='${imageSet}' AND p4.name='${EncSK}'
    MERGE (p2)-[:HAS]->(p4)
     
    RETURN p2, p4
    `;

    //Write transaction
    // const writeResult = await session.writeTransaction((tx) => tx.run(writeQuery))
    await session.run(writeQuery);
    return true;
    // console.log("SK-IS relation created");
  } catch (error) {
    console.error(`Something went wrong: ${error}`);
  } finally {
    // Close down the session if you're not using it anymore.
    await session.close();
  }
}

//Create Relation btw Stego Image and Encrypted Session Key node
export async function createR_SG_EncSK(StegoImg, EncSK) {
  const session = driver.session({ database: "neo4j" });
  try {
    // console.log("Executing Create Relation between EncSK and Stego Image");
    let writeQuery = `
    MATCH (p2:ESK)
    MATCH (p4:SG)

    WHERE p2.filePath='${EncSK}' AND p4.filePath='${StegoImg}'
    MERGE (p2)-[:BELONG_TO]->(p4)
     
    RETURN p2, p4
    `;

    //Write transaction
    // const writeResult = await session.writeTransaction((tx) => tx.run(writeQuery))
    await session.run(writeQuery);
    // console.log("IS-SI relation created");
    return true;
  } catch (error) {
    console.error(`Something went wrong: ${error}`);
  } finally {
    // Close down the session if you're not using it anymore.
    await session.close();
  }
}

//Create Relation btw Image Set and Stego Image node
export async function createR_SG_ImageSet(imageSet, stegoImageUrl) {
  const session = driver.session({ database: "neo4j" });
  try {
    console.log("Executing Create Relation between Stego Image and ImageSet");
    let writeQuery = `
    MATCH (p2:IS)
    MATCH (p4:SG)

    WHERE p2.psid='${imageSet}' AND p4.filePath='${stegoImageUrl}'
    MERGE (p2)-[:CONTAINS]->(p4)
     
    RETURN p2, p4
    `;

    //Write transaction
    // const writeResult = await session.writeTransaction((tx) => tx.run(writeQuery))
    await session.run(writeQuery);
    // console.log("IS-SI relation created");
    return true;
  } catch (error) {
    console.error(`Something went wrong: ${error}`);
  } finally {
    // Close down the session if you're not using it anymore.
    await session.close();
  }
}

//Create Relation btw Data Owner and Image Set node
export async function createR_DataOwner_ImageSet(dataOwner, imageSet) {
  const session = driver.session({ database: "neo4j" });
  try {
    // // console.log("Executing Create Relation between EncSK and ImageSet");
    let writeQuery = `
    MATCH (p2:Person)
    MATCH (p4:IS)

    WHERE p2.uid='${dataOwner}' AND p4.psid='${imageSet}'
    MERGE (p2)-[:ABLE_TO_ACCESS]->(p4)
     
    RETURN p2, p4
    `;

    //Write transaction
    // const writeResult = await session.writeTransaction((tx) => tx.run(writeQuery))
    await session.run(writeQuery);
    // console.log("IS-SI relation created");
    return true;
  } catch (error) {
    console.error(`Something went wrong: ${error}`);
  } finally {
    // Close down the session if you're not using it anymore.
    await session.close();
  }
}

//testing Query user's attributes function
export async function query_user_attributes(userID) {
  const session = driver.session({ database: "neo4j" });
  try {
    // console.log("Execute user attribute retrival query");
    const readQuery = `

      MATCH (p:Person)
      WHERE p.uid = '${userID}'
      RETURN p.attriList AS attriList
      
      `;

    const readResult = await session.executeRead((tx) =>
      tx.run(readQuery, { userID })
    );

    let res = "";
    readResult.records.forEach((record) => {
      // console.log(`Found attributes: ${record.get("attriList")}`);
      res = record.get("attriList");
    });
    return res;
  } catch (error) {
    console.error(`Something went wrong: ${error}`);
  } finally {
    await session.close();
  }
}

//testing Query imageset permit attributes function
export async function query_imageset_permissionAttributes(pictureset_id) {
  const session = driver.session({ database: "neo4j" });
  try {
    // console.log("Execute imageset permit attribute retrival query");
    const readQuery = `
      MATCH (p:IS)
      WHERE p.psid = '${pictureset_id}'
      RETURN p.permitAttriList AS permitAttriList
      
      `;

    const readResult = await session.executeRead((tx) =>
      tx.run(readQuery, { pictureset_id })
    );

    let res = "";
    readResult.records.forEach((record) => {
      // console.log(`Found permitattributes: ${record.get("permitAttriList")}`);
      res = record.get("permitAttriList");
    });
    return res;
  } catch (error) {
    console.error(`Something went wrong: ${error}`);
  } finally {
    await session.close();
  }
}

//testing Query file owner function
export async function query_file_owner(pictureset_id) {
  const session = driver.session({ database: "neo4j" });
  try {
    // console.log("Execute file owner retrival query");
    const readQuery = `
      MATCH (p1:IS {psid: '${pictureset_id}'})--(o:Person) 
      RETURN o.uid AS uid
      
      `;

    const readResult = await session.executeRead((tx) =>
      tx.run(readQuery, { pictureset_id })
    );

    readResult.records.forEach((record) => {
      // console.log(`Found file owner: ${record.get("uid")}`);
    });
  } catch (error) {
    console.error(`Something went wrong: ${error}`);
  } finally {
    await session.close();
  }
}

//testing Query ESK function
export async function query_EncSK(pictureset_id, list_of_permitted_attribute) {
  const session = driver.session({ database: "neo4j" });
  try {
    // console.log("Execute EncSK retrival query");
    const readQuery = `
      MATCH (p1:IS {psid: '${pictureset_id}'})--(p2:ESK)--(p3:SG)
      WHERE p1.permitAttriList = '${list_of_permitted_attribute}'
      RETURN p2.filePath AS filePath
      
      `;

    const readResult = await session.executeRead((tx) =>
      tx.run(readQuery, { pictureset_id }, { list_of_permitted_attribute })
    );

    let res = "";
    readResult.records.forEach((record) => {
      // console.log(`Found EncSK: ${record.get("filePath")}`);
      res = record.get("filePath");
    });
    return res;
  } catch (error) {
    console.error(`Something went wrong: ${error}`);
  } finally {
    await session.close();
  }
}

//testing Query all img of and imageset function
export async function query_image(pictureset_id) {
  const session = driver.session({ database: "neo4j" });
  try {
    // console.log("Execute all img of a set retrival query");
    const readQuery = `
      MATCH (p:SG) --(p1:IS)
      WHERE p1.psid = '${pictureset_id}'
      RETURN p.filePath AS url , p.seqNo AS sequence
      
      `;

    const readResult = await session.executeRead((tx) =>
      tx.run(readQuery, { pictureset_id })
    );
    let res = [];
    readResult.records.forEach((record) => {
      let url = record.get("url");
      let seq = record.get("sequence");
      // console.log(`Found EncSK: ${url}, ${seq} `);
      res.push({ url: url, sequence: seq });
    });
    return res;
  } catch (error) {
    console.error(`Something went wrong: ${error}`);
  } finally {
    await session.close();
  }
}

//Edit ESK function
export async function edit_encSK(filePath, new_filePath) {
  const session = driver.session({ database: "neo4j" });
  try {
    // console.log("Execute user attribute retrival query");
    const readQuery = `

      MATCH (n {name: '${filePath}'})
      SET n.filePath = '${new_filePath}'
      SET n.name = '${new_filePath}'
      RETURN n AS newESK
      
      `;

    const readResult = await session.executeRead((tx) =>
      tx.run(readQuery, { filePath }, { new_filePath })
    );

    readResult.records.forEach((record) => {
      // console.log(`Editted EncSK: ${record.get("newESK")}`);
    });
  } catch (error) {
    console.error(`Something went wrong: ${error}`);
  } finally {
    await session.close();
  }
}
