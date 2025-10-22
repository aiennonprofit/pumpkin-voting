// Admin Dashboard Script

// State
let pendingPumpkins = [];
let approvedPumpkins = [];
let confirmCallback = null;

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', () => {
    // Setup event listeners
    setupEventListeners();

    // Wait for auth to be ready, then check access
    waitForAuthReady();
});

// Wait for Firebase Auth to initialize and check admin access
async function waitForAuthReady() {
    // Use a promise to wait for the first auth state change
    const authState = await new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged((user, userData) => {
            unsubscribe(); // Stop listening after first callback
            resolve({ user, userData });
        });
    });

    console.log('Auth ready:', authState);

    // Check admin access
    if (!checkAdminAccessSync(authState.user, authState.userData)) {
        return; // Access denied, already redirected
    }

    // If we passed the check, update UI
    handleAuthStateChange(authState.user, authState.userData);

    // Load initial data
    await loadPendingPumpkins();
    await loadApprovedPumpkins();

    // Render initial view
    renderPendingSection();

    // Now set up the auth observer for future changes
    onAuthStateChanged((user, userData) => {
        handleAuthStateChange(user, userData);
    });
}

// Synchronous admin access check using auth state data
function checkAdminAccessSync(user, userData) {
    console.log('Admin access check:', { user: user ? user.email : null, userData, isAdmin: userData?.isAdmin });

    if (!user || !userData) {
        // Not logged in, redirect silently to main site
        console.log('Redirecting: No user or userData');
        window.location.href = 'index.html';
        return false;
    }

    // Check if user is admin
    if (!userData.isAdmin) {
        // Not admin, redirect silently to main site
        console.log('Redirecting: User is not admin');
        window.location.href = 'index.html';
        return false;
    }

    console.log('Admin access granted');
    return true;
}

// Check admin access and redirect if not admin (legacy async version)
async function checkAdminAccess() {
    const currentUser = getCurrentUser();

    if (!currentUser) {
        // Not logged in, redirect silently to main site
        window.location.href = 'index.html';
        return;
    }

    // Check if user is admin
    const isAdmin = await isCurrentUserAdmin();

    if (!isAdmin) {
        // Not admin, redirect silently to main site
        window.location.href = 'index.html';
        return;
    }
}

// Setup event listeners
function setupEventListeners() {
    // Navigation
    document.getElementById('backToSiteBtn').addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    document.getElementById('viewPendingBtn').addEventListener('click', () => {
        showSection('pending');
    });

    document.getElementById('viewApprovedBtn').addEventListener('click', () => {
        showSection('approved');
    });

    // Reset votes button
    document.getElementById('resetVotesBtn').addEventListener('click', handleResetVotes);

    // Confirmation modal
    document.getElementById('confirmYesBtn').addEventListener('click', () => {
        closeConfirmModal();
        if (confirmCallback) {
            confirmCallback();
            confirmCallback = null;
        }
    });

    document.getElementById('confirmNoBtn').addEventListener('click', closeConfirmModal);
}

// Handle auth state changes
function handleAuthStateChange(user, userData) {
    const authStatus = document.getElementById('authStatus');

    if (user && userData) {
        const isAdmin = userData.isAdmin === true;

        authStatus.innerHTML = `
            <div class="user-info">
                <span class="user-name">${userData.displayName}</span>
                ${isAdmin ? '<span class="admin-badge">Admin</span>' : ''}
            </div>
        `;

        // Re-check admin access
        if (!isAdmin) {
            alert('Your admin privileges have been revoked.');
            window.location.href = 'index.html';
        }
    } else {
        // User logged out, redirect
        window.location.href = 'index.html';
    }
}

// Show section
function showSection(section) {
    // Hide all sections
    document.getElementById('pendingSection').classList.add('hidden');
    document.getElementById('approvedSection').classList.add('hidden');

    // Remove active class from nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

    // Show selected section
    if (section === 'pending') {
        document.getElementById('pendingSection').classList.remove('hidden');
        document.getElementById('viewPendingBtn').classList.add('active');
        renderPendingSection();
    } else if (section === 'approved') {
        document.getElementById('approvedSection').classList.remove('hidden');
        document.getElementById('viewApprovedBtn').classList.add('active');
        renderApprovedSection();
    }
}

// Load pending pumpkins
async function loadPendingPumpkins() {
    const result = await getPumpkinsByStatus('pending');
    if (result.success) {
        pendingPumpkins = result.pumpkins;
    } else {
        console.error('Error loading pending pumpkins:', result.error);
        pendingPumpkins = [];
    }
}

// Load approved pumpkins
async function loadApprovedPumpkins() {
    const result = await getApprovedPumpkins();
    if (result.success) {
        approvedPumpkins = result.pumpkins;
    } else {
        console.error('Error loading approved pumpkins:', result.error);
        approvedPumpkins = [];
    }
}

// Render pending section
function renderPendingSection() {
    const gallery = document.getElementById('pendingGallery');
    const noEntries = document.getElementById('noPending');

    if (pendingPumpkins.length === 0) {
        gallery.innerHTML = '';
        noEntries.classList.remove('hidden');
        return;
    }

    noEntries.classList.add('hidden');

    gallery.innerHTML = pendingPumpkins.map(pumpkin => `
        <div class="admin-pumpkin-card">
            <img src="${pumpkin.image}" alt="${pumpkin.title}">
            <div class="admin-pumpkin-info">
                <span class="status-badge pending">Pending</span>
                <h3>${pumpkin.title}</h3>
                <p class="carver">by ${pumpkin.carverName}</p>
                <p class="description">${pumpkin.description}</p>
                <div class="metadata">
                    <p><strong>Submitted:</strong> ${formatDate(pumpkin.submittedAt)}</p>
                    <p><strong>By:</strong> User ${pumpkin.submittedBy.substring(0, 8)}...</p>
                </div>
                <div class="admin-actions-buttons">
                    <button class="btn btn-approve" onclick="handleApprove('${pumpkin.id}')">Approve</button>
                    <button class="btn btn-reject" onclick="handleReject('${pumpkin.id}')">Reject</button>
                    <button class="btn btn-delete" onclick="handleDelete('${pumpkin.id}')">Delete</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Render approved section
function renderApprovedSection() {
    const gallery = document.getElementById('approvedGallery');
    const noEntries = document.getElementById('noApproved');

    if (approvedPumpkins.length === 0) {
        gallery.innerHTML = '';
        noEntries.classList.remove('hidden');
        return;
    }

    noEntries.classList.add('hidden');

    gallery.innerHTML = approvedPumpkins.map(pumpkin => `
        <div class="admin-pumpkin-card">
            <img src="${pumpkin.image}" alt="${pumpkin.title}">
            <div class="admin-pumpkin-info">
                <span class="status-badge approved">Approved</span>
                <h3>${pumpkin.title}</h3>
                <p class="carver">by ${pumpkin.carverName}</p>
                <p class="description">${pumpkin.description}</p>
                <div class="vote-count">${pumpkin.voteCount || 0} votes</div>
                <div class="metadata">
                    <p><strong>Submitted:</strong> ${formatDate(pumpkin.submittedAt)}</p>
                    <p><strong>Approved:</strong> ${formatDate(pumpkin.approvedAt)}</p>
                </div>
                <div class="admin-actions-buttons">
                    <button class="btn btn-delete" onclick="handleDelete('${pumpkin.id}')">Delete</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Handle approve
async function handleApprove(pumpkinId) {
    const result = await updatePumpkinStatus(pumpkinId, 'approved');

    if (result.success) {
        showNotification('Pumpkin approved successfully!', 'success');
        await loadPendingPumpkins();
        await loadApprovedPumpkins();
        renderPendingSection();
    } else {
        showNotification('Error approving pumpkin: ' + result.error, 'error');
    }
}

// Handle reject
function handleReject(pumpkinId) {
    showConfirmModal(
        'Reject Pumpkin',
        'Are you sure you want to reject this pumpkin? The submitter will need to resubmit.',
        async () => {
            const result = await updatePumpkinStatus(pumpkinId, 'rejected');

            if (result.success) {
                showNotification('Pumpkin rejected', 'success');
                await loadPendingPumpkins();
                renderPendingSection();
            } else {
                showNotification('Error rejecting pumpkin: ' + result.error, 'error');
            }
        }
    );
}

// Handle delete
function handleDelete(pumpkinId) {
    showConfirmModal(
        'Delete Pumpkin',
        'Are you sure you want to permanently delete this pumpkin? This action cannot be undone.',
        async () => {
            const result = await deletePumpkin(pumpkinId);

            if (result.success) {
                showNotification('Pumpkin deleted successfully', 'success');
                await loadPendingPumpkins();
                await loadApprovedPumpkins();
                renderPendingSection();
                renderApprovedSection();
            } else {
                showNotification('Error deleting pumpkin: ' + result.error, 'error');
            }
        }
    );
}

// Handle reset votes
function handleResetVotes() {
    showConfirmModal(
        'Reset All Votes',
        'Are you sure you want to reset ALL votes? This will delete all votes and reset vote counts to zero. This action cannot be undone.',
        async () => {
            try {
                // Delete all votes
                const votesSnapshot = await db.collection('votes').get();
                const batch = db.batch();

                votesSnapshot.forEach(doc => {
                    batch.delete(doc.ref);
                });

                await batch.commit();

                // Reset all pumpkin vote counts
                const pumpkinsSnapshot = await db.collection('pumpkins').get();
                const pumpkinBatch = db.batch();

                pumpkinsSnapshot.forEach(doc => {
                    pumpkinBatch.update(doc.ref, { voteCount: 0 });
                });

                await pumpkinBatch.commit();

                // Reset all user votedFor fields
                const usersSnapshot = await db.collection('users').get();
                const userBatch = db.batch();

                usersSnapshot.forEach(doc => {
                    userBatch.update(doc.ref, { votedFor: null });
                });

                await userBatch.commit();

                showNotification('All votes have been reset successfully!', 'success');
                await loadApprovedPumpkins();
                renderApprovedSection();
            } catch (error) {
                console.error('Error resetting votes:', error);
                showNotification('Error resetting votes: ' + error.message, 'error');
            }
        }
    );
}

// Show confirmation modal
function showConfirmModal(title, message, callback) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    confirmCallback = callback;
    document.getElementById('confirmModal').classList.remove('hidden');
}

// Close confirmation modal
function closeConfirmModal() {
    document.getElementById('confirmModal').classList.add('hidden');
    confirmCallback = null;
}

// Format date
function formatDate(timestamp) {
    if (!timestamp) return 'N/A';

    // Handle Firestore timestamp
    let date;
    if (timestamp.toDate) {
        date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
        date = timestamp;
    } else {
        date = new Date(timestamp);
    }

    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Show notification
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
