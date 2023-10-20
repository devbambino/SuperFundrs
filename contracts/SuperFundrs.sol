// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

contract Organization {
    bool public fundrsWithdrawalsAllowed;
    bool public adminWithdrawalsAllowed;
    bool public orgWithdrawalsAllowed;
    bool public proposalsAllowed;
    //PENDING: from this set as PRIVATE
    uint256 orgWithdrawalBalance;
    uint256 adminBalance;
    uint256 fundrsBalance;
    uint256 public constant adminStakingThreshold = 0.1999 ether;
    uint256 public constant fundersStakingThreshold = 0.04999 ether;
    address payable public admin; //organization admin
    address public owner;
    address public superOwner;//PENDING: set superOwner as a predefined address to increase security
    Info private info;
    mapping(address => uint256) public usersBalances; //balance of each user in this org
    mapping(address => string) public usersAliases; //Alias(name) of each user in this org
    mapping(address => bool) public usersBlacklisted; //User banned from this org, always PUBLIC so other contracts could use the info

    event NewOrg(string _id, address _superOwner, address _owner, address _admin);
    
    struct Info {
        bool justSameOrgId;
        uint256[] proposals;
        string id; //organization web domain
        string name;
        string description;
    }
    modifier onlyAdmin() {
        require(msg.sender == admin, 'E201'); //E20: You are not the admin of this org!!!
        _;
    }
    modifier poolIsEnabled() {
        require(proposalsAllowed, "E202"); //E20: This organization is disabled so no staking and proposals are allowed!!!
        _;
    }
    modifier isStaking() {
        uint256 _stakingThreshold = fundersStakingThreshold;
        string memory _error = 'E203';//E20: You need to stake at least 0.05 tokens!!!
        if(msg.sender == admin){
            _stakingThreshold = adminStakingThreshold;
            _error = 'E204';//E20: You need to stake at least 0.2 tokens!!!
        }
        require(
            usersBalances[msg.sender] > _stakingThreshold || msg.value + usersBalances[msg.sender] > _stakingThreshold,
            _error
        );
        _;
    }
    modifier isUser(address _sender){
        require(usersBalances[_sender] > 0, 'E205'); //E20:You don't have a balance here!
        _;
    }
    modifier readyToWithdraw() {
        bool withdrawalsAllowed = fundrsWithdrawalsAllowed;
        if (admin == msg.sender) {
            withdrawalsAllowed = adminWithdrawalsAllowed;
        }
        require(withdrawalsAllowed, 'E206'); //E20:Withdrawals are not allowed yet!
        _;
    }
    modifier onlySuperowner() {
        require(msg.sender == superOwner, 'E207'); //E20: You has no permission!!!
        _;
    }
    modifier onlyOwners() {
        require(msg.sender == superOwner || msg.sender == owner, 'E208'); //E20: You has no permission!!!
        _;
    }
    modifier notBlacklisted(address _sender){
        require(!usersBlacklisted[_sender],'E209'); //E20: You are not allowed to use the app!!!
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
        emit NewOrg(_id,superOwner,owner,admin);
    }

    function getInfo(address _requestedBy) external view onlyOwners notBlacklisted(_requestedBy) returns (Info memory){
        return info;
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
    function getAdmin() external view onlyOwners returns(address){
        return admin;
    }

    function setProposalsAllowed(bool _allowProposals) external payable onlyAdmin isStaking {
        proposalsAllowed = _allowProposals;
        usersBalances[msg.sender] = msg.value;
        adminBalance += msg.value;
    }

    function withdrawUserFunds() external payable notBlacklisted(msg.sender) isUser(msg.sender) readyToWithdraw {
        uint256 _amount = usersBalances[msg.sender];
        (bool _success, ) = payable(msg.sender).call{value: _amount}('');
        require(_success, 'E210'); //E210:Failed to withdraw tokens!
        delete usersBalances[msg.sender];
        if (admin == msg.sender) {
            delete adminBalance;
            delete proposalsAllowed;
        } else {
            fundrsBalance -= _amount;
        }
    }

    function stakeFunds() external payable notBlacklisted(msg.sender) poolIsEnabled isStaking{
        usersBalances[msg.sender] += msg.value;
        if (admin == msg.sender) {
            adminBalance += msg.value;
        } else {
            fundrsBalance += msg.value;
        }
    }

    function setWithdrawalAllowances(
        bool _forAdmin,
        bool _forFundrs,
        bool _forOrg
    ) external onlyOwners {
        adminWithdrawalsAllowed = _forAdmin;
        fundrsWithdrawalsAllowed = _forFundrs;
        orgWithdrawalsAllowed = _forOrg;
    }
    function setBlacklistedUser(address _blacklistedUser) external onlyOwners{
        usersBlacklisted[_blacklistedUser] = true;
    }
    function setAdmin(address payable _newAdmin) external onlyOwners{
        admin = _newAdmin;
    }
    function setOwner(address _newOwner) external onlySuperowner{
        owner = _newOwner;
    }
    function setSuperOwner(address _newOwner) external onlySuperowner{
        superOwner = _newOwner;
    }
}

contract SuperFundrs {
    address public immutable superOwner;
    address public immutable alternativeOwner;
    mapping(address => Organization[]) public usersOrgs; //user's address -> orgs' addresses
    Organization[] public orgs;
    mapping(string => Organization) public orgById;

    modifier isNewOrg(string memory _orgId) {
        require(address(orgById[_orgId]) == address(0), 'E101'); //E10:This organization exists already, if you think this is a mistake please contact the support team!!!
        _;
    }
    modifier orgExists(string memory _orgId) {
        require(address(orgById[_orgId]) != address(0), 'E101b'); //E10:This organization doesn't exist yet, if you think this is a mistake please contact the support team!!!
        _;
    }
    modifier onlyOwners() {
        require(msg.sender == superOwner || msg.sender == alternativeOwner, 'E103'); //E103: You has no permission!!!
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
        orgById[_id] = _newOrg;
        //usersOrgs[msg.sender].push(_newOrg);
    }

    function joinOrganization(string memory _orgId) external orgExists(_orgId){
        require(orgById[_orgId].getUserBalanceByAddress(msg.sender) > 0,'E102');//E10:You need to stake tokens first!!!
        usersOrgs[msg.sender].push(orgById[_orgId]);
    }

    function getUserOrgs() external view returns (Organization[] memory) {
        return usersOrgs[msg.sender];
    }
    function getUserOrgsByAddress(address _user) external view onlyOwners returns (Organization[] memory) {
        return usersOrgs[_user];
    }

    /*function getOrgInfo(
        uint256 _index
    ) external view returns (Organization.Info memory) {
        require(usersOrgs[msg.sender].length > 0,'E103');//E103: You are not a member of any organization!!!
        return usersOrgs[msg.sender][_index].getInfo(msg.sender);
    }*/

    function getOrgFromId(
        string memory _orgId
    ) external view returns (Organization) {
        return orgById[_orgId];
    }
    function getOrgInfoFromId(
        string memory _orgId
    ) external view orgExists(_orgId)returns (Organization.Info memory) {
        return orgById[_orgId].getInfo(msg.sender);
    }

    function getOrgsCount() external view returns (uint256) {
        return orgs.length;
    }
}
