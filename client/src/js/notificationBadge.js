let unreadMessages = 0;
let unreadMatchRequests = 0;

async function checkNotifications() {
    try {
        const [messageCount, matchRequestCount] = await Promise.all([
            getUnreadMessageCount(),
            getUnreadMatchRequestCount()
        ]);

        if (messageCount !== unreadMessages || matchRequestCount !== unreadMatchRequests) {
            unreadMessages = messageCount;
            unreadMatchRequests = matchRequestCount;
            updateNotificationBadges(messageCount, matchRequestCount);
        }
    } catch (error) {
        console.error('Error checking notifications:', error);
    }
}

async function getUnreadMessageCount() {
    try {
        const response = await fetch(`${window.API_URL}/messages/unread/count`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        if (!response.ok) throw new Error('Failed to get unread messages count');
        const data = await response.json();
        return data.count;
    } catch (error) {
        console.error('Error getting unread message count:', error);
        return 0;
    }
}

async function getUnreadMatchRequestCount() {
    try {
        const response = await fetch(`${window.API_URL}/matches/pending/count`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        if (!response.ok) throw new Error('Failed to get match requests count');
        const data = await response.json();
        return data.count;
    } catch (error) {
        console.error('Error getting match request count:', error);
        return 0;
    }
}

function updateNotificationBadges(messageCount, matchRequestCount) {
    const chatLink = document.querySelector('a[href="chat.html"]');
    if (chatLink) {
        if (messageCount > 0) {
            chatLink.setAttribute('data-badge', messageCount);
        } else {
            chatLink.removeAttribute('data-badge');
        }
    }

    const notificationLink = document.querySelector('a[href="notifications.html"]');
    if (notificationLink) {
        if (matchRequestCount > 0) {
            notificationLink.setAttribute('data-badge', matchRequestCount);
        } else {
            notificationLink.removeAttribute('data-badge');
        }
    }
}

// Khởi tạo kiểm tra thông báo
checkNotifications();
// Kiểm tra thường xuyên
setInterval(checkNotifications, 5000);