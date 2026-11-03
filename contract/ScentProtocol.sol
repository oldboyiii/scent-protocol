// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";

contract ScentProtocolV3 is ERC721, ERC721URIStorage, ERC721Burnable, Ownable2Step, ReentrancyGuard, ERC2981 {
    using SafeERC20 for IERC20;
    using Strings for uint256;

    struct Perfume {
        uint256 tokenId;
        string name;
        uint8 gender;
        uint8 pType;
        string[3] topNotes;
        string[3] heartNotes;
        string[3] baseNotes;
        uint8 concentration;
        uint8 rarity;
        uint256 createdAt;
        address creator;
        bool isAlchemy;
        uint256 parentTokenA;
        uint256 parentTokenB;
    }

    struct PendingMint {
        address minter;
        uint256 blockNumber;
        bytes32 seedCommitment;
    }

    struct PendingBlend {
        address blender;
        uint256 tokenIdA;
        uint256 tokenIdB;
        uint256 blockNumber;
        bytes32 seedCommitment;
    }

    uint256 public constant REVEAL_BLOCKS = 5;
    uint256 public constant REVEAL_DEADLINE = 1000;
    uint256 private constant ARC_MAINNET_CHAIN_ID = 5042;
    uint256 private constant ARC_TESTNET_CHAIN_ID = 5042002;
    uint256 private constant MAX_NOTES = 10;

    IERC20 public immutable usdc;
    address private feeRecipient;
    uint256 private mintPrice;
    uint256 private alchemyPrice;
    uint256 private nextTokenId;
    uint256 private nextBlendId;
    uint256 public activePendingCount;

    string[MAX_NOTES] private topNotes;
    string[MAX_NOTES] private heartNotes;
    string[MAX_NOTES] private baseNotes;
    string[MAX_NOTES] private adjectives;
    string[MAX_NOTES] private nouns;

    mapping(uint256 => Perfume) public perfumes;
    mapping(uint256 => PendingMint) public pendingMints;
    mapping(uint256 => PendingBlend) public pendingBlends;
    mapping(address => uint256[]) public ownerTokens;
    mapping(uint256 => uint256) private _tokenIndexInOwnerArray;

    event MintRequested(uint256 indexed tokenId, address indexed minter, uint256 blockNumber);
    event BlendRequested(uint256 indexed blendId, address indexed blender, uint256 tokenIdA, uint256 tokenIdB);
    event PerfumeCreated(uint256 indexed tokenId, address indexed creator, uint8 rarity);
    event AlchemyCreated(uint256 indexed tokenId, uint256 indexed parentA, uint256 indexed parentB, uint8 rarity);
    event MintPriceSet(uint256 newPrice);
    event AlchemyPriceSet(uint256 newPrice);
    event FeeRecipientSet(address newRecipient);
    event MintExpiredCleared(uint256 indexed tokenId);
    event BlendExpiredCleared(uint256 indexed blendId);
    event TokenWithdrawn(address token, uint256 amount);
    event EthWithdrawn(uint256 amount);

    error ScentProtocol__ZeroAddress();
    error ScentProtocol__InvalidPrice();
    error ScentProtocol__TooEarly();
    error ScentProtocol__TooLate();
    error ScentProtocol__NoPendingMint();
    error ScentProtocol__NotAuthorized();
    error ScentProtocol__TokenDoesNotExist();
    error ScentProtocol__NoBalance();
    error ScentProtocol__TransferFailed();
    error ScentProtocol__WrongNetwork();
    error ScentProtocol__AlchemyOnAlchemy();
    error ScentProtocol__NotTokenOwner();
    error ScentProtocol__CommitmentMismatch();
    error ScentProtocol__MintNotExpired();
    error ScentProtocol__NoBlendPending();
    error ScentProtocol__BlendNotExpired();

    constructor(address usdcAddress, address feeRecipient_, uint256 mintPrice_)
        ERC721("ScentProtocol", "SCENT")
        Ownable(msg.sender)
    {
        if (block.chainid != ARC_MAINNET_CHAIN_ID && block.chainid != ARC_TESTNET_CHAIN_ID) {
            revert ScentProtocol__WrongNetwork();
        }
        if (usdcAddress == address(0) || feeRecipient_ == address(0)) {
            revert ScentProtocol__ZeroAddress();
        }
        if (mintPrice_ == 0) {
            revert ScentProtocol__InvalidPrice();
        }

        usdc = IERC20(usdcAddress);
        feeRecipient = feeRecipient_;
        mintPrice = mintPrice_;
        alchemyPrice = 2_000_000;
        nextTokenId = 1;
        nextBlendId = 1;

        _setDefaultRoyalty(feeRecipient_, 500);
        _initializeNotePools();
    }

    receive() external payable {}

    function requestMint(bytes32 seedCommitment) external nonReentrant returns (uint256 tokenId) {
        if (seedCommitment == bytes32(0)) revert ScentProtocol__CommitmentMismatch();
        tokenId = nextTokenId;
        pendingMints[tokenId] = PendingMint({ minter: msg.sender, blockNumber: block.number, seedCommitment: seedCommitment });
        nextTokenId = tokenId + 1;
        activePendingCount += 1;
        usdc.safeTransferFrom(msg.sender, address(this), mintPrice);
        emit MintRequested(tokenId, msg.sender, block.number);
    }

    function revealAndMint(uint256 tokenId, bytes32 seedPreimage) external nonReentrant {
        PendingMint storage pending = pendingMints[tokenId];
        if (pending.minter == address(0)) revert ScentProtocol__NoPendingMint();
        if (pending.minter != msg.sender) revert ScentProtocol__NotAuthorized();
        if (block.number <= pending.blockNumber + REVEAL_BLOCKS) revert ScentProtocol__TooEarly();
        if (block.number > pending.blockNumber + REVEAL_DEADLINE) revert ScentProtocol__TooLate();
        if (keccak256(abi.encodePacked(seedPreimage)) != pending.seedCommitment) revert ScentProtocol__CommitmentMismatch();

        uint256 entropy = uint256(keccak256(abi.encodePacked(seedPreimage, blockhash(pending.blockNumber + REVEAL_BLOCKS), tokenId)));
        Perfume memory perfume = _generatePerfume(tokenId, entropy, msg.sender);
        perfumes[tokenId] = perfume;

        usdc.safeTransfer(feeRecipient, mintPrice);
        delete pendingMints[tokenId];
        activePendingCount -= 1;
        _safeMint(msg.sender, tokenId);
        emit PerfumeCreated(tokenId, msg.sender, perfume.rarity);
    }

    function requestBlend(uint256 tokenIdA, uint256 tokenIdB, bytes32 seedCommitment) external nonReentrant returns (uint256 blendId) {
        if (tokenIdA == tokenIdB) revert ScentProtocol__TokenDoesNotExist();
        if (seedCommitment == bytes32(0)) revert ScentProtocol__CommitmentMismatch();
        if (_ownerOf(tokenIdA) == address(0) || _ownerOf(tokenIdB) == address(0)) revert ScentProtocol__TokenDoesNotExist();
        if (_ownerOf(tokenIdA) != msg.sender || _ownerOf(tokenIdB) != msg.sender) revert ScentProtocol__NotTokenOwner();
        if (perfumes[tokenIdA].isAlchemy || perfumes[tokenIdB].isAlchemy) revert ScentProtocol__AlchemyOnAlchemy();

        blendId = nextBlendId;
        pendingBlends[blendId] = PendingBlend({ blender: msg.sender, tokenIdA: tokenIdA, tokenIdB: tokenIdB, blockNumber: block.number, seedCommitment: seedCommitment });
        nextBlendId = blendId + 1;
        activePendingCount += 1;
        usdc.safeTransferFrom(msg.sender, address(this), alchemyPrice);
        emit BlendRequested(blendId, msg.sender, tokenIdA, tokenIdB);
    }

    function revealBlend(uint256 blendId, bytes32 seedPreimage) external nonReentrant returns (uint256 tokenId) {
        PendingBlend storage pending = pendingBlends[blendId];
        if (pending.blender == address(0)) revert ScentProtocol__NoBlendPending();
        if (pending.blender != msg.sender) revert ScentProtocol__NotAuthorized();
        if (block.number <= pending.blockNumber + REVEAL_BLOCKS) revert ScentProtocol__TooEarly();
        if (block.number > pending.blockNumber + REVEAL_DEADLINE) revert ScentProtocol__TooLate();
        if (keccak256(abi.encodePacked(seedPreimage)) != pending.seedCommitment) revert ScentProtocol__CommitmentMismatch();
        if (_ownerOf(pending.tokenIdA) != msg.sender || _ownerOf(pending.tokenIdB) != msg.sender) revert ScentProtocol__NotTokenOwner();

        uint256 randomSeed = uint256(keccak256(abi.encodePacked(seedPreimage, blockhash(pending.blockNumber + REVEAL_BLOCKS), blendId)));
        tokenId = nextTokenId;
        Perfume memory blended = _createBlendedPerfume(tokenId, randomSeed, pending.tokenIdA, pending.tokenIdB, msg.sender);
        
        perfumes[tokenId] = blended;
        nextTokenId = tokenId + 1;
        _burn(pending.tokenIdA);
        _burn(pending.tokenIdB);
        _safeMint(msg.sender, tokenId);
        usdc.safeTransfer(feeRecipient, alchemyPrice);
        delete pendingBlends[blendId];
        activePendingCount -= 1;
        emit AlchemyCreated(tokenId, pending.tokenIdA, pending.tokenIdB, blended.rarity);
    }

    function setMintPrice(uint256 newPrice) external onlyOwner {
        if (newPrice == 0) revert ScentProtocol__InvalidPrice();
        mintPrice = newPrice;
        emit MintPriceSet(newPrice);
    }

    function setAlchemyPrice(uint256 newPrice) external onlyOwner {
        if (newPrice == 0) revert ScentProtocol__InvalidPrice();
        alchemyPrice = newPrice;
        emit AlchemyPriceSet(newPrice);
    }

    function setFeeRecipient(address newRecipient) external onlyOwner {
        if (newRecipient == address(0)) revert ScentProtocol__ZeroAddress();
        (, uint256 amount) = royaltyInfo(0, 10_000);
        feeRecipient = newRecipient;
        _setDefaultRoyalty(newRecipient, uint96(amount));
        emit FeeRecipientSet(newRecipient);
    }

    function clearExpiredMint(uint256 tokenId) external nonReentrant {
        PendingMint storage pending = pendingMints[tokenId];
        if (pending.minter == address(0)) revert ScentProtocol__NoPendingMint();
        if (block.number <= pending.blockNumber + REVEAL_DEADLINE) revert ScentProtocol__MintNotExpired();
        address minter = pending.minter;
        delete pendingMints[tokenId];
        activePendingCount -= 1;
        usdc.safeTransfer(minter, mintPrice);
        emit MintExpiredCleared(tokenId);
    }

    function clearExpiredBlend(uint256 blendId) external nonReentrant {
        PendingBlend storage pending = pendingBlends[blendId];
        if (pending.blender == address(0)) revert ScentProtocol__NoBlendPending();
        if (block.number <= pending.blockNumber + REVEAL_DEADLINE) revert ScentProtocol__BlendNotExpired();
        address blender = pending.blender;
        delete pendingBlends[blendId];
        activePendingCount -= 1;
        usdc.safeTransfer(blender, alchemyPrice);
        emit BlendExpiredCleared(blendId);
    }

    function withdrawToken(address tokenAddress) external onlyOwner nonReentrant {
        uint256 balance = IERC20(tokenAddress).balanceOf(address(this));
        if (balance == 0) revert ScentProtocol__NoBalance();
        IERC20(tokenAddress).safeTransfer(owner(), balance);
        emit TokenWithdrawn(tokenAddress, balance);
    }

    function withdrawETH() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        if (balance == 0) revert ScentProtocol__NoBalance();
        (bool success, ) = payable(owner()).call{value: balance}("");
        if (!success) revert ScentProtocol__TransferFailed();
        emit EthWithdrawn(balance);
    }

    function getPerfume(uint256 tokenId) external view returns (Perfume memory) {
        if (_ownerOf(tokenId) == address(0)) revert ScentProtocol__TokenDoesNotExist();
        return perfumes[tokenId];
    }

    function getOwnerTokens(address owner_) external view returns (uint256[] memory) { return ownerTokens[owner_]; }
    function getMintPrice() external view returns (uint256) { return mintPrice; }
    function getAlchemyPrice() external view returns (uint256) { return alchemyPrice; }
    function getNextTokenId() external view returns (uint256) { return nextTokenId; }
    function getPendingMint(uint256 tokenId) external view returns (PendingMint memory) { return pendingMints[tokenId]; }
    function getFeeRecipient() external view returns (address) { return feeRecipient; }

    function getRemainingRevealWindow(uint256 tokenId) external view returns (uint256) {
        PendingMint memory pending = pendingMints[tokenId];
        if (pending.minter == address(0)) return 0;
        uint256 deadline = pending.blockNumber + REVEAL_DEADLINE;
        return block.number > deadline ? 0 : deadline - block.number;
    }

    function getPendingBlend(uint256 blendId) external view returns (PendingBlend memory) { return pendingBlends[blendId]; }
    function getRemainingBlendWindow(uint256 blendId) external view returns (uint256) {
        PendingBlend memory pending = pendingBlends[blendId];
        if (pending.blender == address(0)) return 0;
        uint256 deadline = pending.blockNumber + REVEAL_DEADLINE;
        return block.number > deadline ? 0 : deadline - block.number;
    }

    // === ОПТИМИЗИРОВАННЫЙ METADATA (БЕЗ BASE64/SVG) ===
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        if (_ownerOf(tokenId) == address(0)) revert ScentProtocol__TokenDoesNotExist();
        Perfume storage p = perfumes[tokenId];
        
        return string(abi.encodePacked(
            "data:application/json,{",
            '"name":"', p.name, '",',
            '"description":"ScentProtocol fragrance - ', p.name, '. ', _rarityLabel(p.rarity), ' ', _typeLabel(p.pType), '.",',
            '"attributes":[',
            '{"trait_type":"Gender","value":"', _genderLabel(p.gender), '"},',
            '{"trait_type":"Type","value":"', _typeLabel(p.pType), '"},',
            '{"trait_type":"Concentration","value":"', uint256(p.concentration).toString(), '%"},',
            '{"trait_type":"Rarity","value":"', _rarityLabel(p.rarity), '"},',
            '{"trait_type":"TopNote1","value":"', p.topNotes[0], '"},',
            '{"trait_type":"TopNote2","value":"', p.topNotes[1], '"},',
            '{"trait_type":"TopNote3","value":"', p.topNotes[2], '"},',
            '{"trait_type":"HeartNote1","value":"', p.heartNotes[0], '"},',
            '{"trait_type":"HeartNote2","value":"', p.heartNotes[1], '"},',
            '{"trait_type":"HeartNote3","value":"', p.heartNotes[2], '"},',
            '{"trait_type":"BaseNote1","value":"', p.baseNotes[0], '"},',
            '{"trait_type":"BaseNote2","value":"', p.baseNotes[1], '"},',
            '{"trait_type":"BaseNote3","value":"', p.baseNotes[2], '"},',
            '{"trait_type":"IsAlchemy","value":"', p.isAlchemy ? "true" : "false", '"}',
            ']}'
        ));
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage, ERC2981) returns (bool) {
        return interfaceId == type(IERC2981).interfaceId || super.supportsInterface(interfaceId);
    }

    function _update(address to, uint256 tokenId, address auth) internal override(ERC721) returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && from != to) {
            uint256[] storage fromTokens = ownerTokens[from];
            uint256 removeIndex = _tokenIndexInOwnerArray[tokenId];
            uint256 lastIndex = fromTokens.length - 1;
            if (removeIndex != lastIndex) {
                fromTokens[removeIndex] = fromTokens[lastIndex];
                _tokenIndexInOwnerArray[fromTokens[lastIndex]] = removeIndex;
            }
            fromTokens.pop();
            delete _tokenIndexInOwnerArray[tokenId];
        }
        address previousOwner = super._update(to, tokenId, auth);
        if (to != address(0) && to != previousOwner) {
            ownerTokens[to].push(tokenId);
            _tokenIndexInOwnerArray[tokenId] = ownerTokens[to].length - 1;
        }
        return previousOwner;
    }

    function _initializeNotePools() internal {
        topNotes = ["Bergamot", "Lemon", "Lavender", "Grapefruit", "Orange", "Mint", "Eucalyptus", "Basil", "Rosemary", "Thyme"];
        heartNotes = ["Rose", "Jasmine", "Lily", "Geranium", "Neroli", "Ylang-Ylang", "Chamomile", "Lavender", "Petitgrain", "Heliotrope"];
        baseNotes = ["Vanilla", "Sandalwood", "Cedarwood", "Vetiver", "Patchouli", "Amber", "Musk", "Tonka Bean", "Benzoin", "Oud"];
        adjectives = ["Golden", "Silver", "Midnight", "Royal", "Wild", "Pure", "Dark", "Sweet", "Bitter", "Fresh"];
        nouns = ["Rose", "Ice", "Velvet", "Rain", "Wood", "Fire", "Dream", "Mist", "Bloom", "Soul"];
    }

    function _generatePerfume(uint256 tokenId, uint256 seed, address creator) internal view returns (Perfume memory) {
        uint8 pType = uint8(seed % 4);
        return Perfume({
            tokenId: tokenId, name: _generateName(seed), gender: uint8(seed % 3), pType: pType,
            topNotes: _selectUniqueNotes(topNotes, seed, 0), heartNotes: _selectUniqueNotes(heartNotes, seed, 1),
            baseNotes: _selectUniqueNotes(baseNotes, seed, 2), concentration: _getConcentrationForType(pType, seed),
            rarity: _determineRarity(seed), createdAt: block.timestamp, creator: creator,
            isAlchemy: false, parentTokenA: 0, parentTokenB: 0
        });
    }

    function _createBlendedPerfume(uint256 tokenId, uint256 randomSeed, uint256 parentIdA, uint256 parentIdB, address creator) internal view returns (Perfume memory) {
        Perfume storage parentA = perfumes[parentIdA];
        Perfume storage parentB = perfumes[parentIdB];
        uint8 newType = uint8(randomSeed % 4);
        uint8 baseRarity = parentA.rarity >= parentB.rarity ? parentA.rarity : parentB.rarity;
        uint8 finalRarity = (randomSeed % 100 < 15 && baseRarity < 3) ? baseRarity + 1 : baseRarity;
        
        return Perfume({
            tokenId: tokenId, name: _truncateTo64(string(abi.encodePacked("Alchemy: ", parentA.name, " x ", parentB.name))),
            gender: uint8(randomSeed % 3), pType: newType, topNotes: parentA.topNotes, heartNotes: parentB.heartNotes,
            baseNotes: _selectUniqueNotes(baseNotes, randomSeed, 9), concentration: _getConcentrationForType(newType, randomSeed),
            rarity: finalRarity, createdAt: block.timestamp, creator: creator, isAlchemy: true,
            parentTokenA: parentIdA, parentTokenB: parentIdB
        });
    }

    function _determineRarity(uint256 seed) internal pure returns (uint8) {
        uint256 roll = seed % 100;
        if (roll < 15) return 3; if (roll < 35) return 2; if (roll < 65) return 1; return 0;
    }

    function _selectUniqueNotes(string[MAX_NOTES] storage notes, uint256 seed, uint256 offset) internal view returns (string[3] memory) {
        string[3] memory selected; bool[MAX_NOTES] memory used;
        uint256 indicesSeed = uint256(keccak256(abi.encodePacked(seed, offset)));
        for (uint256 i = 0; i < 3; i++) {
            uint256 index = ((indicesSeed >> (i * 64)) + i) % MAX_NOTES;
            while (used[index]) { index = (index + 1) % MAX_NOTES; }
            used[index] = true; selected[i] = notes[index];
        }
        return selected;
    }

    function _generateName(uint256 seed) internal view returns (string memory) {
        return string(abi.encodePacked(adjectives[seed % MAX_NOTES], " ", nouns[(seed >> 32) % MAX_NOTES]));
    }

    function _getConcentrationForType(uint8 pType, uint256 seed) internal pure returns (uint8) {
        uint256 v = seed % 11;
        if (pType == 0) return 20 + uint8(v); if (pType == 1) return 15 + uint8(v % 6);
        if (pType == 2) return 10 + uint8(v % 6); return 5 + uint8(v % 6);
    }

    function _truncateTo64(string memory value) internal pure returns (string memory) {
        bytes memory source = bytes(value);
        if (source.length <= 64) return value;
        bytes memory truncated = new bytes(64);
        for (uint256 i = 0; i < 64; i++) { truncated[i] = source[i]; }
        return string(truncated);
    }

    function _rarityLabel(uint8 rarity) internal pure returns (string memory) {
        if (rarity == 1) return "Rare"; if (rarity == 2) return "Epic"; if (rarity == 3) return "Legendary"; return "Common";
    }
    function _typeLabel(uint8 pType) internal pure returns (string memory) {
        if (pType == 1) return "EDP"; if (pType == 2) return "EDT"; if (pType == 3) return "EDC"; return "Parfum";
    }
    function _genderLabel(uint8 gender) internal pure returns (string memory) {
        if (gender == 1) return "Male"; if (gender == 2) return "Female"; return "Unisex";
    }
}
