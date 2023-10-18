// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

contract Organization{
    bytes32 private immutable id;//organization web domain
    address private immutable admin;//organization admin

    constructor(bytes32 _orgId,address _admin){
        id = _orgId;
        admin = _admin;
    }

}

contract SuperFundrs{
    mapping(address => Organization[]) private users;//user's address -> orgs' addresses
}