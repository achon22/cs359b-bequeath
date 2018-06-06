pragma experimental ABIEncoderV2; // Adds ability to pass structs as function arguments.

contract BequeathContract {
 struct Bequeathal {
     uint tokenType; // 1 is ether, 20 is erc-20, and 721 is erc-721
     uint amount; //number of ether, erc20, or erc721 token id
     address[] beneficiaries;
     uint[] dates;
     address contractAddress;
 }

 /* mapping (address => address) private BeneficiaryToDonor; */
 mapping (uint => Bequeathal) internal IdToBequeathal;
 mapping (address => uint[]) internal BeneficiaryToIds;
 uint256 balance;
 uint256 current_id;
 constructor() public{
   balance = 0;
   current_id = 0;
 }

 function viewBequeathal(uint id) public view returns (uint, uint, address[], uint[], address){
   Bequeathal storage b = IdToBequeathal[id];
   return (b.tokenType, b.amount, b.beneficiaries, b.dates, b.contractAddress);
 }

 function viewMyIds(address beneficiary) public view returns (uint[] ids){
   return BeneficiaryToIds[beneficiary];
 }

 function viewMyBequeathals(address beneficiary) public view returns (Bequeathal[] bequeathals){
   uint len = BeneficiaryToIds[beneficiary].length;
   bequeathals = new Bequeathal[](len);
   for (uint i = 0; i < len; i++){
     bequeathals[i] = IdToBequeathal[i];
   }
   return bequeathals;
 }

 function bequeath(uint _type, address _contractAddress, address[] _beneficiaries, uint[] _dates, uint256[] _tokenIds) public payable returns (bool success){
    current_id += 1;
    if (_type == 1 || _type == 20 || _type == 721){
      for (uint j = 0; j < _beneficiaries.length; j++) {
        BeneficiaryToIds[_beneficiaries[j]].push(current_id);
      }
    }
    Bequeathal memory newBequeathal;
    if (_type == 1) {
      newBequeathal = Bequeathal(_type, msg.value, _beneficiaries, _dates, 0x0);
      IdToBequeathal[current_id] = newBequeathal;
      balance += msg.value;
    } else if (_type == 20) {
      //assume approved
       ERC20Token erc20TokenContract = ERC20Token(_contractAddress);
       uint amount = erc20TokenContract.allowance(msg.sender, address(this));
       success = erc20TokenContract.transferFrom(msg.sender, address(this), amount);
       if (success) {
        newBequeathal = Bequeathal(_type, amount, _beneficiaries, _dates, _contractAddress);
         IdToBequeathal[current_id]=newBequeathal;
       } else {
         return false;
       }
    } else if (_type == 721) {
       ERC721Token erc721TokenContract = ERC721Token(_contractAddress);
       for (uint i = 0; i < _tokenIds.length; i++) {
          uint256 id = _tokenIds[i];
          if (erc721TokenContract.getApproved(id)==msg.sender) {
            erc721TokenContract.safeTransferFrom(msg.sender, address(this), id, "");
            newBequeathal = Bequeathal(_type, id, _beneficiaries, _dates, _contractAddress);
            IdToBequeathal[current_id+i]=newBequeathal;
          }
          current_id += _tokenIds.length;
       }
    }
    return true;
 }

 function claimId(uint id) public payable returns (bool success){
   Bequeathal storage asset = IdToBequeathal[id];
   for (uint b = 0; b < asset.beneficiaries.length; b++){
     address beneficiary = asset.beneficiaries[b];
     uint date = asset.dates[b];
     if (beneficiary == msg.sender && date <= block.timestamp){
       if (asset.tokenType == 1){
         balance -= asset.amount;
         msg.sender.transfer(asset.amount);
       }else if (asset.tokenType == 20){
         ERC20Token erc20 = ERC20Token(asset.contractAddress);
         erc20.transfer(msg.sender, asset.amount);
       }else if (asset.tokenType == 721){
         ERC721Token erc721 = ERC721Token(asset.contractAddress);
         erc721.safeTransferFrom(address(this), msg.sender, asset.amount, "");
       }
       delete IdToBequeathal[id];
       BeneficiaryToIds[msg.sender][i];
       for (uint i = 0; i < BeneficiaryToIds[msg.sender].length; i++){
         if (BeneficiaryToIds[msg.sender][i] == id) {
           delete BeneficiaryToIds[msg.sender][i];
           return true;
         }
       }
     }
   }
   return false;
 }


contract ERC20Token {
    function totalSupply() public constant returns (uint);
    function balanceOf(address tokenOwner) public constant returns (uint balance);
    function allowance(address tokenOwner, address spender) public constant returns (uint remaining);
    function transfer(address to, uint tokens) public returns (bool success);
    function approve(address spender, uint tokens) public returns (bool success);
    function transferFrom(address from, address to, uint tokens) public returns (bool success);

    event Transfer(address indexed from, address indexed to, uint tokens);
    event Approval(address indexed tokenOwner, address indexed spender, uint tokens);
}

contract ERC721Token {
    /// @dev This emits when ownership of any NFT changes by any mechanism.
    ///  This event emits when NFTs are created (`from` == 0) and destroyed
    ///  (`to` == 0). Exception: during contract creation, any number of NFTs
    ///  may be created and assigned without emitting Transfer. At the time of
    ///  any transfer, the approved address for that NFT (if any) is reset to none.
    event Transfer(address indexed _from, address indexed _to, uint256 _tokenId);

    /// @dev This emits when the approved address for an NFT is changed or
    ///  reaffirmed. The zero address indicates there is no approved address.
    ///  When a Transfer event emits, this also indicates that the approved
    ///  address for that NFT (if any) is reset to none.
    event Approval(address indexed _owner, address indexed _approved, uint256 _tokenId);

    /// @dev This emits when an operator is enabled or disabled for an owner.
    ///  The operator can manage all NFTs of the owner.
    event ApprovalForAll(address indexed _owner, address indexed _operator, bool _approved);

    /// @notice Count all NFTs assigned to an owner
    /// @dev NFTs assigned to the zero address are considered invalid, and this
    ///  function throws for queries about the zero address.
    /// @param _owner An address for whom to query the balance
    /// @return The number of NFTs owned by `_owner`, possibly zero
    function balanceOf(address _owner) external view returns (uint256);

    /// @notice Find the owner of an NFT
    /// @param _tokenId The identifier for an NFT
    /// @dev NFTs assigned to zero address are considered invalid, and queries
    ///  about them do throw.
    /// @return The address of the owner of the NFT
    function ownerOf(uint256 _tokenId) external view returns (address);

    /// @notice Transfers the ownership of an NFT from one address to another address
    /// @dev Throws unless `msg.sender` is the current owner, an authorized
    ///  operator, or the approved address for this NFT. Throws if `_from` is
    ///  not the current owner. Throws if `_to` is the zero address. Throws if
    ///  `_tokenId` is not a valid NFT. When transfer is complete, this function
    ///  checks if `_to` is a smart contract (code size > 0). If so, it calls
    ///  `onERC721Received` on `_to` and throws if the return value is not
    ///  `bytes4(keccak256("onERC721Received(address,uint256,bytes)"))`.
    /// @param _from The current owner of the NFT
    /// @param _to The new owner
    /// @param _tokenId The NFT to transfer
    /// @param data Additional data with no specified format, sent in call to `_to`
    function safeTransferFrom(address _from, address _to, uint256 _tokenId, bytes data) external payable;

    /// @notice Transfers the ownership of an NFT from one address to another address
    /// @dev This works identically to the other function with an extra data parameter,
    ///  except this function just sets data to ""
    /// @param _from The current owner of the NFT
    /// @param _to The new owner
    /// @param _tokenId The NFT to transfer
    function safeTransferFrom(address _from, address _to, uint256 _tokenId) external payable;

    /// @notice Transfer ownership of an NFT -- THE CALLER IS RESPONSIBLE
    ///  TO CONFIRM THAT `_to` IS CAPABLE OF RECEIVING NFTS OR ELSE
    ///  THEY MAY BE PERMANENTLY LOST
    /// @dev Throws unless `msg.sender` is the current owner, an authorized
    ///  operator, or the approved address for this NFT. Throws if `_from` is
    ///  not the current owner. Throws if `_to` is the zero address. Throws if
    ///  `_tokenId` is not a valid NFT.
    /// @param _from The current owner of the NFT
    /// @param _to The new owner
    /// @param _tokenId The NFT to transfer
    function transferFrom(address _from, address _to, uint256 _tokenId) external payable;

    /// @notice Set or reaffirm the approved address for an NFT
    /// @dev The zero address indicates there is no approved address.
    /// @dev Throws unless `msg.sender` is the current NFT owner, or an authorized
    ///  operator of the current owner.
    /// @param _approved The new approved NFT controller
    /// @param _tokenId The NFT to approve
    function approve(address _approved, uint256 _tokenId) external payable;

    /// @notice Enable or disable approval for a third party ("operator") to manage
    ///  all of `msg.sender`'s assets.
    /// @dev Emits the ApprovalForAll event
    /// @param _operator Address to add to the set of authorized operators.
    /// @param _approved True if the operators is approved, false to revoke approval
    function setApprovalForAll(address _operator, bool _approved) external;

    /// @notice Get the approved address for a single NFT
    /// @dev Throws if `_tokenId` is not a valid NFT
    /// @param _tokenId The NFT to find the approved address for
    /// @return The approved address for this NFT, or the zero address if there is none
    function getApproved(uint256 _tokenId) external view returns (address);

    /// @notice Query if an address is an authorized operator for another address
    /// @param _owner The address that owns the NFTs
    /// @param _operator The address that acts on behalf of the owner
    /// @return True if `_operator` is an approved operator for `_owner`, false otherwise
    function isApprovedForAll(address _owner, address _operator) external view returns (bool);

    /// @notice Query if a contract implements an interface
    /// @param interfaceID The interface identifier, as specified in ERC-165
    /// @dev Interface identification is specified in ERC-165. This function
    ///  uses less than 30,000 gas.
    /// @return `true` if the contract implements `interfaceID` and
    ///  `interfaceID` is not 0xffffffff, `false` otherwise
    function supportsInterface(bytes4 interfaceID) external view returns (bool);
}
