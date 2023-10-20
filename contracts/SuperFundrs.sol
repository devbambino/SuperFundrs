// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

contract Organization {
    uint256 public constant adminStakingThreshold = 0.1999 ether;
    uint256 public constant fundersStakingThreshold = 0.04999 ether;
    address payable public admin; //organization admin
    address public immutable owner;
    address public immutable superOwner;
    Info private info;
    mapping(address => uint256) public usersBalances; //balance of each user in this org
    mapping(address => string) public usersAliases; //Alias(name) of each user in this org
    mapping(address => bool) public usersBlacklisted; //User banned from this org, always PUBLIC so other contracts could use the info

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
    modifier onlyAdmin() {
        require(msg.sender == admin, 'E20'); //E20: You are not the admin of this org!!!
        _;
    }
    modifier poolIsEnabled() {
        require(info.proposalsAllowed, "E20"); //E20: This organization is disabled so no staking and proposals are allowed!!!
        _;
    }
    modifier isStaking() {
        uint256 _stakingThreshold = fundersStakingThreshold;
        string memory _error = 'E20';//E20: You need to stake at least 0.05 tokens!!!
        if(msg.sender == admin){
            _stakingThreshold = adminStakingThreshold;
            _error = 'E20';//E20: You need to stake at least 0.2 tokens!!!
        }
        require(
            usersBalances[msg.sender] > _stakingThreshold || msg.value + usersBalances[msg.sender] > _stakingThreshold,
            _error
        );
        _;
    }
    modifier isUser(){
        require(usersBalances[msg.sender] > 0, 'E20'); //E20:You don't have a balance here!
        _;
    }
    modifier readyToWithdraw() {
        bool withdrawalsAllowed = info.fundrsWithdrawalsAllowed;
        if (admin == msg.sender) {
            withdrawalsAllowed = info.adminWithdrawalsAllowed;
        }
        require(withdrawalsAllowed, 'E20'); //E20:Withdrawals are not allowed yet!
        _;
    }
    modifier onlySuperowner() {
        require(msg.sender == superOwner, 'E20'); //E20: You has no permission!!!
        _;
    }
    modifier onlyOwners() {
        require(msg.sender == superOwner || msg.sender == owner, 'E20'); //E20: You has no permission!!!
        _;
    }
    modifier notBlacklisted(address _sender){
        require(!usersBlacklisted[_sender],'E20'); //E20: You are not allowed to use the app!!!
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
        usersAliases[_admin] = 'Admin';
    }

    function getInfo(address _requestedBy) external view onlyOwners notBlacklisted(_requestedBy) returns (Info memory){
        return info;
    }

    function setProposalsAllowed(bool _allowProposals) external payable onlyAdmin isStaking {
        info.proposalsAllowed = _allowProposals;
        usersBalances[msg.sender] = msg.value;
        info.adminBalance += msg.value;
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getUserBalance() external view returns (uint256) {
        return usersBalances[msg.sender];
    }

    function getUserBalanceByAddress(address _user) external view onlyOwners returns (uint256) {
        return usersBalances[_user];
    }

    function userFundsWithdrawal() external payable notBlacklisted(msg.sender) isUser readyToWithdraw {
        uint256 _amount = usersBalances[msg.sender];
        (bool _success, ) = payable(msg.sender).call{value: _amount}('');
        require(_success, 'E20'); //E20:Failed to withdraw tokens!
        delete usersBalances[msg.sender];
        if (admin == msg.sender) {
            delete info.adminBalance;
            delete info.proposalsAllowed;
        } else {
            info.fundrsBalance -= _amount;
        }
    }

    function stakeFunds() external payable notBlacklisted(msg.sender) poolIsEnabled isStaking{
        usersBalances[msg.sender] += msg.value;
        if (admin == msg.sender) {
            info.adminBalance += msg.value;
        } else {
            info.fundrsBalance += msg.value;
        }
    }

    function setWithdrawalAllowances(
        bool _forAdmin,
        bool _forFundrs,
        bool _forOrg
    ) external onlySuperowner {
        info.adminWithdrawalsAllowed = _forAdmin;
        info.fundrsWithdrawalsAllowed = _forFundrs;
        info.orgWithdrawalsAllowed = _forOrg;
    }
    function getAdmin() external view onlyOwners returns(address){
        return admin;
    }
    function changeAdmin(address payable _newAdmin) external onlyOwners{
        admin = _newAdmin;
    }
    function setBlacklistedUser(address _blacklistedUser) external onlyOwners{
        usersBlacklisted[_blacklistedUser] = true;
    }
}

contract SuperFundrs {
    address public immutable superOwner;
    address public immutable alternativeOwner;
    mapping(address => Organization[]) public usersOrgs; //user's address -> orgs' addresses
    Organization[] public orgs;
    mapping(string => Organization) public orgByIds;

    modifier isNewOrg(string memory _orgId) {
        require(address(orgByIds[_orgId]) == address(0), 'E10'); //E10:This organization exists already, if you think this is a mistake please contact the support team!!!
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
    ) external isNewOrg(_id){
        Organization _newOrg = new Organization(
            _id,
            _name,
            _description,
            superOwner,
            payable(msg.sender)
        );
        orgs.push(_newOrg);
        orgByIds[_id] = _newOrg;
        //usersOrgs[msg.sender].push(_newOrg);
    }

    function joinOrganization(Organization _org) external{
        require(_org.getUserBalanceByAddress(msg.sender) > 0,'E10');//E10:You need to stake tokens first!!!
        usersOrgs[msg.sender].push(_org);
    }

    function getUserOrgs() external view returns (Organization[] memory) {
        return usersOrgs[msg.sender];
    }

    function getOrgInfo(
        uint256 _index
    ) external view returns (Organization.Info memory) {
        return usersOrgs[msg.sender][_index].getInfo(msg.sender);
    }

    function getOrgInfoFromId(
        string memory _orgId
    ) external view returns (Organization.Info memory) {
        return orgByIds[_orgId].getInfo(msg.sender);
    }

    function getOrgsCount() external view returns (uint256) {
        return orgs.length;
    }
}
