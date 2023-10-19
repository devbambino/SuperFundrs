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
        bool fundrsWithdrawalsAllowed;
        bool adminWithdrawalsAllowed;
        bool orgWithdrawalsAllowed;
        bool proposalsAllowed;
        bool justSameOrgId;
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
    modifier readyToWithdraw(bool _isAdmin) {
        bool withdrawalsAllowed = info.fundrsWithdrawalsAllowed;
        if (_isAdmin) {
            withdrawalsAllowed = info.adminWithdrawalsAllowed;
        }
        require(withdrawalsAllowed, "E203"); //E203:Withdrawals are not allowed yet!
        require(usersBalances[msg.sender] > 0, "E204"); //E204:You don't have a balance here!
        _;
    }
    modifier hasPermission() {
        require(msg.sender == superOwner, "E205"); //E205: You has no permission!!!
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
    function getUserBalance() external view returns (uint256) {
        return usersBalances[msg.sender];
    }

    function userFundsWithdrawal(bool _isAdmin)
        external
        payable
        readyToWithdraw(_isAdmin)
    {
        uint256 _amount = usersBalances[msg.sender];
        (bool success, ) = payable(msg.sender).call{value: _amount}("");
        require(success, "E206"); //E206:Failed to withdraw tokens!
        delete usersBalances[msg.sender];
        if (_isAdmin) {
            delete info.adminBalance;
            delete info.proposalsAllowed;
        } else {
            info.fundrsBalance -= _amount;
        }
    }

    function stakeFunds(bool _isAdmin) external payable {
        usersBalances[msg.sender] += msg.value;
        if (_isAdmin) {
            info.adminBalance += msg.value;
        } else {
            info.fundrsBalance += msg.value;
        }
    }
    function setWithdrawalAllowances(
        bool _forAdmin,
        bool _forFundrs,
        bool _forOrg
    ) external hasPermission {
        info.adminWithdrawalsAllowed = _forAdmin;
        info.fundrsWithdrawalsAllowed = _forFundrs;
        info.orgWithdrawalsAllowed = _forOrg;
    }
}

contract SuperFundrs {
    address private immutable superOwner;
    address private immutable alternativeOwner;
    mapping(address => Organization[]) private usersOrgs; //user's address -> orgs' addresses
    Organization[] private organizations;

    modifier onlyGelatoRelay() {
        bool _isGelato = true;
        require(_isGelato, "E01"); //E01: You don't have permission to do this!!!
        _;
    }

    constructor() {
        superOwner = msg.sender;
        alternativeOwner = superOwner;
    }

    function setOrganization(
        string memory _id,
        string memory _name,
        string memory _description
    ) external onlyGelatoRelay{
        Organization _newOrg = new Organization(_id,_name,_description, superOwner, payable(msg.sender));
        organizations.push(_newOrg);
        usersOrgs[msg.sender].push(_newOrg);
    }
    function joinOrganization(Organization _org) external onlyGelatoRelay {
        //Organization.Info memory _info = _org.getInfo();
        usersOrgs[msg.sender].push(_org);
    }

    function getUserOrgs() external view onlyGelatoRelay returns (Organization[] memory) {
        return usersOrgs[msg.sender];
    }

    function getOrgInfo(uint256 _index) external view onlyGelatoRelay returns (Organization.Info memory) {
        return usersOrgs[msg.sender][_index].getInfo();
    }

    function getOrgInfoFromAddress(
        Organization _org
    ) external view onlyGelatoRelay returns (Organization.Info memory) {
        return _org.getInfo();
    }

    function getOrgsCount() external view returns (uint256) {
        return organizations.length;
    }
}