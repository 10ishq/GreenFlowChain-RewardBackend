// import { config, query, mutate, tx } from "@onflow/fcl";
// import { signer } from "./signer"

const {
  query,
  mutate,
  tx,
  config,
  reauthenticate,
  account,
} = require("@onflow/fcl");
const { signer } = require("./signer");

config({
  // Use Testnet Access Node
  "accessNode.api": "https://rest-testnet.onflow.org",
  // We will also specify the network as some of the FCL parts need it to properly do it's work
  "flow.network": "testnet",
  // This will be the title of our DApp
  "app.detail.title": "Meow DApp",
  // This is just a kitten photo, we will use for the icon
  "app.detail.icon": "https://placekitten.com/g/200/200",
  // Next two will define where Wallet Discovery is located
  "discovery.wallet": "https://fcl-discovery.onflow.org/testnet/authn",
  "discovery.authn.endpoint":
    "https://fcl-discovery.onflow.org/api/testnet/authn",

  // We will also set aliases for the contracts we will use in this example
  "0xFLOW": "0x7e60df042a9c0868",
  "0xFT": "0x9a0766d93b6608b7",
});

const getFlowBalance = async (address) => {
  const cadence = `
      import FlowToken from 0xFLOW
      import FungibleToken from 0xFT
  
      pub fun main(address: Address): UFix64 {
        let account = getAccount(address)
  
        let vaultRef = account.getCapability(/public/flowTokenBalance)
          .borrow<&FlowToken.Vault{FungibleToken.Balance}>()
          ?? panic("Could not borrow Balance reference to the Vault")
  
        return vaultRef.balance
      }
    `;
  const args = (arg, t) => [arg(address, t.Address)];
  const balance = await query({ cadence, args });
  console.log({ balance });
};

const sendFlow = async (recepient, amount) => {
  const cadence = `
      import FungibleToken from 0xFT
      import FlowToken from 0xFLOW
  
      transaction(recepient: Address, amount: UFix64){
        prepare(signer: AuthAccount){
          let sender = signer.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
            ?? panic("Could not borrow Provider reference to the Vault")
  
          let receiverAccount = getAccount(recepient)
  
          let receiver = receiverAccount.getCapability(/public/flowTokenReceiver)
            .borrow<&FlowToken.Vault{FungibleToken.Receiver}>()
            ?? panic("Could not borrow Receiver reference to the Vault")
  
                  let tempVault <- sender.withdraw(amount: amount)
          receiver.deposit(from: <- tempVault)
        }
      }
    `;
  const args = (arg, t) => [arg(recepient, t.Address), arg(amount, t.UFix64)];
  const limit = 500;
  const proposer = signer;
  const payer = signer;
  const authorizations = [signer];

  const txId = await mutate({
    cadence,
    args,
    proposer,
    payer,
    authorizations,
    limit,
  });

  console.log("Waiting for transaction to be sealed...");

  const txDetails = await tx(txId).onceSealed();
  console.log({ txDetails });
};

// (async () => {
//   console.clear();
//   // "reauthenticate" will ensure your session works properly
//   // and present you a popup to sign in
//   // await reauthenticate();

//   // This is an example account we've created to this exibition
//   // You can replace it with one of your addresses
//   const recepient = "0x746737a578e3fd24";

//   // Check "initial" balance first
//   await getFlowBalance(recepient);

//   // Send some FLOW tokens to Recepient
//   await sendFlow(recepient, "1.337");

//   // Ensure that Recepient's balance has been changed
//   await getFlowBalance(recepient);
// })();

module.exports = { 
  getFlowBalance,
  sendFlow
};