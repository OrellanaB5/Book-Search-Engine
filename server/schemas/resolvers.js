const { User } = require('../models')
const { signToken, AuthenticationError } = require('../utils/auth')

const resolvers = {
    Query: {
        users: async () => {
            return await User.find().populate('savedBooks')
        },

        getSingleUser: async (parent, { username }) => {
            const foundUser = await User.findOne({ username: username })
            console.log(foundUser)
            return foundUser
        },

        me: async (parent, args, context) => {
            if (context.user) {
                const user = await User.findOne({ _id: context.user._id })
                return user
            }
            throw AuthenticationError;
        }
    },
    Mutation: {
        createUser: async (parent, { username, email, password }) => {
            const user = await User.create({ username, email, password })
            const token = signToken(user)
            return { token, user }
        },
        login: async (parent, { email, username, password }) => {
            const user = await User.findOne({ $or: [{ username: username }, { email: email }] })
            if (!user) {
                throw AuthenticationError
            }

            const correctPw = await user.isCorrectPassword(password);
            if (!correctPw) {
                throw AuthenticationError
            }

            const token = signToken(user);
            return { token, user }
        },
        saveBook: async (_, { criteria }, context) => {
            if (context.user) {
                const user = context.user
                const updatedUser = await User.findOneAndUpdate(
                    { _id: user._id },
                    { $addToSet: { savedBooks: criteria } },
                    { new: true, runValidators: true }
                );
                return updatedUser
            }
            throw AuthenticationError
        },
        deleteBook: async (_, { bookId }, context) => {
            if (context.user) {
                const user = context.user
                const updatedUser = await User.findOneAndUpdate(
                    { _id: user._id },
                    { $pull: { savedBooks: { bookId: bookId } } },
                    { new: true }
                );
                return updatedUser
            }
            throw AuthenticationError

        }
    }
};

module.exports = resolvers;