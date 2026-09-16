// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract ScentProtocolV2 is 
    ERC721, 
    ERC721URIStorage, 
    ERC721Burnable, 
    Ownable2Step, 
    ReentrancyGuard
{
    using SafeERC20 for IERC20;
    using Strings for uint256;

    // Arc Mainnet Chain ID для безопасности
    uint256 private constant ARC_MAINNET_CHAIN_ID = 5042;

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
    }
    
    struct PendingMint {
        address minter;
        uint256 blockNumber;
        uint256 amount;
    }

    uint256 private constant REVEAL_BLOCKS = 5;
    uint256 private constant MAX_NOTES = 10;

    IERC20 public immutable usdc;
    uint256 private mintPrice;
    address private feeRecipient;
    uint256 private nextTokenId;
    
    string[MAX_NOTES] private topNotes;
    string[MAX_NOTES] private heartNotes;
    string[MAX_NOTES] private baseNotes;
    string[MAX_NOTES] private adjectives;
    string[MAX_NOTES] private nouns;
    
    mapping(uint256 => Perfume) public perfumes;
    mapping(uint256 => PendingMint) public pendingMints;
    mapping(address => uint256[]) public ownerTokens;
    
    event MintRequested(uint256 indexed tokenId, address indexed minter, uint256 blockNumber);
    event PerfumeCreated(uint256 indexed tokenId, address indexed creator, uint8 rarity);
    event MintPriceSet(uint256 newPrice);
    event FeeRecipientSet(address newRecipient);
    event TokenWithdrawn(address token, uint256 amount);
    event EthWithdrawn(uint256 amount);
    
    error ScentProtocol__ZeroAddress();
    error ScentProtocol__InvalidPrice();
    error ScentProtocol__TooEarly();
    error ScentProtocol__NoPendingMint();
    error ScentProtocol__NotAuthorized();
    error ScentProtocol__TokenDoesNotExist();
    error ScentProtocol__NoBalance();
    error ScentProtocol__TransferFailed();
    error ScentProtocol__WrongNetwork();

    constructor(
        address usdcAddress,
        address feeRecipient_,
        uint256 mintPrice_
    ) ERC721("ScentProtocol", "SCENT") Ownable(msg.sender) {
        // ПРОВЕРКА СЕТИ: Разрешаем деплой только на Arc Mainnet
        require(block.chainid == ARC_MAINNET_CHAIN_ID, "Must be deployed on Arc Mainnet");
        
        if (usdcAddress == address(0) || feeRecipient_ == address(0)) {
            revert ScentProtocol__ZeroAddress();
        }
        if (mintPrice_ == 0) {
            revert ScentProtocol__InvalidPrice();
        }
        
        usdc = IERC20(usdcAddress);
        feeRecipient = feeRecipient_;
        mintPrice = mintPrice_;
        nextTokenId = 1;
        
        initializeNotePools();
    }

    function initializeNotePools() internal {
        topNotes = ["Bergamot", "Lemon", "Lavender", "Grapefruit", "Orange", "Mint", "Eucalyptus", "Basil", "Rosemary", "Thyme"];
        heartNotes = ["Rose", "Jasmine", "Lily", "Geranium", "Neroli", "Ylang-Ylang", "Chamomile", "Lavender", "Petitgrain", "Heliotrope"];
        baseNotes = ["Vanilla", "Sandalwood", "Cedarwood", "Vetiver", "Patchouli", "Amber", "Musk", "Tonka Bean", "Benzoin", "Oud"];
        adjectives = ["Golden", "Silver", "Midnight", "Royal", "Wild", "Pure", "Dark", "Sweet", "Bitter", "Fresh"];
        nouns = ["Rose", "Ice", "Velvet", "Rain", "Wood", "Fire", "Dream", "Mist", "Bloom", "Soul"];
    }

    function requestMint() external nonReentrant returns (uint256 tokenId) {
        require(block.chainid == ARC_MAINNET_CHAIN_ID, "Must be on Arc Mainnet");
        
        tokenId = nextTokenId++;
        uint256 price = mintPrice;
        
        // Безопасный перевод USDC (6 decimals)
        usdc.safeTransferFrom(msg.sender, address(this), price);
        usdc.safeTransfer(feeRecipient, price);
        
        pendingMints[tokenId] = PendingMint({
            minter: msg.sender,
            blockNumber: block.number,
            amount: price
        });
        
        emit MintRequested(tokenId, msg.sender, block.number);
        return tokenId;
    }

    function revealAndMint(uint256 tokenId, uint256 userSeed) external nonReentrant {
        PendingMint storage pending = pendingMints[tokenId];
        
        if (pending.minter == address(0)) {
            revert ScentProtocol__NoPendingMint();
        }
        if (pending.minter != msg.sender) {
            revert ScentProtocol__NotAuthorized();
        }
        if (block.number <= pending.blockNumber + REVEAL_BLOCKS) {
            revert ScentProtocol__TooEarly();
        }
        
        uint256 seed = uint256(keccak256(abi.encodePacked(
            blockhash(block.number - 1),
            block.timestamp,
            userSeed,
            pending.minter,
            tokenId
        )));
        
        Perfume memory perfume = generatePerfume(tokenId, seed, pending.minter);
        
        _safeMint(pending.minter, tokenId);
        _setTokenURI(tokenId, string(abi.encodePacked("scents://", tokenId.toString())));
        
        perfumes[tokenId] = perfume;
        ownerTokens[pending.minter].push(tokenId);
        
        emit PerfumeCreated(tokenId, pending.minter, perfume.rarity);
        
        delete pendingMints[tokenId];
    }

    function generatePerfume(uint256 tokenId, uint256 seed, address creator) 
        internal 
        view 
        returns (Perfume memory) 
    {
        uint8 rarity = determineRarity(seed);
        string[3] memory top = selectUniqueNotes(topNotes, seed, 0);
        string[3] memory heart = selectUniqueNotes(heartNotes, seed, 1);
        string[3] memory base = selectUniqueNotes(baseNotes, seed, 2);
        string memory name = generateName(seed);
        uint8 pType = uint8((seed % 4));
        uint8 concentration = getConcentrationForType(pType, seed);
        
        return Perfume({
            tokenId: tokenId,
            name: name,
            gender: uint8(seed % 3),
            pType: pType,
            topNotes: top,
            heartNotes: heart,
            baseNotes: base,
            concentration: concentration,
            rarity: rarity,
            createdAt: block.timestamp,
            creator: creator
        });
    }

    function determineRarity(uint256 seed) internal pure returns (uint8) {
        uint256 roll = seed % 100;
        if (roll < 15) return 3; // 15% Legendary
        if (roll < 35) return 2; // 20% Epic
        if (roll < 65) return 1; // 30% Rare
        return 0;                // 35% Common
    }

    function selectUniqueNotes(string[MAX_NOTES] storage notes, uint256 seed, uint256 offset) 
        internal 
        view 
        returns (string[3] memory) 
    {
        string[3] memory selected;
        bool[MAX_NOTES] memory used;
        uint256 indicesSeed = uint256(keccak256(abi.encodePacked(seed, offset)));
        
        for (uint256 i = 0; i < 3; i++) {
            uint256 index;
            uint256 attempts = 0;
            do {
                index = ((indicesSeed >> (i * 64)) + attempts) % MAX_NOTES;
                attempts++;
                if (attempts > MAX_NOTES) {
                    index = (i + offset) % MAX_NOTES;
                    break;
                }
            } while (used[index]);
            
            used[index] = true;
            selected[i] = notes[index];
        }
        return selected;
    }

    function generateName(uint256 seed) internal view returns (string memory) {
        uint256 adjIndex = seed % MAX_NOTES;
        uint256 nounIndex = (seed >> 32) % MAX_NOTES;
        return string(abi.encodePacked(adjectives[adjIndex], " ", nouns[nounIndex]));
    }

    function getConcentrationForType(uint8 pType, uint256 seed) internal pure returns (uint8) {
        uint256 variance = seed % 11;
        if (pType == 0) return 20 + uint8(variance);
        if (pType == 1) return 15 + uint8(variance % 6);
        if (pType == 2) return 10 + uint8(variance % 6);
        return 5 + uint8(variance % 6);
    }

    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    function getPerfume(uint256 tokenId) external view returns (Perfume memory) {
        if (!_exists(tokenId)) {
            revert ScentProtocol__TokenDoesNotExist();
        }
        return perfumes[tokenId];
    }

    function getOwnerTokens(address owner) external view returns (uint256[] memory) {
        return ownerTokens[owner];
    }

    function getMintPrice() external view returns (uint256) {
        return mintPrice;
    }

    function getNextTokenId() external view returns (uint256) {
        return nextTokenId;
    }

    function getPendingMint(uint256 tokenId) external view returns (PendingMint memory) {
        return pendingMints[tokenId];
    }

    function getFeeRecipient() external view returns (address) {
        return feeRecipient;
    }

    function setMintPrice(uint256 newPrice) external onlyOwner {
        if (newPrice == 0) revert ScentProtocol__InvalidPrice();
        mintPrice = newPrice;
        emit MintPriceSet(newPrice);
    }

    function setFeeRecipient(address newRecipient) external onlyOwner {
        if (newRecipient == address(0)) revert ScentProtocol__ZeroAddress();
        feeRecipient = newRecipient;
        emit FeeRecipientSet(newRecipient);
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

    function _update(address to, uint256 tokenId, address auth) 
        internal 
        override(ERC721) 
        returns (address) 
    {
        address from = _ownerOf(tokenId);
        
        if (from != address(0) && from != to) {
            uint256[] storage tokens = ownerTokens[from];
            for (uint256 i = 0; i < tokens.length; i++) {
                if (tokens[i] == tokenId) {
                    tokens[i] = tokens[tokens.length - 1];
                    tokens.pop();
                    break;
                }
            }
        }
        
        address updated = super._update(to, tokenId, auth);
        
        if (to != address(0) && to != from) {
            ownerTokens[to].push(tokenId);
        }
        
        return updated;
    }

    function tokenURI(uint256 tokenId) 
        public 
        view 
        override(ERC721, ERC721URIStorage) 
        returns (string memory) 
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) 
        public 
        view 
        override(ERC721, ERC721URIStorage) 
        returns (bool) 
    {
        return super.supportsInterface(interfaceId);
    }
}
