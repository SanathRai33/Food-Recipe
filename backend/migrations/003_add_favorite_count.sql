-- Add favorites_count to recipes table
ALTER TABLE recipes 
ADD COLUMN favorites_count INTEGER DEFAULT 0;

-- Create index for favorites_count
CREATE INDEX idx_recipes_favorites_count ON recipes(favorites_count);

-- Update existing favorites count
UPDATE recipes r
SET favorites_count = (
    SELECT COUNT(*) 
    FROM favorites f 
    WHERE f.recipe_id = r.id
);