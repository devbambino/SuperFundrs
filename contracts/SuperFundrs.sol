// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

contract Organization{
    bool private allowFundrsWithdrawals;
    bool private allowAdminWithdrawals;
    address private immutable owner;
    address private immutable superOwner;
    Info private info;

    struct Info {
        bool allowProposals;
        uint256 orgWithdrawalBalance;
        uint256 adminBalance;
        uint256 stakersBalance;
        uint256[] proposals;
        string id;//organization web domain
        string name;
        string description;
        address payable admin; //organization admin
    }

    constructor(bool _allowProposals,string memory _id,string memory _name,string memory _description,address _superOwner,address payable _admin){
        info.allowProposals = _allowProposals;
        info.id = _id;
        info.name = _name;
        info.description = _description;
        info.admin = _admin;
        superOwner = _superOwner;
        owner = msg.sender;
    }
    function getInfo() external view returns(Info memory){
        return info;
    }

}

contract SuperFundrs{
    address private immutable superOwner;
    address private immutable alternativeOwner;
    mapping(address => Organization[]) private users;//user's address -> orgs' addresses
    Organization[] private organizations;

    constructor(){
        superOwner = msg.sender;
        alternativeOwner = superOwner;
    }
	function setOrganization(bool _allowProposals,string memory _id,string memory _name,string memory _description) external{
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