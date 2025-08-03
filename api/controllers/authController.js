import crypto from 'crypto';
import User from '../models/User.js';
import asyncHandler from '../middleware/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';
import sendEmail from '../utils/sendEmail.js';

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req, res, next) => {
    const { name, email, password } = req.body;
    const user = await User.create({ name, email, password });
    sendTokenResponse(user, 201, res);
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new ErrorResponse('Please provide an email and password', 400));
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        return next(new ErrorResponse('Invalid credentials', 401));
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
        return next(new ErrorResponse('Invalid credentials', 401));
    }

    sendTokenResponse(user, 200, res);
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res, next) => {
    // The user is already available in req.user from the protect middleware
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, data: user });
});


// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
    const token = user.getSignedJwtToken();
    const userData = {
        _id: user._id,
        name: user.name,
        email: user.email
    };
    res
        .status(statusCode)
        .json({ success: true, token, user: userData });
};


// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = asyncHandler(async (req, res, next) => {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    
    if (!user) {
        return next(new ErrorResponse('There is no user with that email', 404));
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    // Hash token and set to resetPasswordToken field
    user.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    
    // Set expiration (10 minutes)
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    
    await user.save({ validateBeforeSave: false });
    
    // Create reset URL - Use your frontend URL from env
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    
    // Create email content with branded HTML
    const html = `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="background-color: #4F46E5; padding: 20px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">SkillForge</h1>
            <p style="color: white; margin: 5px 0 0 0;">Password Reset</p>
        </div>
        <div style="background-color: #1F2937; color: #E5E7EB; padding: 20px; border-radius: 0 0 10px 10px;">
            <p>You are receiving this email because you (or someone else) has requested a password reset for your SkillForge account.</p>
            <p>Please click the button below to reset your password. This link will expire in 10 minutes.</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
            </div>
            <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
            <p>If you're having trouble clicking the button, copy and paste the URL below into your web browser:</p>
            <p style="word-break: break-all; color: #9CA3AF;">${resetUrl}</p>
            <hr style="border-color: #4B5563; margin: 20px 0;">
            <p style="font-size: 12px; color: #9CA3AF;">This is an automated email. Please do not reply.</p>
        </div>
    </div>
    `;
    
    try {
        await sendEmail({
            email: user.email,
            subject: 'SkillForge Password Reset',
            message: `You are receiving this email because you requested a password reset. Please go to: ${resetUrl}`,
            html: html
        });
        
        res.status(200).json({ success: true, data: 'Email sent' });
    } catch (err) {
        console.error('Email sending error:', err);
        
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        
        await user.save({ validateBeforeSave: false });
        
        return next(new ErrorResponse('Email could not be sent', 500));
    }
});

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:resetToken
// @access  Public
export const resetPassword = asyncHandler(async (req, res, next) => {
    // Get hashed token
    const resetPasswordToken = crypto
        .createHash('sha256')
        .update(req.params.resetToken)
        .digest('hex');
    
    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
    });
    
    if (!user) {
        return next(new ErrorResponse('Invalid or expired token', 400));
    }
    
    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save();
    
    // Send confirmation email
    const html = `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="background-color: #4F46E5; padding: 20px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">SkillForge</h1>
            <p style="color: white; margin: 5px 0 0 0;">Password Updated</p>
        </div>
        <div style="background-color: #1F2937; color: #E5E7EB; padding: 20px; border-radius: 0 0 10px 10px;">
            <p>Your password has been successfully updated.</p>
            <p>If you did not make this change, please contact us immediately.</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.CLIENT_URL}/login" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Log In</a>
            </div>
            <hr style="border-color: #4B5563; margin: 20px 0;">
            <p style="font-size: 12px; color: #9CA3AF;">This is an automated email. Please do not reply.</p>
        </div>
    </div>
    `;
    
    try {
        await sendEmail({
            email: user.email,
            subject: 'Your password has been changed',
            message: 'Your password has been successfully updated.',
            html: html
        });
    } catch (err) {
        console.error('Confirmation email error:', err);
        // Continue even if confirmation email fails
    }
    
    sendTokenResponse(user, 200, res);
});