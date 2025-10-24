// Data storage keys (for UI state only)
const VOTED_KEY = 'hasVoted';

// State
let pumpkins = [];
let votes = {};
let selectedPumpkinId = null;
let galleryUnsubscribe = null;
let resultsUnsubscribe = null;

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

    // Hero buttons
    document.getElementById('heroCastVoteBtn').addEventListener('click', () => {
        showSection('gallery');
        // Scroll to gallery
        document.getElementById('gallerySection').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    document.getElementById('heroBrowseBtn').addEventListener('click', () => {
        showSection('gallery');
        // Scroll to gallery
        document.getElementById('gallerySection').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // Admin Dashboard button
    const adminBtn = document.getElementById('adminDashboardBtn');
    if (adminBtn) {
        adminBtn.addEventListener('click', () => {
            window.location.href = 'admin.html';
        });
    }

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
    const adminBtn = document.getElementById('adminDashboardBtn');

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

        // Show/hide admin dashboard button
        if (adminBtn) {
            if (isAdmin) {
                adminBtn.classList.remove('hidden');
            } else {
                adminBtn.classList.add('hidden');
            }
        }

        // Add logout listener
        document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    } else {
        // User is logged out
        authStatus.innerHTML = '<button id="loginBtn" class="btn btn-secondary">Login</button>';

        // Hide admin button
        if (adminBtn) {
            adminBtn.classList.add('hidden');
        }

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
        // Scroll to section
        setTimeout(() => {
            document.getElementById('gallerySection').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    } else if (section === 'results') {
        document.getElementById('resultsSection').classList.remove('hidden');
        document.getElementById('viewResultsBtn').classList.add('active');
        renderResults();
        // Scroll to section
        setTimeout(() => {
            document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
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
        // Scroll to section
        setTimeout(() => {
            document.getElementById('submitSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
}

// Compress image to fit within Firestore's 1MB document limit
// Creates a square crop for uniform display
async function compressImage(file, maxSizeKB = 800) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Create square image (1000x1000px)
                const squareSize = 1000;
                canvas.width = squareSize;
                canvas.height = squareSize;

                // Calculate crop dimensions to center the image
                const sourceSize = Math.min(img.width, img.height);
                const sourceX = (img.width - sourceSize) / 2;
                const sourceY = (img.height - sourceSize) / 2;

                // Draw cropped square image
                ctx.drawImage(
                    img,
                    sourceX, sourceY, sourceSize, sourceSize,  // source crop
                    0, 0, squareSize, squareSize               // destination
                );

                // Start with quality 0.8 and reduce if needed
                let quality = 0.8;
                let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

                // Keep reducing quality until size is acceptable
                while (compressedDataUrl.length > maxSizeKB * 1024 * 1.37 && quality > 0.1) {
                    quality -= 0.1;
                    compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                }

                resolve(compressedDataUrl);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Handle image preview
async function handleImagePreview(e) {
    const file = e.target.files[0];
    if (file) {
        try {
            const compressedImage = await compressImage(file);
            document.getElementById('previewImg').src = compressedImage;
            document.getElementById('imagePreview').classList.remove('hidden');
        } catch (error) {
            console.error('Error processing image:', error);
            showNotification('Error processing image. Please try a different image.', 'error');
        }
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

    try {
        // Compress image before uploading
        const compressedImage = await compressImage(imageFile);

        const pumpkinData = {
            title,
            description,
            carverName,
            image: compressedImage
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

            // Real-time listener will automatically update the gallery if admin approves
            // Note: Submitted pumpkins are pending and won't appear until approved

            // Switch to gallery after a delay
            setTimeout(() => {
                showSection('gallery');
            }, 2000);
        } else {
            showNotification('Error submitting pumpkin: ' + result.error, 'error');
        }
    } catch (error) {
        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;

        console.error('Error processing image:', error);
        showNotification('Error processing image: ' + error.message, 'error');
    }
}

// Show success message
function showSuccessMessage() {
    const message = document.createElement('div');
    message.className = 'success-message';
    message.textContent = 'Pumpkin submitted successfully! It will appear in the gallery after admin approval.';

    const form = document.getElementById('pumpkinForm');
    form.parentNode.insertBefore(message, form);

    setTimeout(() => {
        message.remove();
    }, 5000);
}

// Render gallery with real-time updates
function renderGallery() {
    const gallery = document.getElementById('pumpkinGallery');
    const noEntries = document.getElementById('noEntries');

    // Unsubscribe from previous listener if exists
    if (galleryUnsubscribe) {
        galleryUnsubscribe();
    }

    // Set up real-time listener for approved pumpkins
    galleryUnsubscribe = listenToApprovedPumpkins((updatedPumpkins) => {
        pumpkins = updatedPumpkins;

        // Update votes object
        votes = {};
        pumpkins.forEach(pumpkin => {
            votes[pumpkin.id] = pumpkin.voteCount || 0;
        });

        // Get current user's vote
        const votedFor = localStorage.getItem('votedFor');

        if (pumpkins.length === 0) {
            gallery.innerHTML = '';
            noEntries.classList.remove('hidden');
            return;
        }

        noEntries.classList.add('hidden');

        gallery.innerHTML = pumpkins.map(pumpkin => {
            const isVotedFor = votedFor === pumpkin.id;
            return `
                <div class="pumpkin-card ${isVotedFor ? 'voted-for' : ''}" onclick="openVoteModal('${pumpkin.id}')">
                    ${isVotedFor ? '<div class="voted-badge">Your Vote</div>' : ''}
                    <img src="${pumpkin.image}" alt="${pumpkin.title}">
                    <div class="pumpkin-info">
                        <h3>${pumpkin.title}</h3>
                        <p class="carver">by ${pumpkin.carverName}</p>
                        <p class="description">${pumpkin.description}</p>
                        <div class="vote-count">${pumpkin.voteCount || 0} votes</div>
                    </div>
                </div>
            `;
        }).join('');
    });
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

    // Show loading state
    const confirmBtn = document.getElementById('confirmVoteBtn');
    const originalText = confirmBtn.textContent;
    confirmBtn.textContent = 'Casting Vote...';
    confirmBtn.disabled = true;

    // Cast vote using Firestore transaction
    const result = await castVote(selectedPumpkinId);

    // Reset button
    confirmBtn.textContent = originalText;
    confirmBtn.disabled = false;

    if (result.success) {
        // Mark as voted in localStorage for UI purposes
        localStorage.setItem(VOTED_KEY, 'true');
        localStorage.setItem('votedFor', selectedPumpkinId);

        closeModal();

        // Show feedback
        if (result.previousVote) {
            showVoteFeedback('Vote changed successfully! Thank you for voting!');
        } else {
            showVoteFeedback('Vote cast successfully! Thank you for voting!');
        }

        // Real-time listener will automatically update the UI
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

// Render results with real-time updates
function renderResults() {
    const leaderboard = document.getElementById('leaderboard');
    const noResults = document.getElementById('noResults');

    // Unsubscribe from previous listener if exists
    if (resultsUnsubscribe) {
        resultsUnsubscribe();
    }

    // Set up real-time listener for approved pumpkins
    resultsUnsubscribe = listenToApprovedPumpkins((updatedPumpkins) => {
        // Sort pumpkins by votes
        const sortedPumpkins = [...updatedPumpkins].sort((a, b) => {
            return (b.voteCount || 0) - (a.voteCount || 0);
        });

        if (sortedPumpkins.length === 0 || sortedPumpkins.every(p => (p.voteCount || 0) === 0)) {
            leaderboard.innerHTML = '';
            noResults.classList.remove('hidden');
            return;
        }

        noResults.classList.add('hidden');

        leaderboard.innerHTML = sortedPumpkins.map((pumpkin, index) => {
            const voteCount = pumpkin.voteCount || 0;
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
    });
}
