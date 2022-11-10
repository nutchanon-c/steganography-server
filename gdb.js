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
  console.log("In wongSad function");
  try {
    console.log("Try to query");
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

    console.log(node.properties.name);
  } finally {
    await session.close();
  }

  // on application exit:
  // await driver.close();
}

export async function createImageSet(psid, permitAttriList) {
  const session = driver.session({ database: "neo4j" });

  try {
    console.log("Try to query");
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

    console.log(node.properties.name);
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
    console.log("Try to query");
    const result = await session.run(
      `
      CREATE (u:SG {name: 'stego_image', filePath:'${filePath}', seqNo: '${seqNo}'})
      RETURN u
      
      `
    );

    const singleRecord = result.records[0];
    const node = singleRecord.get(0);

    console.log(node.properties.name);
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
    console.log("Try to query");
    const result = await session.run(
      `
      CREATE (u:ESK {name: '${filePath}', filePath: '${filePath}'})
      RETURN u
      
      `
    );

    const singleRecord = result.records[0];
    const node = singleRecord.get(0);

    console.log(node.properties.name);
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
    console.log("Before relation");
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
      console.log("Help");
      // Check the write results.
      writeResult.records.forEach((record) => {
        const person1Node = record.get("p1");
        const person2Node = record.get("p2");
        const person3Node = record.get("p3");
        const person4Node = record.get("p4");

        console.log(
          `Created friendship between: ${person1Node.properties.name}, ${person2Node.properties.name}, ${person3Node.properties.name}, ${person4Node.properties.name}`
        );
      });
      console.log("1");
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
    console.log("Help");
    // Check the write results.
    writeResult.records.forEach((record) => {
      const person1Node = record.get("p1");
      const person2Node = record.get("p2");
      console.log(
        `Created friendship between: ${person1Node.properties.name}, ${person2Node.properties.name}`
      );
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
    console.log("Executing Create Relation between EncSK and ImageSet");
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
    console.log("SK-IS relation created");
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
    console.log("Executing Create Relation between EncSK and Stego Image");
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
    console.log("IS-SI relation created");
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
    console.log("IS-SI relation created");
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
    console.log("Executing Create Relation between EncSK and ImageSet");
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
    console.log("IS-SI relation created");
    return true;
  } catch (error) {
    console.error(`Something went wrong: ${error}`);
  } finally {
    // Close down the session if you're not using it anymore.
    await session.close();
  }
}

// createRelationship(
//   driver,
//   personName,
//   person2Name,
//   person3Name,
//   person4Name,
//   1
// );
