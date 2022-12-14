# SIIT CSS453 Final Project: Steganography Server

- [SIIT CSS453 Final Project: Steganography Server](#siit-css453-final-project-steganography-server)
  - [System Requirements](#system-requirements)
  - [Setup](#setup)
  - [Running the Server](#running-the-server)
  - [Changing the attributes of ABE](#changing-the-attributes-of-abe)
  - [To generate key](#to-generate-key)


## System Requirements
Python 3.10.6

Node 16.13.0

Run on Ubuntu or Linux Operating Systems

## Setup

**CP-ABE needs to be installed beforehand. Please refer to [this link](https://acsc.cs.utexas.edu/)**

1. Installing Packages
   - Run `yarn` or `npm install` or install packages with any package manager of your choosing.
2. Environmental Variables
   - Create a `.env` file in the root directory with the following keys and values:
     - `AWS_ACCESS_KEY_ID` : AWS Access Key ID
     - `AWS_SECRET_ACCESS_KEY` : AWS Secret Access Key
     - `AWS_BUCKET_NAME` : Bucket Name for AWS S3
     - `AWS_REGION` : AWS Region such as `"ap-southeast-1"`
     - `NEO4J_URL` : Neo4j URL
     - `NEO4J_USER` : Neo4j Username
     - `NEO4J_PASSWORD` : Neo4j Password

## Running the Server

Simply `cd` in to the directory and run the command `node ./index.js` to start the server.

## Changing the attributes of ABE

Currently, the attributes are hardcoded to `sysadmin` for testing purposes. To change it, you can look at `line 213` and `line 232` of `index.js`. **New ABE key is needed for new/different attributes**
