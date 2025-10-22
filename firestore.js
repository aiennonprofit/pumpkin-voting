// Firestore Service Module
// Handles all database operations for pumpkins and votes

// ============================================
// PUMPKIN OPERATIONS
// ============================================

// Create a new pumpkin entry
async function createPumpkin(pumpkinData) {
    try {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            throw new Error('User must be logged in to create a pumpkin');
        }

        // Add server-side fields
        const pumpkin = {
            ...pumpkinData,
            submittedBy: currentUser.uid,
            submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'pending', // pending, approved, rejected
            approvedAt: null,
            approvedBy: null,
            voteCount: 0
        };

        const docRef = await db.collection('pumpkins').add(pumpkin);
        return {
            success: true,
            id: docRef.id,
            pumpkin: { ...pumpkin, id: docRef.id }
        };
    } catch (error) {
        console.error('Error creating pumpkin:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Get all approved pumpkins (for public gallery)
async function getApprovedPumpkins() {
    try {
        const snapshot = await db.collection('pumpkins')
            .where('status', '==', 'approved')
            .orderBy('submittedAt', 'desc')
            .get();

        const pumpkins = [];
        snapshot.forEach(doc => {
            pumpkins.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return {
            success: true,
            pumpkins: pumpkins
        };
    } catch (error) {
        console.error('Error getting approved pumpkins:', error);
        return {
            success: false,
            error: error.message,
            pumpkins: []
        };
    }
}

// Get all pumpkins (for admin)
async function getAllPumpkins() {
    try {
        const snapshot = await db.collection('pumpkins')
            .orderBy('submittedAt', 'desc')
            .get();

        const pumpkins = [];
        snapshot.forEach(doc => {
            pumpkins.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return {
            success: true,
            pumpkins: pumpkins
        };
    } catch (error) {
        console.error('Error getting all pumpkins:', error);
        return {
            success: false,
            error: error.message,
            pumpkins: []
        };
    }
}

// Get pumpkins by status (for admin moderation)
async function getPumpkinsByStatus(status) {
    try {
        const snapshot = await db.collection('pumpkins')
            .where('status', '==', status)
            .orderBy('submittedAt', 'desc')
            .get();

        const pumpkins = [];
        snapshot.forEach(doc => {
            pumpkins.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return {
            success: true,
            pumpkins: pumpkins
        };
    } catch (error) {
        console.error('Error getting pumpkins by status:', error);
        return {
            success: false,
            error: error.message,
            pumpkins: []
        };
    }
}

// Update pumpkin status (for admin approval/rejection)
async function updatePumpkinStatus(pumpkinId, status) {
    try {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            throw new Error('User must be logged in');
        }

        const updateData = {
            status: status
        };

        if (status === 'approved') {
            updateData.approvedAt = firebase.firestore.FieldValue.serverTimestamp();
            updateData.approvedBy = currentUser.uid;
        }

        await db.collection('pumpkins').doc(pumpkinId).update(updateData);

        return {
            success: true
        };
    } catch (error) {
        console.error('Error updating pumpkin status:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Delete a pumpkin
async function deletePumpkin(pumpkinId) {
    try {
        // Delete the pumpkin
        await db.collection('pumpkins').doc(pumpkinId).delete();

        // Delete all votes for this pumpkin
        const votesSnapshot = await db.collection('votes')
            .where('pumpkinId', '==', pumpkinId)
            .get();

        const batch = db.batch();
        votesSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        return {
            success: true
        };
    } catch (error) {
        console.error('Error deleting pumpkin:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ============================================
// VOTE OPERATIONS
// ============================================

// Cast a vote for a pumpkin
async function castVote(pumpkinId) {
    try {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            throw new Error('User must be logged in to vote');
        }

        // Use Firestore transaction to prevent duplicate votes
        const result = await db.runTransaction(async (transaction) => {
            // Check if user has already voted
            const existingVoteQuery = await db.collection('votes')
                .where('userId', '==', currentUser.uid)
                .get();

            let previousVotePumpkinId = null;

            // If user has voted before, remove the old vote
            if (!existingVoteQuery.empty) {
                const oldVoteDoc = existingVoteQuery.docs[0];
                previousVotePumpkinId = oldVoteDoc.data().pumpkinId;

                // Delete old vote
                transaction.delete(oldVoteDoc.ref);

                // Decrement old pumpkin's vote count
                if (previousVotePumpkinId) {
                    const oldPumpkinRef = db.collection('pumpkins').doc(previousVotePumpkinId);
                    transaction.update(oldPumpkinRef, {
                        voteCount: firebase.firestore.FieldValue.increment(-1)
                    });
                }
            }

            // Add new vote
            const newVoteRef = db.collection('votes').doc();
            transaction.set(newVoteRef, {
                userId: currentUser.uid,
                pumpkinId: pumpkinId,
                votedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Increment new pumpkin's vote count
            const pumpkinRef = db.collection('pumpkins').doc(pumpkinId);
            transaction.update(pumpkinRef, {
                voteCount: firebase.firestore.FieldValue.increment(1)
            });

            // Update user's votedFor field
            const userRef = db.collection('users').doc(currentUser.uid);
            transaction.update(userRef, {
                votedFor: pumpkinId
            });

            return { success: true, previousVote: previousVotePumpkinId };
        });

        return result;
    } catch (error) {
        console.error('Error casting vote:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Get user's current vote
async function getUserVote() {
    try {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            return {
                success: true,
                votedFor: null
            };
        }

        const snapshot = await db.collection('votes')
            .where('userId', '==', currentUser.uid)
            .limit(1)
            .get();

        if (snapshot.empty) {
            return {
                success: true,
                votedFor: null
            };
        }

        const voteData = snapshot.docs[0].data();
        return {
            success: true,
            votedFor: voteData.pumpkinId
        };
    } catch (error) {
        console.error('Error getting user vote:', error);
        return {
            success: false,
            error: error.message,
            votedFor: null
        };
    }
}

// Get vote count for a pumpkin
async function getVoteCount(pumpkinId) {
    try {
        const doc = await db.collection('pumpkins').doc(pumpkinId).get();

        if (!doc.exists) {
            return {
                success: false,
                count: 0
            };
        }

        return {
            success: true,
            count: doc.data().voteCount || 0
        };
    } catch (error) {
        console.error('Error getting vote count:', error);
        return {
            success: false,
            error: error.message,
            count: 0
        };
    }
}

// Get all votes counts (for leaderboard)
async function getAllVoteCounts() {
    try {
        const snapshot = await db.collection('pumpkins')
            .where('status', '==', 'approved')
            .get();

        const voteCounts = {};
        snapshot.forEach(doc => {
            voteCounts[doc.id] = doc.data().voteCount || 0;
        });

        return {
            success: true,
            voteCounts: voteCounts
        };
    } catch (error) {
        console.error('Error getting all vote counts:', error);
        return {
            success: false,
            error: error.message,
            voteCounts: {}
        };
    }
}

// ============================================
// REAL-TIME LISTENERS
// ============================================

// Listen to approved pumpkins (for gallery)
function listenToApprovedPumpkins(callback) {
    return db.collection('pumpkins')
        .where('status', '==', 'approved')
        .orderBy('submittedAt', 'desc')
        .onSnapshot(snapshot => {
            const pumpkins = [];
            snapshot.forEach(doc => {
                pumpkins.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            callback(pumpkins);
        }, error => {
            console.error('Error listening to approved pumpkins:', error);
            callback([]);
        });
}

// Listen to all pumpkins (for admin)
function listenToAllPumpkins(callback) {
    return db.collection('pumpkins')
        .orderBy('submittedAt', 'desc')
        .onSnapshot(snapshot => {
            const pumpkins = [];
            snapshot.forEach(doc => {
                pumpkins.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            callback(pumpkins);
        }, error => {
            console.error('Error listening to all pumpkins:', error);
            callback([]);
        });
}
