// Authentication Module
// Handles user registration, login, logout, and session management

// Fetch admin emails from Firestore config
async function getAdminEmails() {
    try {
        const configDoc = await db.collection('config').doc('adminEmails').get();
        if (configDoc.exists) {
            return configDoc.data().emails || [];
        }
        return [];
    } catch (error) {
        console.error('Error fetching admin emails:', error);
        return [];
    }
}

// Register new user with email and password
async function registerUser(email, password, displayName) {
    try {
        // Validate inputs
        if (!email || !password || !displayName) {
            throw new Error('All fields are required');
        }

        if (password.length < 8) {
            throw new Error('Password must be at least 8 characters long');
        }

        // Create user account
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Update display name
        await user.updateProfile({
            displayName: displayName
        });

        // Check if user should be admin (fetch from Firestore config)
        const adminEmails = await getAdminEmails();
        const isAdmin = adminEmails.map(e => e.toLowerCase()).includes(email.toLowerCase());

        // Create user document in Firestore
        await db.collection('users').doc(user.uid).set({
            uid: user.uid,
            email: email,
            displayName: displayName,
            isAdmin: isAdmin,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            votedFor: null
        });

        return {
            success: true,
            user: user,
            message: 'Account created successfully!'
        };
    } catch (error) {
        console.error('Registration error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Login existing user
async function loginUser(email, password) {
    try {
        if (!email || !password) {
            throw new Error('Email and password are required');
        }

        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        return {
            success: true,
            user: userCredential.user,
            message: 'Logged in successfully!'
        };
    } catch (error) {
        console.error('Login error:', error);

        // Provide user-friendly error messages
        let errorMessage = error.message;
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'No account found with this email';
        } else if (error.code === 'auth/wrong-password') {
            errorMessage = 'Incorrect password';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email address';
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = 'Too many failed attempts. Please try again later';
        }

        return {
            success: false,
            error: errorMessage
        };
    }
}

// Logout current user
async function logoutUser() {
    try {
        await auth.signOut();
        return {
            success: true,
            message: 'Logged out successfully'
        };
    } catch (error) {
        console.error('Logout error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Get current logged-in user
function getCurrentUser() {
    return auth.currentUser;
}

// Get current user's Firestore data
async function getCurrentUserData() {
    const user = getCurrentUser();
    if (!user) {
        return null;
    }

    try {
        const doc = await db.collection('users').doc(user.uid).get();
        if (doc.exists) {
            return doc.data();
        }
        return null;
    } catch (error) {
        console.error('Error fetching user data:', error);
        return null;
    }
}

// Check if current user is admin
async function isCurrentUserAdmin() {
    const userData = await getCurrentUserData();
    return userData ? userData.isAdmin === true : false;
}

// Auth state observer - call this on page load
function onAuthStateChanged(callback) {
    return auth.onAuthStateChanged(async (user) => {
        if (user) {
            // User is logged in
            const userData = await getCurrentUserData();
            callback(user, userData);
        } else {
            // User is logged out
            callback(null, null);
        }
    });
}

// Export functions for use in other files
// (These are available globally when script is loaded)
