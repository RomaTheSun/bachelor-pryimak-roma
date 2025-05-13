const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');
const { createClient } = require('@supabase/supabase-js');

// Mock Supabase
jest.mock('@supabase/supabase-js', () => {
    const mockClient = {
        from: jest.fn(),
    };
    return {
        createClient: jest.fn(() => {
            console.log('Creating mock Supabase client for course tests');
            return mockClient;
        }),
    };
});

describe('Course Endpoints', () => {
    const mockToken = jwt.sign({ userId: '123' }, process.env.JWT_SECRET || 'secret');

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create a new course with valid token', async () => {
        const mockCourse = { id: 'course1', title: 'Military Course', description: 'Course description' };
        const insertResponse = { data: [mockCourse], error: null };

        const mockInsert = jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue(insertResponse),
        });
        createClient().from.mockReturnValue({ insert: mockInsert });

        console.log('Mock insert configured to return:', insertResponse);

        const res = await request(app)
            .post('/api/courses')
            .set('Authorization', `Bearer ${mockToken}`)
            .send({ title: 'Military Course', description: 'Course description' });

        console.log('Create course response:', { status: res.statusCode, body: res.body }); 

        expect(res.statusCode).toEqual(201);
        expect(res.body).toEqual(mockCourse);
    });

    it('should fail to create course without token', async () => {
        const res = await request(app)
            .post('/api/courses')
            .send({ title: 'Military Course', description: 'Course description' });

        console.log('Fail to create course response:', { status: res.statusCode, body: res.body }); 

        expect(res.statusCode).toEqual(401);
    });

    it('should create a new chapter for a course with valid token', async () => {
        const mockChapter = {
            id: 'chapter1',
            course_id: 'course1',
            title: 'Chapter 1',
            description: 'Chapter description',
            main_information: 'Main info',
            order_in_course: 1,
        };
        const insertResponse = { data: [mockChapter], error: null };

        const mockInsert = jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue(insertResponse),
        });
        createClient().from.mockReturnValue({ insert: mockInsert });

        console.log('Mock insert configured to return:', insertResponse);

        const res = await request(app)
            .post('/api/courses/course1/chapters')
            .set('Authorization', `Bearer ${mockToken}`)
            .send({
                title: 'Chapter 1',
                description: 'Chapter description',
                main_information: 'Main info',
                order_in_course: 1,
            });

        console.log('Create chapter response:', { status: res.statusCode, body: res.body }); 

        expect(res.statusCode).toEqual(201);
        expect(res.body).toEqual(mockChapter);
    });

    it('should fail to create chapter without token', async () => {
        const res = await request(app)
            .post('/api/courses/course1/chapters')
            .send({
                title: 'Chapter 1',
                description: 'Chapter description',
                main_information: 'Main info',
                order_in_course: 1,
            });

        console.log('Fail to create chapter response:', { status: res.statusCode, body: res.body }); 

        expect(res.statusCode).toEqual(401);
    });

    it('should create chapter questions with valid token', async () => {
        const mockQuestions = {
            id: 'question1',
            chapter_id: 'chapter1',
            question: { text: 'What is leadership?' },
            options: [{ text: 'Option 1', correct: true }, { text: 'Option 2', correct: false }],
        };
        const insertResponse = { data: [mockQuestions], error: null };

        const mockInsert = jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue(insertResponse),
        });
        createClient().from.mockReturnValue({ insert: mockInsert });

        console.log('Mock insert configured to return:', insertResponse); 

        const res = await request(app)
            .post('/api/chapters/chapter1/questions')
            .set('Authorization', `Bearer ${mockToken}`)
            .send({
                question: { text: 'What is leadership?' },
                options: [{ text: 'Option 1', correct: true }, { text: 'Option 2', correct: false }],
            });

        console.log('Create chapter questions response:', { status: res.statusCode, body: res.body }); 

        expect(res.statusCode).toEqual(201);
        expect(res.body).toEqual(mockQuestions);
    });

    it('should fail to create chapter questions without token', async () => {
        const res = await request(app)
            .post('/api/chapters/chapter1/questions')
            .send({
                question: { text: 'What is leadership?' },
                options: [{ text: 'Option 1', correct: true }, { text: 'Option 2', correct: false }],
            });

        console.log('Fail to create chapter questions response:', { status: res.statusCode, body: res.body });

        expect(res.statusCode).toEqual(401);
    });

    it('should get all courses with valid token', async () => {
        const mockCourses = [{ id: 'course1', title: 'Military Course' }];
        const selectResponse = { data: mockCourses, error: null };

        const mockSelect = jest.fn().mockResolvedValue(selectResponse);
        createClient().from.mockReturnValue({ select: mockSelect });

        console.log('Mock select configured to return:', selectResponse);

        const res = await request(app)
            .get('/api/courses')
            .set('Authorization', `Bearer ${mockToken}`);

        console.log('Get all courses response:', { status: res.statusCode, body: res.body }); 

        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual(mockCourses);
    });

    it('should fail to get all courses without token', async () => {
        const res = await request(app).get('/api/courses');

        console.log('Fail to get all courses response:', { status: res.statusCode, body: res.body });

        expect(res.statusCode).toEqual(401);
    });

    it('should get a specific course with chapters with valid token', async () => {
        const mockCourse = { id: 'course1', title: 'Military Course' };
        const mockChapters = [{ id: 'chapter1', course_id: 'course1', title: 'Chapter 1', order_in_course: 1 }];
        const courseResponse = { data: mockCourse, error: null };
        const chaptersResponse = { data: mockChapters, error: null };

        const mockCourseSelect = jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue(courseResponse),
            }),
        });
        const mockChaptersSelect = jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue(chaptersResponse),
            }),
        });
        createClient().from.mockImplementation(table => {
            console.log('Mock from called for table:', table); 
            if (table === 'courses') return { select: mockCourseSelect };
            if (table === 'chapters') return { select: mockChaptersSelect };
            return { select: jest.fn() };
        });

        console.log('Mock course select configured to return:', courseResponse); 
        console.log('Mock chapters select configured to return:', chaptersResponse); 

        const res = await request(app)
            .get('/api/courses/course1')
            .set('Authorization', `Bearer ${mockToken}`);

        console.log('Get specific course response:', { status: res.statusCode, body: res.body }); 

        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({ ...mockCourse, chapters: mockChapters });
    });

    it('should fail to get specific course without token', async () => {
        const res = await request(app).get('/api/courses/course1');

        console.log('Fail to get specific course response:', { status: res.statusCode, body: res.body }); 

        expect(res.statusCode).toEqual(401);
    });

    it('should get chapter questions with valid token', async () => {
        const mockQuestions = {
            id: 'question1',
            chapter_id: 'chapter1',
            question: JSON.stringify({ text: 'What is leadership?' }),
            options: JSON.stringify([{ text: 'Option 1', correct: true }, { text: 'Option 2', correct: false }]),
        };
        const selectResponse = { data: mockQuestions, error: null };

        const mockSelect = jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue(selectResponse),
            }),
        });
        createClient().from.mockReturnValue({ select: mockSelect });

        console.log('Mock select configured to return:', selectResponse);

        const res = await request(app)
            .get('/api/chapters/chapter1/questions')
            .set('Authorization', `Bearer ${mockToken}`);

        console.log('Get chapter questions response:', { status: res.statusCode, body: res.body });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual(mockQuestions);
    });

    it('should fail to get chapter questions without token', async () => {
        const res = await request(app).get('/api/chapters/chapter1/questions');

        console.log('Fail to get chapter questions response:', { status: res.statusCode, body: res.body }); 

        expect(res.statusCode).toEqual(401);
    });

    it('should fail to create course with missing title', async () => {
        const res = await request(app)
            .post('/api/courses')
            .set('Authorization', `Bearer ${mockToken}`)
            .send({ description: 'Course description' });

        console.log('Fail to create course response:', { status: res.statusCode, body: res.body });

        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('error');
    });
});