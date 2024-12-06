const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    dailyLogin: {
        lastClaimed: {
            type: Date,
            default: new Date(0)
        },
        claimed: {
            type: Boolean,
            default: false
        }
    },
    messages: {
        count: {
            type: Number,
            default: 0
        },
        lastReset: {
            type: Date,
            default: new Date(0)
        }
    },
    profileVisits: {
        count: {
            type: Number,
            default: 0
        },
        visitedProfiles: [mongoose.Schema.Types.ObjectId],
        lastReset: {
            type: Date,
            default: new Date(0)
        }
    },
    avatarChanges: {
        count: {
            type: Number,
            default: 0
        },
        lastReset: {
            type: Date,
            default: new Date(0)
        }
    },
    dating: {
        count: {
            type: Number,
            default: 0
        },
        lastReset: {
            type: Date,
            default: new Date(0)
        }
    }
}, {
    timestamps: true
});

// Kiểm tra xem có phải ngày mới không
function isNewDay(date1, date2) {
    if (!date2) return true;
    
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    return d1.getFullYear() !== d2.getFullYear() ||
           d1.getMonth() !== d2.getMonth() ||
           d1.getDate() !== d2.getDate();
}

// Kiểm tra xem có phải tuần mới không (reset vào Chủ nhật)
function isNewWeek(date1, date2) {
    if (!date2) return true;
    
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    // Reset vào Chủ nhật hoặc nếu đã qua 7 ngày
    return d1.getDay() === 0 && d2.getDay() !== 0 ||
           Math.floor((d1 - d2) / (1000 * 60 * 60 * 24)) >= 7;
}

// Reset hàng ngày
taskSchema.methods.resetDaily = function() {
    const now = new Date();
    let needsSave = false;

    // Reset nhiệm vụ đăng nhập hàng ngày
    if (isNewDay(now, this.dailyLogin.lastClaimed)) {
        console.log('Reset daily login task');
        this.dailyLogin.claimed = false;
        this.dailyLogin.lastClaimed = now;
        needsSave = true;
    }

    // Reset nhiệm vụ nhắn tin
    if (isNewDay(now, this.messages.lastReset)) {
        console.log('Reset messages task');
        this.messages.count = 0;
        this.messages.lastReset = now;
        needsSave = true;
    }

    // Reset nhiệm vụ ghé thăm hồ sơ
    if (isNewDay(now, this.profileVisits.lastReset)) {
        console.log('Reset profile visits task');
        this.profileVisits.count = 0;
        this.profileVisits.visitedProfiles = [];
        this.profileVisits.lastReset = now;
        needsSave = true;
    }

    return needsSave;
};

// Reset hàng tuần
taskSchema.methods.resetWeekly = function() {
    const now = new Date();
    let needsSave = false;

    // Reset nhiệm vụ đổi ảnh hồ sơ
    if (isNewWeek(now, this.avatarChanges.lastReset)) {
        console.log('Reset avatar changes task');
        this.avatarChanges.count = 0;
        this.avatarChanges.lastReset = now;
        needsSave = true;
    }

    // Reset nhiệm vụ hẹn hò
    if (isNewWeek(now, this.dating.lastReset)) {
        console.log('Reset dating task');
        this.dating.count = 0;
        this.dating.lastReset = now;
        needsSave = true;
    }

    return needsSave;
};

module.exports = mongoose.model('Task', taskSchema); 