// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function decimals() external view returns (uint8);
}

contract ScentProtocol {
    struct Perfume {
        string name;
        uint8 gender;      // 0=Unisex, 1=Male, 2=Female
        uint8 pType;       // 0=Parfum, 1=EDP, 2=EDT, 3=EDC
        string[3] topNotes;
        string[3] heartNotes;
        string[3] baseNotes;
        uint8 concentration;
        uint8 rarity;      // 0=Common, 1=Rare, 2=Epic, 3=Legendary
        uint256 createdAt;
        address creator;
    }

    string public name = "ScentProtocol";
    string public symbol = "SCENT";
    uint256 private _nextTokenId = 1;

    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;
    mapping(uint256 => Perfume) public perfumes;

    IERC20 public usdc;
    address public feeRecipient;
    uint256 public mintPrice = 10 * 10**6; // 10 USDC (6 decimals on Arc)
    address public owner;

    string[10] private _adjectives = [
        "Midnight", "Golden", "Silver", "Royal", "Wild", 
        "Pure", "Dark", "Fresh", "Sweet", "Bitter"
    ];
    string[10] private _nouns = [
        "Oud", "Breeze", "Musk", "Rose", "Amber", 
        "Wood", "Rain", "Fire", "Ice", "Velvet"
    ];
    string[10] private _top = [
        "Bergamot", "Lemon", "Mint", "Lavender", "Grapefruit",
        "Ginger", "Basil", "Tangerine", "Apple", "Blackcurrant"
    ];
    string[10] private _heart = [
        "Rose", "Jasmine", "Iris", "Lily", "Cinnamon",
        "Cardamom", "Nutmeg", "Ylang-Ylang", "Geranium", "Peach"
    ];
    string[10] private _base = [
        "Sandalwood", "Vetiver", "Oud", "Musk", "Amber",
        "Patchouli", "Vanilla", "Cedar", "Leather", "Tonka"
    ];

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    event PerfumeCreated(
        uint256 indexed tokenId,
        address indexed creator,
        string name,
        uint8 rarity,
        uint8 gender,
        uint8 pType
    );
    event PerfumeRedeemed(uint256 indexed tokenId, address indexed owner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _usdc, address _feeRecipient) {
        usdc = IERC20(_usdc);
        feeRecipient = _feeRecipient;
        owner = msg.sender;
    }

    // ============ ERC-721 Core ============
    function balanceOf(address account) external view returns (uint256) {
        require(account != address(0), "Zero address");
        return _balances[account];
    }

    function ownerOf(uint256 tokenId) external view returns (address) {
        address account = _owners[tokenId];
        require(account != address(0), "Not minted");
        return account;
    }

    function approve(address to, uint256 tokenId) external {
        address _owner = _owners[tokenId];
        require(msg.sender == _owner || _operatorApprovals[_owner][msg.sender], "Not authorized");
        _tokenApprovals[tokenId] = to;
        emit Approval(_owner, to, tokenId);
    }

    function getApproved(uint256 tokenId) external view returns (address) {
        require(_owners[tokenId] != address(0), "Not minted");
        return _tokenApprovals[tokenId];
    }

    function setApprovalForAll(address operator, bool approved) external {
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address _owner, address operator) external view returns (bool) {
        return _operatorApprovals[_owner][operator];
    }

    function transferFrom(address from, address to, uint256 tokenId) external {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not authorized");
        require(from == _owners[tokenId], "Wrong from");
        require(to != address(0), "Zero address");

        _tokenApprovals[tokenId] = address(0);
        _balances[from]--;
        _balances[to]++;
        _owners[tokenId] = to;

        emit Transfer(from, to, tokenId);
    }

    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        address _owner = _owners[tokenId];
        return spender == _owner || spender == _tokenApprovals[tokenId] || _operatorApprovals[_owner][spender];
    }

    // ============ ScentProtocol Logic ============

    function setMintPrice(uint256 newPrice) external onlyOwner {
        mintPrice = newPrice;
    }

    function setFeeRecipient(address newRecipient) external onlyOwner {
        feeRecipient = newRecipient;
    }

    function createPerfume(uint8 gender, uint8 pType) external returns (uint256) {
        require(gender <= 2, "Invalid gender");
        require(pType <= 3, "Invalid type");

        usdc.transferFrom(msg.sender, feeRecipient, mintPrice);

        uint256 tokenId = _nextTokenId++;
        uint256 seed = uint256(keccak256(abi.encodePacked(
            block.timestamp, msg.sender, tokenId, block.prevrandao
        )));

        Perfume memory p;
        p.gender = gender;
        p.pType = pType;
        p.createdAt = block.timestamp;
        p.creator = msg.sender;

        p.name = string(abi.encodePacked(
            _adjectives[seed % 10], " ", _nouns[(seed / 10) % 10]
        ));

        uint256 s = seed;
        p.topNotes[0] = _top[(s++) % 10];
        p.topNotes[1] = _top[(s++) % 10];
        p.topNotes[2] = _top[(s++) % 10];
        p.heartNotes[0] = _heart[(s++) % 10];
        p.heartNotes[1] = _heart[(s++) % 10];
        p.heartNotes[2] = _heart[(s++) % 10];
        p.baseNotes[0] = _base[(s++) % 10];
        p.baseNotes[1] = _base[(s++) % 10];
        p.baseNotes[2] = _base[(s++) % 10];

        uint256 rarityRoll = (seed % 100);
        if (rarityRoll >= 96) p.rarity = 3;
        else if (rarityRoll >= 81) p.rarity = 2;
        else if (rarityRoll >= 51) p.rarity = 1;
        else p.rarity = 0;

        if (pType == 0) p.concentration = uint8(20 + (seed % 11));
        else if (pType == 1) p.concentration = uint8(15 + (seed % 6));
        else if (pType == 2) p.concentration = uint8(10 + (seed % 6));
        else p.concentration = uint8(5 + (seed % 6));

        perfumes[tokenId] = p;
        _owners[tokenId] = msg.sender;
        _balances[msg.sender]++;

        emit Transfer(address(0), msg.sender, tokenId);
        emit PerfumeCreated(tokenId, msg.sender, p.name, p.rarity, gender, pType);

        return tokenId;
    }

    function getPerfume(uint256 tokenId) external view returns (Perfume memory) {
        require(_owners[tokenId] != address(0), "Not minted");
        return perfumes[tokenId];
    }

    function redeemPerfume(uint256 tokenId) external {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not owner");
        address _owner = _owners[tokenId];

        _tokenApprovals[tokenId] = address(0);
        _balances[_owner]--;
        delete _owners[tokenId];
        delete perfumes[tokenId];

        emit Transfer(_owner, address(0), tokenId);
        emit PerfumeRedeemed(tokenId, _owner);
    }

    function emergencyWithdraw(uint256 amount) external onlyOwner {
        usdc.transfer(owner, amount);
    }
}
