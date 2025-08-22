const { ZodError } = require('zod');

/**
 * Generic validation middleware using Zod schemas
 * @param {import('zod').ZodSchema} schema - The Zod schema to validate against
 * @param {string} target - The target to validate ('body', 'query', 'params')
 * @returns {Function} Express middleware function
 */
const validate = (schema, target = 'body') => {
    return (req, res, next) => {
        try {
            let data;
            
            switch (target) {
                case 'body':
                    data = req.body;
                    break;
                case 'query':
                    data = req.query;
                    break;
                case 'params':
                    data = req.params;
                    break;
                default:
                    data = req.body;
            }

            // Parse and validate the data
            const validatedData = schema.parse(data);
            
            // Replace the original data with validated data
            switch (target) {
                case 'body':
                    req.body = validatedData;
                    break;
                case 'query':
                    req.query = validatedData;
                    break;
                case 'params':
                    req.params = validatedData;
                    break;
            }
            
            next();
        } catch (error) {
            if (error instanceof ZodError && Array.isArray(error.errors)) {
                const formattedErrors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message,
                    code: err.code
                }));

                return res.status(400).json({
                    error: 'Validation failed',
                    message: 'Please check your input data',
                    details: formattedErrors
                });
            }
            
            // Handle other errors
            console.error('Validation middleware error:', error);
            return res.status(500).json({
                error: 'Internal server error',
                message: 'An error occurred during validation'
            });
        }
    };
};

/**
 * Validate request body
 * @param {import('zod').ZodSchema} schema - The Zod schema to validate against
 * @returns {Function} Express middleware function
 */
const validateBody = (schema) => validate(schema, 'body');

/**
 * Validate request query parameters
 * @param {import('zod').ZodSchema} schema - The Zod schema to validate against
 * @returns {Function} Express middleware function
 */
const validateQuery = (schema) => validate(schema, 'query');

/**
 * Validate request parameters
 * @param {import('zod').ZodSchema} schema - The Zod schema to validate against
 * @returns {Function} Express middleware function
 */
const validateParams = (schema) => validate(schema, 'params');

/**
 * Custom validation for MongoDB ObjectId
 * @param {string} id - The ID to validate
 * @returns {boolean} True if valid ObjectId, false otherwise
 */
const isValidObjectId = (id) => {
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    return objectIdPattern.test(id);
};

/**
 * Middleware to validate MongoDB ObjectId in params
 * @param {string} paramName - The parameter name to validate
 * @returns {Function} Express middleware function
 */
const validateObjectId = (paramName) => {
    return (req, res, next) => {
        const id = req.params[paramName];
        
        if (!id) {
            return res.status(400).json({
                error: 'Missing parameter',
                message: `${paramName} parameter is required`
            });
        }
        
        if (!isValidObjectId(id)) {
            return res.status(400).json({
                error: 'Invalid ID format',
                message: `${paramName} must be a valid MongoDB ObjectId`
            });
        }
        
        next();
    };
};

/**
 * Sanitize and validate pagination parameters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validatePagination = (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        
        if (page < 1) {
            return res.status(400).json({
                error: 'Invalid page number',
                message: 'Page number must be greater than 0'
            });
        }
        
        if (limit < 1 || limit > 100) {
            return res.status(400).json({
                error: 'Invalid limit',
                message: 'Limit must be between 1 and 100'
            });
        }
        
        req.query.page = page;
        req.query.limit = limit;
        
        next();
    } catch (error) {
        return res.status(400).json({
            error: 'Invalid pagination parameters',
            message: 'Page and limit must be valid numbers'
        });
    }
};

/**
 * Validate file upload (basic validation)
 * @param {string} fieldName - The field name for the file
 * @param {number} maxSize - Maximum file size in bytes
 * @param {string[]} allowedTypes - Array of allowed MIME types
 * @returns {Function} Express middleware function
 */
const validateFileUpload = (fieldName = 'file', maxSize = 5 * 1024 * 1024, allowedTypes = ['image/jpeg', 'image/png', 'image/gif']) => {
    return (req, res, next) => {
        if (!req.file && !req.files) {
            return res.status(400).json({
                error: 'No file uploaded',
                message: `${fieldName} is required`
            });
        }
        
        const file = req.file || req.files[fieldName];
        
        if (!file) {
            return res.status(400).json({
                error: 'File not found',
                message: `${fieldName} file is required`
            });
        }
        
        // Check file size
        if (file.size > maxSize) {
            return res.status(400).json({
                error: 'File too large',
                message: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`
            });
        }
        
        // Check file type
        if (!allowedTypes.includes(file.mimetype)) {
            return res.status(400).json({
                error: 'Invalid file type',
                message: `File type must be one of: ${allowedTypes.join(', ')}`
            });
        }
        
        next();
    };
};

/**
 * Validate search query
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validateSearchQuery = (req, res, next) => {
    const query = req.query.q || req.query.query || req.query.search;
    
    if (!query) {
        return res.status(400).json({
            error: 'Search query required',
            message: 'Please provide a search query'
        });
    }
    
    if (typeof query !== 'string' || query.trim().length < 2) {
        return res.status(400).json({
            error: 'Invalid search query',
            message: 'Search query must be at least 2 characters long'
        });
    }
    
    if (query.length > 100) {
        return res.status(400).json({
            error: 'Search query too long',
            message: 'Search query must be less than 100 characters'
        });
    }
    
    req.query.searchQuery = query.trim();
    next();
};

/**
 * Validate price range
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validatePriceRange = (req, res, next) => {
    const minPrice = req.query.minPrice || req.query.min_price;
    const maxPrice = req.query.maxPrice || req.query.max_price;
    
    if (minPrice !== undefined) {
        const min = parseFloat(minPrice);
        if (isNaN(min) || min < 0) {
            return res.status(400).json({
                error: 'Invalid minimum price',
                message: 'Minimum price must be a non-negative number'
            });
        }
        req.query.minPrice = min;
    }
    
    if (maxPrice !== undefined) {
        const max = parseFloat(maxPrice);
        if (isNaN(max) || max < 0) {
            return res.status(400).json({
                error: 'Invalid maximum price',
                message: 'Maximum price must be a non-negative number'
            });
        }
        req.query.maxPrice = max;
    }
    
    if (minPrice !== undefined && maxPrice !== undefined) {
        const min = parseFloat(minPrice);
        const max = parseFloat(maxPrice);
        if (min > max) {
            return res.status(400).json({
                error: 'Invalid price range',
                message: 'Minimum price cannot be greater than maximum price'
            });
        }
    }
    
    next();
};

module.exports = {
    validate,
    validateBody,
    validateQuery,
    validateParams,
    validateObjectId,
    validatePagination,
    validateFileUpload,
    validateSearchQuery,
    validatePriceRange,
    isValidObjectId
};