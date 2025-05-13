const supabase = require('../config/supabase');

exports.getUser = async (req, res) => {
    try {
        console.log('getUser: Fetching user with ID:', req.user.userId); 
        const userResponse = await supabase
            .from('users')
            .select('*')
            .eq('id', req.user.userId)
            .single();

        console.log('getUser: Supabase response:', userResponse); 

        if (!userResponse) {
            console.error('getUser: No response from Supabase');
            return res.status(400).json({ error: 'No response from Supabase' });
        }
        if (userResponse.error) {
            console.error('getUser: Supabase error:', userResponse.error);
            return res.status(400).json({ error: userResponse.error.message });
        }

        res.json(userResponse.data);
    } catch (error) {
        console.error('getUser error:', error.message); 
        res.status(400).json({ error: error.message });
    }
};

exports.getProfessionResults = async (req, res) => {
    try {
        console.log('getProfessionResults: Fetching results for user ID:', req.user.userId);
        const userResponse = await supabase
            .from('user_profession_results')
            .select('*')
            .eq('user_id', req.user.userId);

        console.log('getProfessionResults: Supabase response:', userResponse);

        if (!userResponse) {
            console.error('getProfessionResults: No response from Supabase');
            return res.status(400).json({ error: 'No response from Supabase' });
        }
        if (userResponse.error) {
            console.error('getProfessionResults: Supabase error:', userResponse.error);
            return res.status(400).json({ error: userResponse.error.message });
        }

        res.json(userResponse.data);
    } catch (error) {
        console.error('getProfessionResults error:', error.message);
        res.status(400).json({ error: error.message });
    }
};

exports.getProgress = async (req, res) => {
    try {
        console.log('getProgress: Fetching progress for user ID:', req.user.userId);
        const userResponse = await supabase
            .from('user_progress')
            .select('*')
            .eq('user_id', req.user.userId);

        console.log('getProgress: Supabase response:', userResponse);

        if (!userResponse) {
            console.error('getProgress: No response from Supabase');
            return res.status(400).json({ error: 'No response from Supabase' });
        }
        if (userResponse.error) {
            console.error('getProgress: Supabase error:', userResponse.error);
            return res.status(400).json({ error: userResponse.error.message });
        }

        res.json(userResponse.data);
    } catch (error) {
        console.error('getProgress error:', error.message);
        res.status(400).json({ error: error.message });
    }
};

exports.updateNickname = async (req, res) => {
    const { nickname } = req.body;

    try {
        console.log('updateNickname: Updating nickname for user ID:', req.user.userId, 'to:', nickname);
        const userResponse = await supabase
            .from('users')
            .update({ nickname })
            .eq('id', req.user.userId)
            .select()
            .single();

        console.log('updateNickname: Supabase response:', userResponse); 

        if (!userResponse) {
            console.error('updateNickname: No response from Supabase');
            return res.status(400).json({ error: 'No response from Supabase' });
        }
        if (userResponse.error) {
            console.error('updateNickname: Supabase error:', userResponse.error);
            return res.status(400).json({ error: userResponse.error.message });
        }

        res.json({ message: 'Nickname updated successfully', user: userResponse.data });
    } catch (error) {
        console.error('updateNickname error:', error.message);
        res.status(400).json({ error: error.message });
    }
};