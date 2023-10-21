// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

contract Organization {
    bool public fundrsWithdrawalsAllowed;
    bool public adminWithdrawalsAllowed;
    bool public orgWithdrawalsAllowed;
    bool public proposalsAllowed;
    //PENDING: from this set as PRIVATE
    uint256 private constant adminStakingThreshold = 0.1999 ether;
    uint256 private constant fundersStakingThreshold = 0.04999 ether;
    address payable private admin; //organization admin
    address private owner;
    address private immutable superOwner;//PENDING: set superOwner as a predefined address to increase security
    Info private info;
    Treasury private treasury;
    address[] users;
    mapping(address => uint256) private userBalance; //balance of each user in this org
    mapping(address => string) private userAlias; //Alias(name) of each user in this org
    mapping(address => bool) private userBlacklisted; //User banned from this org, always PUBLIC so other contracts could use the info
    mapping(address => bool) private userJoined;

    event NewOrg(string _id, address _superOwner, address _owner, address _admin);
    
    struct Info {
        bool justSameOrgId;
        uint256[] proposals;
        string id; //organization web domain
        string name;
        string description;
    }
    struct Treasury{
    uint256 orgWithdrawalBalance;
    uint256 adminBalance;
    uint256 fundrsBalance;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, 'E201'); //E201: You are not the admin of this org!!!
        _;
    }
    modifier poolIsEnabled() {
        require(proposalsAllowed, 'E202'); //E202: This organization is disabled so no staking and proposals are allowed!!!
        _;
    }
    modifier isStaking() {
        uint256 _stakingThreshold = fundersStakingThreshold;
        string memory _error = 'E203';//E203: You need to stake at least 0.05 tokens!!!
        if(msg.sender == admin){
            _stakingThreshold = adminStakingThreshold;
            _error = 'E204';//E204: You need to stake at least 0.2 tokens!!!
        }
        require(
            userBalance[msg.sender] > _stakingThreshold || msg.value + userBalance[msg.sender] > _stakingThreshold,
            _error
        );
        _;
    }
    modifier isUser(address _sender){
        require(userBalance[_sender] > 0, 'E205'); //E205:You don't have a balance here!
        _;
    }
    modifier readyToWithdraw() {
        bool withdrawalsAllowed = fundrsWithdrawalsAllowed;
        if (admin == msg.sender) {
            withdrawalsAllowed = adminWithdrawalsAllowed;
        }
        require(withdrawalsAllowed, 'E206'); //E206:Withdrawals are not allowed yet!
        _;
    }
    modifier onlySuperowner() {
        require(msg.sender == superOwner, 'E207'); //E207: You has no permission!!!
        _;
    }
    modifier onlyOwners() {
        require(msg.sender == superOwner || msg.sender == owner, 'E208'); //E208: You has no permission!!!
        _;
    }
    modifier notBlacklisted(address _sender){
        require(!userBlacklisted[_sender],'E209'); //E209: You are not allowed to use the app!!!
        _;
    }
    modifier onlyOwnersAndAdmin() {
        require(msg.sender == superOwner || msg.sender == owner || msg.sender == admin, 'E211'); //E211: You has no permission!!!
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
        userAlias[_admin] = 'Admin';
        emit NewOrg(_id,superOwner,owner,admin);
    }

    function getInfo(address _requestedBy) external view onlyOwners notBlacklisted(_requestedBy) returns (Info memory){
        return info;
    }
    function getTreasury() external view onlyOwnersAndAdmin returns (Treasury memory){
        return treasury;
    }

    function getBalance() external view onlyOwnersAndAdmin returns (uint256) {
        return address(this).balance;
    }
    function getUserBalance() external view returns (uint256) {
        return userBalance[msg.sender];
    }
    function getUserBalanceByAddress(address _user) external view onlyOwners returns (uint256) {
        return userBalance[_user];
    }
    function getAdmin() external view onlyOwners returns(address){
        return admin;
    }
    function getUsers() external view onlyOwners returns(address[] memory){
        return users;
    }
    function getUsersCount() external view onlyOwnersAndAdmin returns(uint256){
        return users.length;
    }
    function getUserJoined(address _user) external view onlyOwners returns(bool){
        return userJoined[_user];
    }
    function setUserJoined(address _user) external onlyOwners{
        userJoined[_user] = true;
        users.push(_user);
    }
    function setProposalsAllowed(bool _allowProposals) external payable onlyAdmin isStaking {
        proposalsAllowed = _allowProposals;
        userBalance[msg.sender] = msg.value;
        treasury.adminBalance += msg.value;
    }

    function withdrawUserFunds() external payable notBlacklisted(msg.sender) isUser(msg.sender) readyToWithdraw {
        uint256 _amount = userBalance[msg.sender];
        (bool _success, ) = payable(msg.sender).call{value: _amount}('');
        require(_success, 'E210'); //E210:Failed to withdraw tokens!
        delete userBalance[msg.sender];
        if (admin == msg.sender) {
            delete treasury.adminBalance;
            delete proposalsAllowed;
        } else {
            treasury.fundrsBalance -= _amount;
        }
    }

    function stakeFunds() external payable notBlacklisted(msg.sender) poolIsEnabled isStaking{
        userBalance[msg.sender] += msg.value;
        if (admin == msg.sender) {
            treasury.adminBalance += msg.value;
        } else {
            treasury.fundrsBalance += msg.value;
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
        userBlacklisted[_blacklistedUser] = true;
    }
    function setAdmin(address payable _newAdmin) external onlyOwners{
        admin = _newAdmin;
    }
    function setOwner(address _newOwner) external onlySuperowner{
        owner = _newOwner;
    }
}

contract SuperFundrs {
    address private immutable superOwner;
    address private alternativeOwner;
    string[] private orgs;// all the organizations ids
    mapping(address => Organization[]) private usersOrgs; //user's address -> orgs' addresses
    mapping(string => Organization) private orgById;/// org id -> org address

    modifier isNewOrg(string memory _orgId) {
        require(address(orgById[_orgId]) == address(0), 'E101'); //E101:This organization exists already, if you think this is a mistake please contact the support team!!!
        _;
    }
    modifier orgExists(string memory _orgId) {
        require(address(orgById[_orgId]) != address(0), 'E101b'); //E101b:This organization doesn't exist yet, if you think this is a mistake please contact the support team!!!
        _;
    }
    modifier onlyOwners() {
        require(msg.sender == superOwner || msg.sender == alternativeOwner, 'E103'); //E103: You has no permission!!!
        _;
    }
    modifier onlySuperowner() {
        require(msg.sender == superOwner, 'E105'); //E105: You has no permission!!!
        _;
    }

    constructor() {
        superOwner = msg.sender;
        alternativeOwner = superOwner;
    }

    function setAlternativeOwner(address _newOwner) external onlySuperowner{
        alternativeOwner = _newOwner;
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
        orgs.push(_id);
        orgById[_id] = _newOrg;
        //usersOrgs[msg.sender].push(_newOrg);
    }
    function setWithdrawalAllowances(
        bool _forAdmin,
        bool _forFundrs,
        bool _forOrg, string memory _orgId
    ) external onlyOwners{
        orgById[_orgId].setWithdrawalAllowances(_forAdmin,_forFundrs,_forOrg);
    }

    function joinOrganization(string memory _orgId) external orgExists(_orgId){
        require(orgById[_orgId].getUserBalanceByAddress(msg.sender) > 0,'E102');//E102:You need to stake tokens first!!!
        require(!orgById[_orgId].getUserJoined(msg.sender),'E104');//E104: You have already joined this org!!!
        usersOrgs[msg.sender].push(orgById[_orgId]);
        orgById[_orgId].setUserJoined(msg.sender);
    }

    function getTreasuryFromId(string memory _orgId) external view onlyOwners returns (Organization.Treasury memory){
        return orgById[_orgId].getTreasury();
    }

    function getUserOrgs() external view returns (Organization[] memory) {
        return usersOrgs[msg.sender];
    }
    function getUserOrgsByAddress(address _user) external view onlyOwners returns (Organization[] memory) {
        return usersOrgs[_user];
    }
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

    function getOrgs() external view onlyOwners returns (string[] memory) {
        return orgs;
    }

    function getOrgsCount() external view returns (uint256) {
        return orgs.length;
    }
}
