// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

contract Organization {
    uint256 public constant adminStakingThreshold = 0.1999 ether;
    uint256 public constant fundersStakingThreshold = 0.04999 ether;
    address payable public admin;//organization admin
    address private immutable owner;
    address private immutable superOwner;
    Info private info;
    mapping(address => uint256) public usersBalances;//balance of each user in this org
    mapping(address => string) public usersAliases;//Alias(name) of each user in this org

    struct Info {
        bool proposalsAllowed;
        uint256 orgWithdrawalBalance;
        uint256 adminBalance;
        uint256 fundrsBalance;
        uint256[] proposals;
        string id; //organization web domain
        string name;
        string description;
    }
    modifier onlyAdmin(){
        require(msg.sender == admin,"E201");//E201: You are not the admin of this org!!!
        _;
    }
    modifier isStaking(){
        require(usersBalances[msg.sender] > adminStakingThreshold || msg.value > adminStakingThreshold,"E202");//E202: You need to stake at least 0.2 tokens first!!!
        _;
    }
    constructor(
        string memory _id,
        string memory _name,
        string memory _description,
        address _superOwner,
        address payable _admin
    ) {
        info.id = _id;
        info.name = _name;
        info.description = _description;
        admin = _admin;
        superOwner = _superOwner;
        owner = msg.sender;
        usersAliases[_admin] = "Admin";
    }

    function getInfo() external view returns (Info memory) {
        return info;
    }
    function setProposalsAllowed(bool _allowProposals) external payable onlyAdmin isStaking{
        info.proposalsAllowed = _allowProposals;
        usersBalances[msg.sender] = msg.value;
        info.adminBalance += msg.value;
    }
    function getBalance()external view returns(uint256){
        return address(this).balance;
    }
}

contract SuperFundrs {
    bool private allowFundrsWithdrawals;
    bool private allowAdminWithdrawals;
    bool public orgWithdrawalsAllowed;
    address private immutable superOwner;
    address private immutable alternativeOwner;
    mapping(address => Organization[]) private users; //user's address -> orgs' addresses
    Organization[] private organizations;

    constructor() {
        superOwner = msg.sender;
        alternativeOwner = superOwner;
    }

    function setOrganization(
        string memory _id,
        string memory _name,
        string memory _description
    ) external {
        Organization _newOrg = new Organization(_id,_name,_description, superOwner, payable(msg.sender));
        organizations.push(_newOrg);
        users[msg.sender].push(_newOrg);
    }

    function getUserOrgs() external view returns (Organization[] memory) {
        return users[msg.sender];
    }

    function getOrgInfo(uint256 _index) external view returns (Organization.Info memory) {
        return users[msg.sender][_index].getInfo();
    }

    function getOrgInfoFromAddress(
        Organization _org
    ) external view returns (Organization.Info memory) {
        return _org.getInfo();
    }

    function getOrgsCount() external view returns (uint) {
        return organizations.length;
    }
}