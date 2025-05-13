const supabase = require('../config/supabase');

exports.getUser = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', req.user.userId)
            .single();

        if (error) throw error;

        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getProfessionResults = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('user_profession_results')
            .select('*')
            .eq('user_id', req.user.userId);

        if (error) throw error;

        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getProgress = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('user_progress')
            .select('*')
            .eq('user_id', req.user.userId);

        if (error) throw error;

        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.updateNickname = async (req, res) => {
    const { nickname } = req.body;

    try {
        const { data, error } = await supabase
            .from('users')
            .update({ nickname })
            .eq('id', req.user.userId)
            .select();

        if (error) throw error;

        res.json({ message: 'Nickname updated successfully', user: data[0] });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};