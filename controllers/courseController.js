const supabase = require('../config/supabase');

exports.createCourse = async (req, res) => {
    const { title, description } = req.body;

    try {
        const { data, error } = await supabase
            .from('courses')
            .insert([{ title, description }])
            .select();

        if (error) throw error;

        res.status(201).json(data[0]);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.createChapter = async (req, res) => {
    const { courseId } = req.params;
    const { title, description, main_information, order_in_course } = req.body;

    try {
        const { data, error } = await supabase
            .from('chapters')
            .insert([{
                course_id: courseId,
                title,
                description,
                main_information,
                order_in_course
            }])
            .select();

        if (error) throw error;

        res.status(201).json(data[0]);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.createChapterQuestions = async (req, res) => {
    const { chapterId } = req.params;
    const { question, options } = req.body;

    try {
        const { data, error } = await supabase
            .from('chapter_tests')
            .insert([{
                chapter_id: chapterId,
                question: JSON.stringify(question),
                options: JSON.stringify(options)
            }])
            .select();

        if (error) throw error;

        res.status(201).json(data[0]);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getAllCourses = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('courses')
            .select('*');

        if (error) throw error;

        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getCourseWithChapters = async (req, res) => {
    const { courseId } = req.params;

    try {
        const { data: course, error: courseError } = await supabase
            .from('courses')
            .select('*')
            .eq('id', courseId)
            .single();

        if (courseError) throw courseError;

        const { data: chapters, error: chaptersError } = await supabase
            .from('chapters')
            .select('*')
            .eq('course_id', courseId)
            .order('order_in_course', { ascending: true });

        if (chaptersError) throw chaptersError;

        res.json({ ...course, chapters });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getChapterQuestions = async (req, res) => {
    const { chapterId } = req.params;

    try {
        const { data, error } = await supabase
            .from('chapter_tests')
            .select('*')
            .eq('chapter_id', chapterId)
            .single();

        if (error) throw error;

        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};