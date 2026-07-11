const { Op } = require('sequelize');
const RecipeReview = require('../models/RecipeReview');
const Recipe = require('../models/Recipe');
const User = require('../models/User');
const Activity = require('../models/Activity');
const { ApiResponse, sendResponse } = require('../utils/apiResponse');
const logger = require('../utils/logger');
const sequelize = require("../config/database");

const createOrUpdateReviewRating = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const { recipeId } = req.params;
        const { rating, review_content } = req.body;
        
        const recipe = await Recipe.findByPk(recipeId, { transaction });
        if (!recipe) {
            const response = ApiResponse.error('Recipe not found', null, 404);
            return sendResponse(res, response);
        }
        
        const [review, created] = await RecipeReview.upsert({
            user_id: req.user.id,
            recipe_id: recipeId,
            rating,
            review_content,
            is_edited: false
        }, {
            returning: true,
            transaction
        });
        
        if (!created) {
            await review.update({ 
                rating, 
                review_content,
                is_edited: true 
            }, { transaction });
        }
        
        const stats = await RecipeReview.findAll({
            where: { recipe_id: recipeId },
            attributes: [
                [sequelize.fn('AVG', sequelize.col('rating')), 'average_rating'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'total_reviews']
            ],
            transaction
        });
        
        const averageRating = parseFloat(stats[0].get('average_rating')) || 0;
        const totalReviews = parseInt(stats[0].get('total_reviews')) || 0;
        
        await transaction.commit();
        
        const response = ApiResponse.success(
            created ? 'Review and rating added successfully' : 'Review and rating updated successfully',
            {
                review,
                average_rating: Math.round(averageRating * 10) / 10,
                total_reviews: totalReviews
            }
        );
        return sendResponse(res, response);
        
    } catch (error) {
        await transaction.rollback();
        logger.error('Create review rating error:', error);
        const response = ApiResponse.error('Failed to save review', null, 500);
        return sendResponse(res, response);
    }
};

const getRecipeReviews = async (req, res) => {
    try {
        const { recipeId } = req.params;
        const { page = 1, limit = 10, sort = 'created_at', order = 'DESC' } = req.query;
        
        const offset = (page - 1) * limit;
        
        const { count, rows } = await RecipeReview.findAndCountAll({
            where: { recipe_id: recipeId },
            include: [
                {
                    model: User,
                    as: 'User',
                    attributes: ['id', 'username', 'profile_picture', 'first_name', 'last_name']
                }
            ],
            order: [[sort, order]],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        
        const stats = await RecipeReview.findAll({
            where: { recipe_id: recipeId },
            attributes: [
                [sequelize.fn('AVG', sequelize.col('rating')), 'average_rating'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'total_reviews'],
                [sequelize.fn('SUM', sequelize.fn('CASE', sequelize.literal('rating = 5'), 'THEN 1', 'ELSE 0', 'END')), 'five_stars'],
                [sequelize.fn('SUM', sequelize.fn('CASE', sequelize.literal('rating = 4'), 'THEN 1', 'ELSE 0', 'END')), 'four_stars'],
                [sequelize.fn('SUM', sequelize.fn('CASE', sequelize.literal('rating = 3'), 'THEN 1', 'ELSE 0', 'END')), 'three_stars'],
                [sequelize.fn('SUM', sequelize.fn('CASE', sequelize.literal('rating = 2'), 'THEN 1', 'ELSE 0', 'END')), 'two_stars'],
                [sequelize.fn('SUM', sequelize.fn('CASE', sequelize.literal('rating = 1'), 'THEN 1', 'ELSE 0', 'END')), 'one_star']
            ]
        });
        
        const averageRating = parseFloat(stats[0]?.get('average_rating')) || 0;
        const totalReviews = parseInt(stats[0]?.get('total_reviews')) || 0;
        
        const response = ApiResponse.paginated(
            'Reviews fetched successfully',
            rows,
            {
                total: count,
                page: parseInt(page),
                total_pages: Math.ceil(count / limit),
                average_rating: Math.round(averageRating * 10) / 10,
                total_reviews: totalReviews,
                rating_distribution: {
                    5: parseInt(stats[0]?.get('five_stars')) || 0,
                    4: parseInt(stats[0]?.get('four_stars')) || 0,
                    3: parseInt(stats[0]?.get('three_stars')) || 0,
                    2: parseInt(stats[0]?.get('two_stars')) || 0,
                    1: parseInt(stats[0]?.get('one_star')) || 0
                }
            }
        );
        return sendResponse(res, response);
        
    } catch (error) {
        logger.error('Get recipe reviews error:', error);
        const response = ApiResponse.error('Failed to fetch reviews', null, 500);
        return sendResponse(res, response);
    }
};

const getUserReview = async (req, res) => {
    try {
        const { recipeId } = req.params;
        
        const review = await RecipeReview.findOne({
            where: {
                user_id: req.user.id,
                recipe_id: recipeId
            },
            include: [
                {
                    model: User,
                    as: 'User',
                    attributes: ['id', 'username', 'profile_picture']
                }
            ]
        });
        
        const response = ApiResponse.success('User review fetched', { review });
        return sendResponse(res, response);
        
    } catch (error) {
        logger.error('Get user review error:', error);
        const response = ApiResponse.error('Failed to fetch user review', null, 500);
        return sendResponse(res, response);
    }
};

const deleteReview = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const { reviewId } = req.params;
        
        const review = await RecipeReview.findOne({
            where: {
                id: reviewId,
                user_id: req.user.id
            },
            transaction
        });
        
        if (!review) {
            const response = ApiResponse.error('Review not found or unauthorized', null, 404);
            return sendResponse(res, response);
        }
        
        await review.destroy({ transaction });
        await transaction.commit();
        
        const response = ApiResponse.success('Review deleted successfully');
        return sendResponse(res, response);
        
    } catch (error) {
        await transaction.rollback();
        logger.error('Delete review error:', error);
        const response = ApiResponse.error('Failed to delete review', null, 500);
        return sendResponse(res, response);
    }
};

module.exports = {
    createOrUpdateReviewRating,
    getRecipeReviews,
    getUserReview,
    deleteReview
};