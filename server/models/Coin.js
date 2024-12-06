const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['TASK_REWARD', 'EXCHANGE_REWARD'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const coinSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    balance: {
        type: Number,
        default: 0,
        min: 0
    },
    transactions: [transactionSchema]
}, {
    timestamps: true
});

// Thêm xu
coinSchema.methods.addCoins = function(amount, type, description) {
    // Validate amount
    if (!amount || amount <= 0) {
        throw new Error('Số xu phải lớn hơn 0');
    }

    // Validate type
    if (!['TASK_REWARD', 'EXCHANGE_REWARD'].includes(type)) {
        throw new Error('Loại giao dịch không hợp lệ');
    }

    // Validate description
    if (!description) {
        throw new Error('Cần có mô tả cho giao dịch');
    }

    // Thêm xu và ghi lại giao dịch
    this.balance += amount;
    this.transactions.push({
        type,
        amount,
        description
    });
};

// Trừ xu
coinSchema.methods.deductCoins = function(amount, type, description) {
    // Validate amount
    if (!amount || amount <= 0) {
        throw new Error('Số xu phải lớn hơn 0');
    }

    // Validate type
    if (!['TASK_REWARD', 'EXCHANGE_REWARD'].includes(type)) {
        throw new Error('Loại giao dịch không hợp lệ');
    }

    // Validate description
    if (!description) {
        throw new Error('Cần có mô tả cho giao dịch');
    }

    // Kiểm tra số dư
    if (this.balance < amount) {
        throw new Error('Số dư không đủ');
    }
    
    // Trừ xu và ghi lại giao dịch
    this.balance -= amount;
    this.transactions.push({
        type,
        amount: -amount,
        description
    });
};

// Middleware để validate balance trước khi save
coinSchema.pre('save', function(next) {
    if (this.balance < 0) {
        next(new Error('Số dư không thể âm'));
    } else {
        next();
    }
});

module.exports = mongoose.model('Coin', coinSchema); 