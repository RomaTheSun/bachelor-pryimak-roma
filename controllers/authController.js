const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

exports.register = async (req, res) => {
    const { email, password, nickname, birth_date } = req.body;

    try {
        if (!email || !password || !nickname || !birth_date) {
            throw new Error('Missing required fields');
        }

        console.log('Attempting to sign up with:', { email });
        const authResponse = await supabase.auth.signUp({
            email,
            password,
        });

        console.log('Supabase signUp response:', authResponse);

        if (!authResponse) {
            console.error('Supabase signUp returned undefined or null');
            throw new Error('No response from Supabase auth.signUp');
        }
        if (authResponse.error) {
            console.error('Supabase signUp error:', authResponse.error);
            throw authResponse.error;
        }

        const { user } = authResponse.data || {};
        if (!user) {
            console.error('No user data in Supabase signUp response:', authResponse.data);
            throw new Error('No user data returned from Supabase');
        }

        console.log('Inserting user into users table:', { id: user.id, email, nickname, birth_date }); 
        const userResponse = await supabase
            .from('users')
            .insert([
                {
                    id: user.id,
                    email,
                    nickname,
                    birth_date,
                },
            ])
            .select()
            .single();

        console.log('Supabase insert response:', userResponse); 

        if (!userResponse) {
            console.error('Supabase insert returned undefined or null');
            throw new Error('No response from Supabase insert');
        }
        if (userResponse.error) {
            console.error('Supabase insert error:', userResponse.error);
            throw userResponse.error;
        }

        res.status(201).json({ message: 'User registered successfully', user: userResponse.data });
    } catch (error) {
        console.error('Registration error:', error.message); 
        res.status(400).json({ error: error.message });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            throw new Error('Missing email or password');
        }

        console.log('Attempting to login with:', { email }); 
        const authResponse = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        console.log('Supabase signInWithPassword response:', authResponse); 

        if (!authResponse) {
            console.error('Supabase signInWithPassword returned undefined or null');
            throw new Error('No response from Supabase signInWithPassword');
        }
        if (authResponse.error) {
            console.error('Supabase signInWithPassword error:', authResponse.error);
            throw authResponse.error;
        }

        const { user } = authResponse.data || {};
        if (!user) {
            console.error('No user data in Supabase signInWithPassword response:', authResponse.data);
            throw new Error('No user data returned from Supabase');
        }

        const accessToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
        const refreshToken = jwt.sign({ userId: user.id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

        res.json({ accessToken, refreshToken });
    } catch (error) {
        console.error('Login error:', error.message);
        res.status(400).json({ error: error.message });
    }
};

exports.signout = async (req, res) => {
    try {
        const response = await supabase.auth.signOut();

        if (!response || response.error) {
            throw response.error || new Error('Failed to sign out');
        }

        res.json({ message: 'Sign out successful' });
    } catch (error) {
        console.error('Signout error:', error);
        res.status(400).json({ error: error.message });
    }
};

exports.refreshToken = (req, res) => {
    const { refreshToken } = req.body;

    try {
        if (!refreshToken) {
            throw new Error('Refresh token missing');
        }

        jwt.verify(refreshToken, JWT_REFRESH_SECRET, (err, user) => {
            if (err) {
                throw new Error('Invalid refresh token');
            }

            const accessToken = jwt.sign({ userId: user.userId }, JWT_SECRET, { expiresIn: '1h' });

            res.json({ accessToken });
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(403).json({ error: error.message });
    }
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        if (!email) {
            throw new Error('Email is required');
        }

        const response = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: 'http://localhost:3000/reset-password',
        });

        if (!response || response.error) {
            throw response.error || new Error('Failed to send reset email');
        }

        res.json({ message: 'Password reset email sent successfully' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(400).json({ error: error.message });
    }
};

exports.resetPassword = async (req, res) => {
    const { new_password } = req.body;

    try {
        if (!new_password) {
            throw new Error('New password is required');
        }

        const response = await supabase.auth.updateUser({
            password: new_password,
        });

        if (!response || response.error) {
            throw response.error || new Error('Failed to reset password');
        }

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(400).json({ error: error.message });
    }
};