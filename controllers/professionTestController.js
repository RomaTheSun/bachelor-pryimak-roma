const supabase = require('../config/supabase');

exports.createTest = async (req, res) => {
    const { title, description } = req.body;

    try {
        const { data, error } = await supabase
            .from('profession_tests')
            .insert([{ title, description }])
            .select();

        if (error) throw error;

        res.status(201).json(data[0]);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.addQuestion = async (req, res) => {
    const { testId } = req.params;
    const { questionText, options } = req.body;

    try {
        const { data, error } = await supabase.rpc('add_profession_test_question', {
            p_test_id: testId,
            p_question_text: questionText,
            p_options: options,
        });

        if (error) throw error;

        res.status(201).json({ message: 'Question added successfully', questionId: data });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getAllTests = async (req, res) => {
    try {
        const { data, error } = await supabase.from('profession_tests').select('*');

        if (error) throw error;

        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getProfessionDescriptions = async (req, res) => {
    try {
        const { data, error } = await supabase.from('profession_descriptions').select('*');

        if (error) throw error;

        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getTestWithQuestions = async (req, res) => {
    const { testId } = req.params;

    try {
        const { data: test, error: testError } = await supabase
            .from('profession_tests')
            .select('*')
            .eq('id', testId)
            .single();

        if (testError) throw testError;

        const { data: questions, error: questionsError } = await supabase
            .from('profession_test_questions')
            .select(`
                id,
                question_text,
                question_options (
                    id,
                    option_text,
                    option_scores (
                        profession,
                        score
                    )
                )
            `)
            .eq('test_id', testId);

        if (questionsError) throw questionsError;

        res.json({ ...test, questions });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.saveTestResults = async (req, res) => {
    const { testId } = req.params;
    const { results } = req.body;

    try {
        if (!results) {
            return res.status(400).json({ error: 'Results are required' });
        }

        const { data: testData, error: testError } = await supabase
            .from('profession_tests')
            .select('id')
            .eq('id', testId)
            .single();

        if (testError || !testData) {
            return res.status(404).json({ error: 'Profession test not found' });
        }

        const { data, error } = await supabase
            .from('user_profession_results')
            .insert([
                {
                    user_id: req.user.userId,
                    test_id: testId,
                    results: results,
                    created_at: new Date().toISOString()
                }
            ])
            .select();

        if (error) throw error;

        res.status(201).json({ message: 'Test results saved successfully', result: data[0] });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};