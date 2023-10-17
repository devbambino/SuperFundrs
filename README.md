# SuperFundrs at the ETHOnline 2023 Hackathon
SuperFundrs is a DeFi proposals/funding platform for allowing public and private organizations receive proposals and funds from the their community in an easy, secure and fast way.

# How it works
SuperFundrs allows administrators from public and private organizations create their proposals/donations pools where anyone from their community can take part for making proposals and funding those proposals. The organization could decide to restrict access to the pool to just users with the same email domain, which could be really useful for universities/colleges with a .edu domain wanting to give access just to students and alumni. 

# Type of users
There are two types of users: organization admins, and funders. 

# Type of users: Org Admins
Organization admins are required to have a special sf.admin@organization.domain, ex. sf.admin@supercity.gov, that would let us know that the user have 100% access and control over the organization web domain and could represent it inside the platform. They also need to enable the receiving of proposals/funding in their pool and are able to approve or not the proposals that passed the voting system(# votes should be more than half of the amount of users in the pool). 

# Type of users: Fundrs
Fundrs just need to have a valid email(some organizations could decide to restrict access to the pool to just users with the same email domain) and being able to access it for completing the initial email validation process. 

# Staking in the Org Pool
Admins and funders need to stake tokens inside the pool in order to be included, making them to have skin in the game and discouraging bad behaviors from them. Admins have to stake three times more tokens than funders. Tokens from the admins are stored just for security purposes, and won't be used for anything else. Funders need to have a minimum staking balance in order to make proposals and vote, but they could stake as much as they want. Tokens from funders are used to fund the proposals they create and vote. 

# Proposals approvals
If a proposal passes and is approved by the admin, the funds passed from the funders balance to the organization balance, and they would be available to be withdraw by the admin anytime.

# About the tecnologies used
The project is implementing Safe{Core} Account Abstraction (AA) SDK for:
1. Email verification using the Auth Kit (with web3auth), and for creating the EOA and the Safe wallet for the users
2. Allowing users to get the tokens (stablecoins) they need to stake in the pools using the OnRamp Kit (with Stripe). 
3. Allowing users to make gasless transactions in a frictionless way using Relay Kit (with Gelato 1Balance). 

The project smart contracts were deployed in Polygon Mumbai.

As base project was used the code in the boilerplate created by the Safe team at https://github.com/5afe/account-abstraction-demo-ui 
