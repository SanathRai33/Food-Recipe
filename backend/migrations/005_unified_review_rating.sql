-- Create unified recipe_reviews table
CREATE TABLE recipe_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_content TEXT NOT NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, recipe_id)
);

-- Create indexes
CREATE INDEX idx_recipe_reviews_user_id ON recipe_reviews(user_id);
CREATE INDEX idx_recipe_reviews_recipe_id ON recipe_reviews(recipe_id);
CREATE INDEX idx_recipe_reviews_rating ON recipe_reviews(rating);
CREATE INDEX idx_recipe_reviews_created_at ON recipe_reviews(created_at DESC);

-- Add comment
COMMENT ON TABLE recipe_reviews IS 'Unified table for recipe ratings and reviews - combines Rating and Review functionality';