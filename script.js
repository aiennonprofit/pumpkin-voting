// Data storage keys (for UI state only)
const VOTED_KEY = 'hasVoted';

// State
let pumpkins = [];
let votes = {};
let selectedPumpkinId = null;

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    setupEventListeners();
    setupAuthListeners();
    renderGallery();

    // Setup auth state observer
    onAuthStateChanged(handleAuthStateChange);
});

// Load data from Firestore
async function loadData() {
    // Fetch approved pumpkins from Firestore
    const pumpkinsResult = await getApprovedPumpkins();

    if (pumpkinsResult.success) {
        pumpkins = pumpkinsResult.pumpkins;

        // Build votes object from pumpkin vote counts
        votes = {};
        pumpkins.forEach(pumpkin => {
            votes[pumpkin.id] = pumpkin.voteCount || 0;
        });
    } else {
        console.error('Error loading pumpkins:', pumpkinsResult.error);
        pumpkins = [];
        votes = {};
    }

    // Fetch current user's vote if logged in
    const voteResult = await getUserVote();
    if (voteResult.success && voteResult.votedFor) {
        // Store the pumpkin ID the user voted for
        localStorage.setItem('votedFor', voteResult.votedFor);
        localStorage.setItem(VOTED_KEY, 'true');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Navigation
    document.getElementById('viewGalleryBtn').addEventListener('click', () => showSection('gallery'));
    document.getElementById('viewResultsBtn').addEventListener('click', () => showSection('results'));
    document.getElementById('viewSubmitBtn').addEventListener('click', () => showSection('submit'));

    // Form submission
    document.getElementById('pumpkinForm').addEventListener('submit', handleSubmit);

    // Image preview
    document.getElementById('pumpkinImage').addEventListener('change', handleImagePreview);

    // Modal
    document.getElementById('confirmVoteBtn').addEventListener('click', confirmVote);
    document.getElementById('cancelVoteBtn').addEventListener('click', closeModal);
}

// Setup authentication event listeners
function setupAuthListeners() {
    // Login button in header
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', openAuthModal);
    }

    // Auth modal close button
    document.getElementById('closeAuthModal').addEventListener('click', closeAuthModal);

    // Tab switching
    document.getElementById('loginTabBtn').addEventListener('click', () => switchAuthTab('login'));
    document.getElementById('registerTabBtn').addEventListener('click', () => switchAuthTab('register'));

    // Form submissions
    document.getElementById('registerFormElement').addEventListener('submit', handleRegister);
    document.getElementById('loginFormElement').addEventListener('submit', handleLogin);

    // Close modal on background click
    document.getElementById('authModal').addEventListener('click', (e) => {
        if (e.target.id === 'authModal') {
            closeAuthModal();
        }
    });
}

// Open auth modal
function openAuthModal() {
    document.getElementById('authModal').classList.remove('hidden');
    switchAuthTab('login'); // Default to login tab
}

// Close auth modal
function closeAuthModal() {
    document.getElementById('authModal').classList.add('hidden');
    // Clear forms
    document.getElementById('registerFormElement').reset();
    document.getElementById('loginFormElement').reset();
    // Clear error messages
    document.getElementById('registerError').classList.add('hidden');
    document.getElementById('loginError').classList.add('hidden');
}

// Switch between login and register tabs
function switchAuthTab(tab) {
    const loginTab = document.getElementById('loginTabBtn');
    const registerTab = document.getElementById('registerTabBtn');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (tab === 'login') {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
    } else {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
    }

    // Clear error messages when switching tabs
    document.getElementById('registerError').classList.add('hidden');
    document.getElementById('loginError').classList.add('hidden');
}

// Handle registration form submission
async function handleRegister(e) {
    e.preventDefault();

    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerPasswordConfirm').value;
    const errorDiv = document.getElementById('registerError');

    // Clear previous errors
    errorDiv.classList.add('hidden');

    // Validate inputs
    if (!name || !email || !password || !confirmPassword) {
        errorDiv.textContent = 'All fields are required';
        errorDiv.classList.remove('hidden');
        return;
    }

    if (password.length < 8) {
        errorDiv.textContent = 'Password must be at least 8 characters long';
        errorDiv.classList.remove('hidden');
        return;
    }

    if (password !== confirmPassword) {
        errorDiv.textContent = 'Passwords do not match';
        errorDiv.classList.remove('hidden');
        return;
    }

    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Creating Account...';
    submitBtn.disabled = true;

    // Call registration function from auth.js
    const result = await registerUser(email, password, name);

    // Reset button
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;

    if (result.success) {
        // Close modal and show success message
        closeAuthModal();
        showNotification('Account created successfully! Welcome!', 'success');
    } else {
        // Show error
        errorDiv.textContent = result.error;
        errorDiv.classList.remove('hidden');
    }
}

// Handle auth state changes
function handleAuthStateChange(user, userData) {
    const authStatus = document.getElementById('authStatus');

    if (user && userData) {
        // User is logged in
        const isAdmin = userData.isAdmin === true;

        authStatus.innerHTML = `
            <div class="user-info">
                <span class="user-name">${userData.displayName}</span>
                ${isAdmin ? '<span class="admin-badge">Admin</span>' : ''}
            </div>
            <button id="logoutBtn" class="btn btn-secondary">Logout</button>
        `;

        // Add logout listener
        document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    } else {
        // User is logged out
        authStatus.innerHTML = '<button id="loginBtn" class="btn btn-secondary">Login</button>';

        // Re-add login listener
        document.getElementById('loginBtn').addEventListener('click', openAuthModal);
    }
}

// Handle login form submission
async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');

    // Clear previous errors
    errorDiv.classList.add('hidden');

    // Validate inputs
    if (!email || !password) {
        errorDiv.textContent = 'Email and password are required';
        errorDiv.classList.remove('hidden');
        return;
    }

    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Logging in...';
    submitBtn.disabled = true;

    // Call login function from auth.js
    const result = await loginUser(email, password);

    // Reset button
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;

    if (result.success) {
        // Close modal and show success message
        closeAuthModal();
        showNotification('Logged in successfully! Welcome back!', 'success');
    } else {
        // Show error
        errorDiv.textContent = result.error;
        errorDiv.classList.remove('hidden');
    }
}

// Handle logout
async function handleLogout() {
    // Confirm logout
    if (!confirm('Are you sure you want to log out?')) {
        return;
    }

    // Call logout function from auth.js
    const result = await logoutUser();

    if (result.success) {
        showNotification('Logged out successfully. See you next time!', 'success');
    } else {
        showNotification('Error logging out. Please try again.', 'error');
    }
}

// Show notification message
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = type === 'success' ? 'success-message' : 'error-message';
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.zIndex = '2000';

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Show section
function showSection(section) {
    // Hide all sections
    document.getElementById('gallerySection').classList.add('hidden');
    document.getElementById('resultsSection').classList.add('hidden');
    document.getElementById('submitSection').classList.add('hidden');

    // Remove active class from all nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

    // Show selected section
    if (section === 'gallery') {
        document.getElementById('gallerySection').classList.remove('hidden');
        document.getElementById('viewGalleryBtn').classList.add('active');
        renderGallery();
    } else if (section === 'results') {
        document.getElementById('resultsSection').classList.remove('hidden');
        document.getElementById('viewResultsBtn').classList.add('active');
        renderResults();
    } else if (section === 'submit') {
        // Check if user is authenticated before allowing access to submit section
        const currentUser = getCurrentUser();
        if (!currentUser) {
            showNotification('Please log in to submit a pumpkin entry', 'error');
            openAuthModal();
            return;
        }
        document.getElementById('submitSection').classList.remove('hidden');
        document.getElementById('viewSubmitBtn').classList.add('active');
    }
}

// Handle image preview
function handleImagePreview(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('previewImg').src = e.target.result;
            document.getElementById('imagePreview').classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
}

// Handle form submission
async function handleSubmit(e) {
    e.preventDefault();

    // Check if user is authenticated
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showNotification('Please log in to submit a pumpkin entry', 'error');
        openAuthModal();
        return;
    }

    const title = document.getElementById('pumpkinTitle').value;
    const description = document.getElementById('pumpkinDescription').value;
    const carverName = document.getElementById('carverName').value;
    const imageFile = document.getElementById('pumpkinImage').files[0];

    if (!imageFile) {
        showNotification('Please select an image', 'error');
        return;
    }

    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;

    const reader = new FileReader();
    reader.onload = async (e) => {
        const pumpkinData = {
            title,
            description,
            carverName,
            image: e.target.result
        };

        // Save to Firestore
        const result = await createPumpkin(pumpkinData);

        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;

        if (result.success) {
            // Show success message
            showSuccessMessage();

            // Reset form
            document.getElementById('pumpkinForm').reset();
            document.getElementById('imagePreview').classList.add('hidden');

            // Reload data to refresh gallery
            await loadData();
            renderGallery();

            // Switch to gallery after a delay
            setTimeout(() => {
                showSection('gallery');
            }, 2000);
        } else {
            showNotification('Error submitting pumpkin: ' + result.error, 'error');
        }
    };
    reader.readAsDataURL(imageFile);
}

// Show success message
function showSuccessMessage() {
    const message = document.createElement('div');
    message.className = 'success-message';
    message.textContent = 'Pumpkin submitted successfully!';

    const form = document.getElementById('pumpkinForm');
    form.parentNode.insertBefore(message, form);

    setTimeout(() => {
        message.remove();
    }, 3000);
}

// Render gallery
function renderGallery() {
    const gallery = document.getElementById('pumpkinGallery');
    const noEntries = document.getElementById('noEntries');

    if (pumpkins.length === 0) {
        gallery.innerHTML = '';
        noEntries.classList.remove('hidden');
        return;
    }

    noEntries.classList.add('hidden');

    gallery.innerHTML = pumpkins.map(pumpkin => `
        <div class="pumpkin-card" onclick="openVoteModal('${pumpkin.id}')">
            <img src="${pumpkin.image}" alt="${pumpkin.title}">
            <div class="pumpkin-info">
                <h3>${pumpkin.title}</h3>
                <p class="carver">by ${pumpkin.carverName}</p>
                <p class="description">${pumpkin.description}</p>
                <div class="vote-count">${votes[pumpkin.id] || 0} votes</div>
            </div>
        </div>
    `).join('');
}

// Open vote modal
function openVoteModal(pumpkinId) {
    // Check if user is authenticated
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showNotification('Please log in to vote for pumpkins', 'error');
        openAuthModal();
        return;
    }

    selectedPumpkinId = pumpkinId;
    const pumpkin = pumpkins.find(p => p.id === pumpkinId);

    document.getElementById('modalPumpkinTitle').textContent = pumpkin.title;
    document.getElementById('voteModal').classList.remove('hidden');
}

// Close modal
function closeModal() {
    selectedPumpkinId = null;
    document.getElementById('voteModal').classList.add('hidden');
}

// Confirm vote
async function confirmVote() {
    if (!selectedPumpkinId) return;

    // Cast vote using Firestore transaction
    const result = await castVote(selectedPumpkinId);

    if (result.success) {
        // Mark as voted in localStorage for UI purposes
        localStorage.setItem(VOTED_KEY, 'true');
        localStorage.setItem('votedFor', selectedPumpkinId);

        // Reload data to get updated vote counts
        await loadData();

        closeModal();
        renderGallery();

        // Show feedback
        if (result.previousVote) {
            showVoteFeedback('Vote changed successfully! Thank you for voting!');
        } else {
            showVoteFeedback('Vote cast successfully! Thank you for voting!');
        }
    } else {
        closeModal();
        showNotification('Error casting vote: ' + result.error, 'error');
    }
}

// Show vote feedback
function showVoteFeedback(text = 'Vote cast successfully! Thank you for voting!') {
    const message = document.createElement('div');
    message.className = 'success-message';
    message.textContent = text;
    message.style.position = 'fixed';
    message.style.top = '20px';
    message.style.left = '50%';
    message.style.transform = 'translateX(-50%)';
    message.style.zIndex = '2000';

    document.body.appendChild(message);

    setTimeout(() => {
        message.remove();
    }, 3000);
}

// Render results
function renderResults() {
    const leaderboard = document.getElementById('leaderboard');
    const noResults = document.getElementById('noResults');

    // Sort pumpkins by votes
    const sortedPumpkins = [...pumpkins].sort((a, b) => {
        return (votes[b.id] || 0) - (votes[a.id] || 0);
    });

    if (sortedPumpkins.length === 0 || Object.values(votes).every(v => v === 0)) {
        leaderboard.innerHTML = '';
        noResults.classList.remove('hidden');
        return;
    }

    noResults.classList.add('hidden');

    leaderboard.innerHTML = sortedPumpkins.map((pumpkin, index) => {
        const voteCount = votes[pumpkin.id] || 0;
        const isWinner = index === 0 && voteCount > 0;

        return `
            <div class="leaderboard-item ${isWinner ? 'winner' : ''}">
                <div class="rank">#${index + 1}</div>
                <img src="${pumpkin.image}" alt="${pumpkin.title}" class="leaderboard-img">
                <div class="leaderboard-info">
                    <h3>${pumpkin.title}</h3>
                    <p class="carver">by ${pumpkin.carverName}</p>
                </div>
                <div class="leaderboard-votes">
                    ${voteCount} ${voteCount === 1 ? 'vote' : 'votes'}
                </div>
            </div>
        `;
    }).join('');
}
