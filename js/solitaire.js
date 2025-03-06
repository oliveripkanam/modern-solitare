// Card suits and values
const SUITS = ['♥', '♦', '♠', '♣'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const RED_SUITS = ['♥', '♦'];

// Game state
let deck = [];
let stockPile = [];
let wastePile = [];
let foundationPiles = [[], [], [], []];
let tableauPiles = [[], [], [], [], [], [], []];
let selectedCard = null;
let selectedPile = null;
let moveCount = 0;
let timerInterval = null;
let startTime = null;

// DOM elements
let stockElement;
let wasteElement;
let foundationElements;
let tableauElements;
let moveCountElement;
let timerElement;
let newGameButton;
let menuButton;
let winMessage;
let finalMovesElement;
let finalTimeElement;
let playAgainButton;
let backToMenuButton;
let mainMenu;
let gameScreen;
let startGameButton;
let quitGameButton;

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Initialize DOM elements
    mainMenu = document.getElementById('main-menu');
    gameScreen = document.getElementById('game-screen');
    startGameButton = document.getElementById('start-game-btn');
    quitGameButton = document.getElementById('quit-game-btn');
    menuButton = document.getElementById('menu-btn');
    backToMenuButton = document.getElementById('back-to-menu-btn');
    
    stockElement = document.getElementById('stock');
    wasteElement = document.getElementById('waste');
    foundationElements = Array.from({ length: 4 }, (_, i) => document.getElementById(`foundation-${i}`));
    tableauElements = Array.from({ length: 7 }, (_, i) => document.getElementById(`tableau-${i}`));
    moveCountElement = document.getElementById('move-count');
    timerElement = document.getElementById('timer');
    newGameButton = document.getElementById('new-game-btn');
    winMessage = document.getElementById('win-message');
    finalMovesElement = document.getElementById('final-moves');
    finalTimeElement = document.getElementById('final-time');
    playAgainButton = document.getElementById('play-again-btn');
    
    // Explicitly hide the win message
    winMessage.classList.add('hidden');
    
    // Set up event listeners
    setupEventListeners();
    
    // Show the main menu by default
    showMainMenu();
});

// Show the main menu
function showMainMenu() {
    gameScreen.classList.add('hidden');
    mainMenu.classList.remove('hidden');
    winMessage.classList.add('hidden');
    
    // Stop the timer if it's running
    clearInterval(timerInterval);
}

// Start a new game
function startNewGame() {
    mainMenu.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    winMessage.classList.add('hidden');
    
    initGame();
}

// Set up event listeners
function setupEventListeners() {
    // Main menu buttons
    startGameButton.addEventListener('click', startNewGame);
    quitGameButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to quit the game?')) {
            // Redirect to a blank page or another website
            // This is more reliable than window.close() which often doesn't work in modern browsers
            window.location.href = 'about:blank';
        }
    });
    
    // Game screen buttons
    newGameButton.addEventListener('click', initGame);
    menuButton.addEventListener('click', showMainMenu);
    
    // Win message buttons
    playAgainButton.addEventListener('click', initGame);
    backToMenuButton.addEventListener('click', showMainMenu);

    // Stock pile click handler
    stockElement.addEventListener('click', () => {
        if (stockPile.length > 0) {
            drawCard();
        } else if (wastePile.length > 0) {
            // Reset stock from waste
            stockPile = wastePile.reverse().map(card => {
                card.faceUp = false;
                return card;
            });
            wastePile = [];
            renderGame();
            incrementMoveCount();
        }
    });

    // Foundation pile click handlers
    foundationElements.forEach((element, index) => {
        element.addEventListener('click', () => {
            if (selectedCard) {
                moveCardToPile(selectedCard, selectedPile, { type: 'foundation', index });
                document.querySelectorAll('.card.selected').forEach(el => el.classList.remove('selected'));
                selectedCard = null;
                selectedPile = null;
            }
        });

        // Add drag-and-drop event listeners to foundation piles
        element.addEventListener('dragover', (e) => {
            e.preventDefault(); // Allow drop
            element.classList.add('dragover');
        });
        
        element.addEventListener('dragleave', () => {
            element.classList.remove('dragover');
        });
        
        element.addEventListener('drop', (e) => {
            e.preventDefault();
            element.classList.remove('dragover');
            if (selectedCard && selectedPile) {
                moveCardToPile(selectedCard, selectedPile, { type: 'foundation', index });
                selectedCard = null;
                selectedPile = null;
            }
        });
    });

    // Tableau pile click handlers
    tableauElements.forEach((element, index) => {
        element.addEventListener('click', (e) => {
            // Only handle clicks on the pile itself, not on cards
            if (e.target === element && selectedCard) {
                moveCardToPile(selectedCard, selectedPile, { type: 'tableau', index });
                document.querySelectorAll('.card.selected').forEach(el => el.classList.remove('selected'));
                selectedCard = null;
                selectedPile = null;
            }
        });

        // Add drag-and-drop event listeners to tableau piles
        element.addEventListener('dragover', (e) => {
            e.preventDefault(); // Allow drop
            element.classList.add('dragover');
        });
        
        element.addEventListener('dragleave', () => {
            element.classList.remove('dragover');
        });
        
        element.addEventListener('drop', (e) => {
            e.preventDefault();
            element.classList.remove('dragover');
            if (selectedCard && selectedPile) {
                moveCardToPile(selectedCard, selectedPile, { type: 'tableau', index });
                selectedCard = null;
                selectedPile = null;
            }
        });
    });
}

// Initialize the game
function initGame() {
    resetGame();
    createDeck();
    shuffleDeck();
    dealCards();
    startTimer();
    renderGame();
}

// Reset the game state
function resetGame() {
    deck = [];
    stockPile = [];
    wastePile = [];
    foundationPiles = [[], [], [], []];
    tableauPiles = [[], [], [], [], [], [], []];
    selectedCard = null;
    selectedPile = null;
    moveCount = 0;
    moveCountElement.textContent = '0';
    clearInterval(timerInterval);
    timerElement.textContent = '00:00';
    winMessage.classList.add('hidden');
}

// Create a deck of cards
function createDeck() {
    for (const suit of SUITS) {
        for (const value of VALUES) {
            deck.push({
                suit,
                value,
                color: RED_SUITS.includes(suit) ? 'red' : 'black',
                faceUp: false
            });
        }
    }
}

// Shuffle the deck
function shuffleDeck() {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

// Deal cards to tableau piles
function dealCards() {
    // Deal cards to tableau piles
    for (let i = 0; i < 7; i++) {
        for (let j = 0; j <= i; j++) {
            const card = deck.pop();
            // Only the top card is face up
            if (j === i) {
                card.faceUp = true;
            }
            tableauPiles[i].push(card);
        }
    }
    
    // Remaining cards go to stock pile
    stockPile = [...deck];
    deck = [];
}

// Start the timer
function startTimer() {
    startTime = Date.now();
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(elapsedTime / 60).toString().padStart(2, '0');
        const seconds = (elapsedTime % 60).toString().padStart(2, '0');
        timerElement.textContent = `${minutes}:${seconds}`;
    }, 1000);
}

// Render the game state
function renderGame() {
    // Add a transition class to the body to enable smooth transitions
    document.body.classList.add('updating-cards');
    
    // Render stock pile
    stockElement.innerHTML = '';
    if (stockPile.length > 0) {
        const cardElement = createCardElement({ faceUp: false });
        stockElement.appendChild(cardElement);
    }

    // Render waste pile
    wasteElement.innerHTML = '';
    if (wastePile.length > 0) {
        const topCard = wastePile[wastePile.length - 1];
        const cardElement = createCardElement(topCard);
        wasteElement.appendChild(cardElement);
    }

    // Render foundation piles
    foundationElements.forEach((element, index) => {
        element.innerHTML = '';
        const pile = foundationPiles[index];
        if (pile.length > 0) {
            const topCard = pile[pile.length - 1];
            const cardElement = createCardElement(topCard);
            element.appendChild(cardElement);
        }
    });

    // Render tableau piles
    tableauElements.forEach((element, index) => {
        element.innerHTML = '';
        const pile = tableauPiles[index];
        
        pile.forEach((card, cardIndex) => {
            const cardElement = createCardElement(card);
            cardElement.style.top = `${cardIndex * 30}px`;
            
            // Add data attributes to help with drag and drop
            cardElement.dataset.pileType = 'tableau';
            cardElement.dataset.pileIndex = index;
            cardElement.dataset.cardIndex = cardIndex;
            
            element.appendChild(cardElement);
        });
    });

    // Remove the transition class after a short delay to allow animations to complete
    setTimeout(() => {
        document.body.classList.remove('updating-cards');
    }, 50);

    // Check for win condition
    checkWinCondition();
}

// Create a card element
function createCardElement(card) {
    const cardElement = document.createElement('div');
    cardElement.classList.add('card');
    
    if (!card.faceUp) {
        cardElement.classList.add('facedown');
        cardElement.addEventListener('click', () => handleCardClick(card, cardElement));
        return cardElement;
    }
    
    cardElement.classList.add(card.color);
    cardElement.textContent = `${card.value}${card.suit}`;
    cardElement.addEventListener('click', () => handleCardClick(card, cardElement));
    
    // Add drag-and-drop functionality
    cardElement.setAttribute('draggable', 'true');
    cardElement.addEventListener('dragstart', (e) => handleDragStart(e, card));
    cardElement.addEventListener('dragend', handleDragEnd);
    
    return cardElement;
}

// Handle card click
function handleCardClick(card, cardElement) {
    // Handle stock pile click
    if (!card.faceUp && stockPile.includes(card)) {
        drawCard();
        return;
    }
    
    // Can't select facedown cards
    if (!card.faceUp) {
        return;
    }
    
    // If no card is selected, select this card
    if (!selectedCard) {
        // Find which pile this card belongs to
        let pileType, pileIndex;
        
        // Check waste pile
        if (wastePile.length > 0 && wastePile[wastePile.length - 1] === card) {
            pileType = 'waste';
            pileIndex = 0;
        } 
        // Check foundation piles
        else {
            for (let i = 0; i < foundationPiles.length; i++) {
                if (foundationPiles[i].length > 0 && foundationPiles[i][foundationPiles[i].length - 1] === card) {
                    pileType = 'foundation';
                    pileIndex = i;
                    break;
                }
            }
        }
        
        // Check tableau piles if not found yet
        if (!pileType) {
            for (let i = 0; i < tableauPiles.length; i++) {
                const cardIndex = tableauPiles[i].indexOf(card);
                if (cardIndex !== -1) {
                    // Only select if it's the top card or cards below it are face up
                    if (cardIndex === tableauPiles[i].length - 1 || 
                        tableauPiles[i].slice(cardIndex).every(c => c.faceUp)) {
                        pileType = 'tableau';
                        pileIndex = i;
                        break;
                    }
                }
            }
        }
        
        if (pileType) {
            selectedCard = card;
            selectedPile = { type: pileType, index: pileIndex };
            cardElement.classList.add('selected');
        }
    } 
    // If a card is already selected, try to move it
    else {
        // Find target pile
        let targetPileType, targetPileIndex;
        
        // Check foundation piles
        for (let i = 0; i < foundationPiles.length; i++) {
            if (foundationPiles[i].length > 0 && foundationPiles[i][foundationPiles[i].length - 1] === card) {
                targetPileType = 'foundation';
                targetPileIndex = i;
                break;
            }
        }
        
        // Check tableau piles if not found yet
        if (!targetPileType) {
            for (let i = 0; i < tableauPiles.length; i++) {
                const cardIndex = tableauPiles[i].indexOf(card);
                if (cardIndex !== -1) {
                    targetPileType = 'tableau';
                    targetPileIndex = i;
                    break;
                }
            }
        }
        
        // Try to move the selected card to the target pile
        if (targetPileType) {
            moveCardToPile(selectedCard, selectedPile, { type: targetPileType, index: targetPileIndex });
        }
        
        // Deselect the card
        document.querySelectorAll('.card.selected').forEach(el => el.classList.remove('selected'));
        selectedCard = null;
        selectedPile = null;
    }
}

// Draw a card from the stock pile
function drawCard() {
    if (stockPile.length === 0) {
        // If stock pile is empty, flip waste pile back to stock
        stockPile = wastePile.reverse().map(card => {
            card.faceUp = false;
            return card;
        });
        wastePile = [];
        renderGame();
        incrementMoveCount();
    } else {
        // Draw top card from stock to waste
        const card = stockPile.pop();
        card.faceUp = true;
        
        // Add the card to waste pile data structure
        wastePile.push(card);
        incrementMoveCount();
        
        // Use a more targeted update approach instead of full renderGame
        // Update stock pile
        stockElement.innerHTML = '';
        if (stockPile.length > 0) {
            const stockCardElement = createCardElement({ faceUp: false });
            stockElement.appendChild(stockCardElement);
        }
        
        // Update waste pile with animation
        wasteElement.innerHTML = '';
        const wasteCardElement = createCardElement(card);
        wasteCardElement.classList.add('card-drawing');
        wasteElement.appendChild(wasteCardElement);
        
        // Remove animation class after animation completes
        setTimeout(() => {
            wasteCardElement.classList.remove('card-drawing');
        }, 300);
    }
}

// Move a card from one pile to another
function moveCardToPile(card, sourcePile, targetPile) {
    // Get source cards (might be multiple in tableau)
    let sourceCards = [];
    let sourcePileArray;
    
    if (sourcePile.type === 'waste') {
        sourcePileArray = wastePile;
        if (wastePile.length > 0 && wastePile[wastePile.length - 1] === card) {
            sourceCards = [wastePile.pop()];
        }
    } else if (sourcePile.type === 'foundation') {
        sourcePileArray = foundationPiles[sourcePile.index];
        if (sourcePileArray.length > 0 && sourcePileArray[sourcePileArray.length - 1] === card) {
            sourceCards = [sourcePileArray.pop()];
        }
    } else if (sourcePile.type === 'tableau') {
        sourcePileArray = tableauPiles[sourcePile.index];
        const cardIndex = sourcePileArray.indexOf(card);
        if (cardIndex !== -1) {
            sourceCards = sourcePileArray.splice(cardIndex);
        }
    }
    
    if (sourceCards.length === 0) return false;
    
    // Try to place on target pile
    let targetPileArray;
    let validMove = false;
    
    if (targetPile.type === 'foundation') {
        targetPileArray = foundationPiles[targetPile.index];
        // Only single cards can go to foundation
        if (sourceCards.length === 1) {
            const sourceCard = sourceCards[0];
            // If foundation is empty, only Ace can be placed
            if (targetPileArray.length === 0) {
                validMove = sourceCard.value === 'A';
            } else {
                // Otherwise, must be same suit and next value
                const targetCard = targetPileArray[targetPileArray.length - 1];
                const sourceValueIndex = VALUES.indexOf(sourceCard.value);
                const targetValueIndex = VALUES.indexOf(targetCard.value);
                validMove = sourceCard.suit === targetCard.suit && sourceValueIndex === targetValueIndex + 1;
            }
        }
    } else if (targetPile.type === 'tableau') {
        targetPileArray = tableauPiles[targetPile.index];
        // If tableau is empty, only King can be placed
        if (targetPileArray.length === 0) {
            validMove = sourceCards[0].value === 'K';
        } else {
            // Otherwise, must be opposite color and one value lower
            const targetCard = targetPileArray[targetPileArray.length - 1];
            const sourceCard = sourceCards[0];
            const sourceValueIndex = VALUES.indexOf(sourceCard.value);
            const targetValueIndex = VALUES.indexOf(targetCard.value);
            validMove = sourceCard.color !== targetCard.color && sourceValueIndex === targetValueIndex - 1;
        }
    }
    
    if (validMove) {
        // Move cards to target pile
        targetPileArray.push(...sourceCards);
        
        // If we moved from tableau and exposed a card, flip it
        if (sourcePile.type === 'tableau' && sourcePileArray.length > 0) {
            const lastCard = sourcePileArray[sourcePileArray.length - 1];
            if (!lastCard.faceUp) {
                lastCard.faceUp = true;
            }
        }
        
        incrementMoveCount();
        
        // Use a more targeted update approach
        // Only update the source and target piles
        document.body.classList.add('updating-cards');
        
        // Update source pile
        if (sourcePile.type === 'waste') {
            wasteElement.innerHTML = '';
            if (wastePile.length > 0) {
                const topCard = wastePile[wastePile.length - 1];
                const cardElement = createCardElement(topCard);
                wasteElement.appendChild(cardElement);
            }
        } else if (sourcePile.type === 'foundation') {
            const element = foundationElements[sourcePile.index];
            element.innerHTML = '';
            if (foundationPiles[sourcePile.index].length > 0) {
                const topCard = foundationPiles[sourcePile.index][foundationPiles[sourcePile.index].length - 1];
                const cardElement = createCardElement(topCard);
                element.appendChild(cardElement);
            }
        } else if (sourcePile.type === 'tableau') {
            const element = tableauElements[sourcePile.index];
            element.innerHTML = '';
            const pile = tableauPiles[sourcePile.index];
            pile.forEach((c, i) => {
                const cardElement = createCardElement(c);
                cardElement.style.top = `${i * 30}px`;
                cardElement.dataset.pileType = 'tableau';
                cardElement.dataset.pileIndex = sourcePile.index;
                cardElement.dataset.cardIndex = i;
                element.appendChild(cardElement);
            });
        }
        
        // Update target pile
        if (targetPile.type === 'foundation') {
            const element = foundationElements[targetPile.index];
            element.innerHTML = '';
            if (foundationPiles[targetPile.index].length > 0) {
                const topCard = foundationPiles[targetPile.index][foundationPiles[targetPile.index].length - 1];
                const cardElement = createCardElement(topCard);
                element.appendChild(cardElement);
            }
        } else if (targetPile.type === 'tableau') {
            const element = tableauElements[targetPile.index];
            element.innerHTML = '';
            const pile = tableauPiles[targetPile.index];
            pile.forEach((c, i) => {
                const cardElement = createCardElement(c);
                cardElement.style.top = `${i * 30}px`;
                cardElement.dataset.pileType = 'tableau';
                cardElement.dataset.pileIndex = targetPile.index;
                cardElement.dataset.cardIndex = i;
                element.appendChild(cardElement);
            });
        }
        
        // Remove the transition class after a short delay
        setTimeout(() => {
            document.body.classList.remove('updating-cards');
            
            // Check for win condition
            checkWinCondition();
        }, 50);
        
        return true;
    } else {
        // If move is invalid, put cards back
        if (sourcePile.type === 'waste') {
            wastePile.push(...sourceCards);
        } else if (sourcePile.type === 'foundation') {
            foundationPiles[sourcePile.index].push(...sourceCards);
        } else if (sourcePile.type === 'tableau') {
            tableauPiles[sourcePile.index].push(...sourceCards);
        }
        return false;
    }
}

// Increment move counter
function incrementMoveCount() {
    moveCount++;
    moveCountElement.textContent = moveCount.toString();
}

// Check if the game is won
function checkWinCondition() {
    // First check if any cards have been moved (moveCount > 0)
    // This prevents win detection on initial load
    if (moveCount === 0) {
        return false;
    }
    
    const isWon = foundationPiles.every(pile => pile.length === 13);
    
    if (isWon) {
        clearInterval(timerInterval);
        finalMovesElement.textContent = moveCount.toString();
        finalTimeElement.textContent = timerElement.textContent;
        winMessage.classList.remove('hidden');
        winMessage.style.display = 'flex';
    }
    
    return isWon;
}

// Drag-and-drop handlers
function handleDragStart(e, card) {
    // Store the card being dragged
    selectedCard = card;
    
    // Find which pile this card belongs to
    let pileType, pileIndex, cardIndex;
    
    // Check waste pile
    if (wastePile.length > 0 && wastePile[wastePile.length - 1] === card) {
        pileType = 'waste';
        pileIndex = 0;
    } 
    // Check foundation piles
    else {
        for (let i = 0; i < foundationPiles.length; i++) {
            if (foundationPiles[i].length > 0 && foundationPiles[i][foundationPiles[i].length - 1] === card) {
                pileType = 'foundation';
                pileIndex = i;
                break;
            }
        }
    }
    
    // Check tableau piles if not found yet
    if (!pileType) {
        for (let i = 0; i < tableauPiles.length; i++) {
            cardIndex = tableauPiles[i].indexOf(card);
            if (cardIndex !== -1) {
                // Only select if it's the top card or cards below it are face up
                if (cardIndex === tableauPiles[i].length - 1 || 
                    tableauPiles[i].slice(cardIndex).every(c => c.faceUp)) {
                    pileType = 'tableau';
                    pileIndex = i;
                    break;
                }
            }
        }
    }
    
    if (pileType) {
        selectedPile = { type: pileType, index: pileIndex, cardIndex };
        e.target.classList.add('dragging');
        
        // Set the drag image (optional)
        if (e.dataTransfer) {
            e.dataTransfer.setData('text/plain', ''); // Required for Firefox
            e.dataTransfer.effectAllowed = 'move';
        }
    } else {
        // If we couldn't find a valid pile, cancel the drag
        e.preventDefault();
    }
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
} 