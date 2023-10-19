// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

contract Organization{
    string private id;//organization web domain
    address private immutable admin;//organization admin
    address private immutable owner;
    address private immutable superOwner;
    Info private info;

    struct Info {
        string id;
        address admin; //organization admin
        address owner;
        address superOwner;
    }

    constructor(string memory _orgId,address _superOwner,address _admin){
        id = _orgId;
        superOwner = _superOwner;
        owner = msg.sender;
        admin = _admin;
        info.id = _orgId;
        info.superOwner = _superOwner;
        info.owner = msg.sender;
        info.admin = _admin;
    }
    function getInfo() external view returns(Info memory){
        return info;
    }

}

contract SuperFundrs{
    address private immutable superOwner;
    address private immutable alternativeOwner;
    mapping(address => Organization[]) private users;//user's address -> orgs' addresses
    Organization[] public organizations;

    constructor(){
        superOwner = msg.sender;
        alternativeOwner = superOwner;
    }
	function setOrganization(string memory _orgId) external{
		Organization _newOrg = new Organization(
            _orgId,
            superOwner,
            msg.sender
        );
        organizations.push(_newOrg);
        users[msg.sender].push(_newOrg);
    }
    function getUserOrgs() external view returns (Organization[] memory) {
        return users[msg.sender];
    }
    function getOrgInfo(uint256 _index) external view returns(Organization.Info memory){
        return users[msg.sender][_index].getInfo();
    }
    function getOrgInfoFromAddress(Organization _org) external view returns(Organization.Info memory){
        return _org.getInfo();
    }
    function getOrgsCount()external view returns(uint){
        return organizations.length;
    }
}