// import { SHA3 } from "sha3";
// import { curve, Buffer } from "elliptic";
// import { withPrefix, sansPrefix } from "@onflow/util-address";

const { SHA3 } = require('sha3');
var EC = require('elliptic').ec;
const { withPrefix, sansPrefix } = require("@onflow/fcl");
const dotenv = require('dotenv');
dotenv.config();


var curve = new EC('p256');


const hashMessageHex = (msgHex) => {
  const sha = new SHA3(256);
  sha.update(Buffer.from(msgHex, "hex"));
  return sha.digest();
};

const signWithKey = (privateKey, msgHex) => {
  const key = curve.keyFromPrivate(Buffer.from(privateKey, "hex"));
  const sig = key.sign(hashMessageHex(msgHex));

  const n = 32;
  const r = sig.r.toArrayLike(Buffer, "be", n);
  const s = sig.s.toArrayLike(Buffer, "be", n);

  return Buffer.concat([r, s]).toString("hex");
};

const signer = async (account) => {
  // We are hard coding these values here, but you can pass those values from outside as well.
  // For example, you can create curried function:
  // const signer = (keyId, accountAdddress, pkey) => (account) => {...}
  // and then create multiple signers for different key indices

  const keyId = Number(0); // always ensure that your keyId is a number not a string
  const accountAddress = process.env.ADMIN_ADDRESS;
  const privateKey =
    process.env.PRIVATE_KEY;

  // authorization function need to return an account
  return {
    ...account, // bunch of defaults in here, we want to overload some of them though
    tempId: `${accountAddress}-${keyId}`, // tempIds are more of an advanced topic, for 99% of the times where you know the address and keyId you will want it to be a unique string per that address and keyId
    addr: sansPrefix(accountAddress), // the address of the signatory, currently it needs to be without a prefix right now
    keyId, // this is the keyId for the accounts registered key that will be used to sign, make extra sure this is a number and not a string

    // This is where magic happens! ✨
    signingFunction: async (signable) => {
      // Singing functions are passed a signable and need to return a composite signature
      // signable.message is a hex string of what needs to be signed.
      const signature = await signWithKey(privateKey, signable.message);

      return {
        addr: withPrefix(accountAddress), // needs to be the same as the account.addr but this time with a prefix, eventually they will both be with a prefix
        keyId, // needs to be the same as account.keyId, once again make sure its a number and not a string
        signature, // this needs to be a hex string of the signature, where signable.message is the hex value that needs to be signed
      };
    },
  };
};

module.exports = { signer };
