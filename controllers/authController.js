const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

exports.register = async (req, res) => {
    const { email, password, nickname, birth_date } = req.body;

    try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (authError) throw authError;

        const { data: userData, error: userError } = await supabase
            .from('users')
            .insert([
                {
                    id: authData.user.id,
                    email,
                    nickname,
                    birth_date
                }
            ]);

        if (userError) throw userError;

        res.status(201).json({ message: 'User registered successfully', user: authData.user });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;

        const accessToken = jwt.sign({ userId: data.user.id }, JWT_SECRET, { expiresIn: '1h' });
        const refreshToken = jwt.sign({ userId: data.user.id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

        res.json({ accessToken, refreshToken });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.signout = async (req, res) => {
    try {
        const { error } = await supabase.auth.signOut();

        if (error) throw error;

        res.json({ message: 'Sign out successful' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.refreshToken = (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) return res.sendStatus(401);

    jwt.verify(refreshToken, JWT_REFRESH_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);

        const accessToken = jwt.sign({ userId: user.userId }, JWT_SECRET, { expiresIn: '1h' });

        res.json({ accessToken });
    });
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: 'http://localhost:3000/reset-password',
        });

        if (error) throw error;
        res.json({ message: 'Password reset email sent successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.resetPassword = async (req, res) => {
    const { new_password } = req.body;

    try {
        const { data, error } = await supabase.auth.updateUser({
            password: new_password
        });

        if (error) throw error;

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};