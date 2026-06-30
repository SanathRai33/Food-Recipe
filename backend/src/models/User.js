const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
            len: [3, 50]
        }
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    first_name: {
        type: DataTypes.STRING(50)
    },
    last_name: {
        type: DataTypes.STRING(50)
    },
    profile_picture: {
        type: DataTypes.STRING(255)
    },
    bio: {
        type: DataTypes.TEXT
    },
    dietary_preferences: {
        type: DataTypes.ARRAY(DataTypes.STRING(50)),
        defaultValue: []
    },
    is_admin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    is_banned: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'users',
    hooks: {
        beforeCreate: async (user) => {
            if (user.password_hash) {
                user.password_hash = await bcrypt.hash(user.password_hash, 10);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('password_hash')) {
                user.password_hash = await bcrypt.hash(user.password_hash, 10);
            }
        }
    }
});

User.prototype.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.password_hash);
};

User.prototype.toJSON = function() {
    const values = { ...this.get() };
    delete values.password_hash;
    return values;
};

module.exports = User;