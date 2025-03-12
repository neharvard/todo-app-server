const { check, validationResult } = require('express-validator');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// for forgot password
const crypto = require('crypto');
const nodemailer = require('nodemailer');




exports.register = async (req, res) => {
    // Validation
    await Promise.all([
        check('firstName', 'First Name is required').not().isEmpty().run(req),
        check('lastName', 'Last Name is required').not().isEmpty().run(req),
        check('email', 'Please enter a valid email').isEmail().run(req),
        check('password', 'Password must be at least 6 characters').isLength({ min: 6 }).run(req),
    ]);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.error('Validation Errors:', errors.array());
        return res.status(400).json({ msg: 'Validation failed', errors: errors.array() });
    }

    try {
        const { firstName, lastName, email, password } = req.body;

        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            console.error('User already exists:', email);
            return res.status(400).json({ msg: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        user = new User({
            firstName,
            lastName,
            email,
            password: hashedPassword,
        });

        await user.save();
        console.log('User registered successfully:', email);

        // Generate JWT token
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '3h' });

        res.status(201).json({ msg: 'User registered successfully', token });
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ msg: 'Server error' });
    }
};


exports.login = async (req, res) => {
    // Validation
    await Promise.all([
        check('email', 'Please enter a valid email').isEmail().run(req),
        check('password', 'Password is required').exists().run(req)
    ]);

    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const { email, password } = req.body;
        let user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '3h' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

// // Reset Password - Update User's Password
// Forgot Password
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ msg: 'User not found' });

        // Generate a reset token
        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpire = Date.now() + 50 * 60 * 1000; // Token valid for 30 minutes
        await user.save();

        // Send reset email
        const resetUrl = `http://localhost:5000/api/auth/reset-password/${resetToken}`;

        const transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: process.env.ETHEREAL_USER,
                pass: process.env.ETHEREAL_PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        const mailOptions = {
            from: '"Task Manager" <no-reply@taskmanager.com>',
            to: user.email,
            subject: 'Password Reset Request',
            text: `Click the link to reset your password: ${resetUrl}`
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info));

        res.json({ msg: 'Reset password link sent to email' });

    } catch (err) {
        console.error('Error in forgotPassword:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Reset Password
exports.resetPassword = async (req, res) => {
    try {
        const { resetToken } = req.params;
        const { newPassword } = req.body;

        // Hash token to compare with stored one
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        // Find user by token
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() } // Ensure token is still valid
        });

        if (!user) return res.status(400).json({ msg: 'Invalid or expired token' });

        // Update password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        // Clear reset fields
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.json({ msg: 'Password updated successfully' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
};
