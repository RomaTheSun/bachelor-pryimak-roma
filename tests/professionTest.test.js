const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');
const { createClient } = require('@supabase/supabase-js');

// Mock Supabase
jest.mock('@supabase/supabase-js', () => {
    const mockClient = {
        from: jest.fn(),
        rpc: jest.fn(),
    };
    return {
        createClient: jest.fn(() => {
            console.log('Creating mock Supabase client for profession test');
            return mockClient;
        }),
    };
});

describe('Profession Test Endpoints', () => {
    const mockToken = jwt.sign({ userId: '123' }, process.env.JWT_SECRET || 'secret');

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create a new profession test with valid token', async () => {
        const mockTest = { id: 'test1', title: 'Military Test', description: 'Test description' };
        const insertResponse = { data: [mockTest], error: null };

        const mockInsert = jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue(insertResponse),
        });
        createClient().from.mockReturnValue({ insert: mockInsert });

        console.log('Mock insert configured to return:', insertResponse);

        const res = await request(app)
            .post('/api/profession-tests')
            .set('Authorization', `Bearer ${mockToken}`)
            .send({ title: 'Military Test', description: 'Test description' });

        console.log('Create profession test response:', { status: res.statusCode, body: res.body });

        expect(res.statusCode).toEqual(201);
        expect(res.body).toEqual(mockTest);
    });

    it('should fail to create profession test without token', async () => {
        const res = await request(app)
            .post('/api/profession-tests')
            .send({ title: 'Military Test', description: 'Test description' });

        console.log('Fail to create profession test response:', { status: res.statusCode, body: res.body });
        expect(res.statusCode).toEqual(401);
    });

    it('should add a question to a profession test with valid token', async () => {
        const mockQuestion = { questionId: 'question1' };
        const rpcResponse = { data: mockQuestion.questionId, error: null };

        createClient().rpc.mockResolvedValue(rpcResponse);

        console.log('Mock rpc configured to return:', rpcResponse);

        const res = await request(app)
            .post('/api/profession-tests/test1/questions')
            .set('Authorization', `Bearer ${mockToken}`)
            .send({
                questionText: 'Як ви реагуєте в критичних ситуаціях?',
                options: [
                    {
                        text: 'Швидко приймаю рішення',
                        scores: {
                            combat_officer: 10,
                            logistics_officer: 5,
                            intelligence_officer: 7,
                            medical_officer: 6,
                            engineering_officer: 4,
                        },
                    },
                ],
            });

        console.log('Add question response:', { status: res.statusCode, body: res.body });

        expect(res.statusCode).toEqual(201);
        expect(res.body).toEqual({ message: 'Question added successfully', questionId: mockQuestion.questionId });
    });

    it('should fail to add question without token', async () => {
        const res = await request(app)
            .post('/api/profession-tests/test1/questions')
            .send({
                questionText: 'Як ви реагуєте в критичних ситуаціях?',
                options: [{ text: 'Швидко приймаю рішення', scores: { combat_officer: 10 } }],
            });

        console.log('Fail to add question response:', { status: res.statusCode, body: res.body }); 

        expect(res.statusCode).toEqual(401);
    });

    it('should get all profession tests with valid token', async () => {
        const mockTests = [{ id: 'test1', title: 'Military Test' }];
        const selectResponse = { data: mockTests, error: null };

        const mockSelect = jest.fn().mockResolvedValue(selectResponse);
        createClient().from.mockReturnValue({ select: mockSelect });

        console.log('Mock select configured to return:', selectResponse);

        const res = await request(app)
            .get('/api/profession-tests')
            .set('Authorization', `Bearer ${mockToken}`);

        console.log('Get all profession tests response:', { status: res.statusCode, body: res.body });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual(mockTests);
    });

    it('should get profession descriptions with valid token', async () => {
        const mockDescriptions = [{ id: 'desc1', profession: 'Combat Officer', description: 'Leads troops' }];
        const selectResponse = { data: mockDescriptions, error: null };

        const mockSelect = jest.fn().mockResolvedValue(selectResponse);
        createClient().from.mockReturnValue({ select: mockSelect });

        console.log('Mock select configured to return:', selectResponse);

        const res = await request(app)
            .get('/api/profession_descriptions')
            .set('Authorization', `Bearer ${mockToken}`);

        console.log('Get profession descriptions response:', { status: res.statusCode, body: res.body });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual(mockDescriptions);
    });

    it('should get a specific profession test with questions with valid token', async () => {
        const mockTest = { id: 'test1', title: 'Military Test' };
        const mockQuestions = [
            {
                id: 'question1',
                question_text: 'Як ви реагуєте?',
                question_options: [{ id: 'opt1', option_text: 'Швидко', option_scores: [{ profession: 'combat_officer', score: 10 }] }],
            },
        ];
        const testResponse = { data: mockTest, error: null };
        const questionsResponse = { data: mockQuestions, error: null };

        const mockTestSelect = jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue(testResponse),
            }),
        });
        const mockQuestionsSelect = jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue(questionsResponse),
        });
        createClient().from.mockImplementation(table => {
            console.log('Mock from called for table:', table); // Логування
            if (table === 'profession_tests') return { select: mockTestSelect };
            if (table === 'profession_test_questions') return { select: mockQuestionsSelect };
            return { select: jest.fn() };
        });

        console.log('Mock test select configured to return:', testResponse);
        console.log('Mock questions select configured to return:', questionsResponse);

        const res = await request(app)
            .get('/api/profession-tests/test1')
            .set('Authorization', `Bearer ${mockToken}`);

        console.log('Get specific profession test response:', { status: res.statusCode, body: res.body });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({ ...mockTest, questions: mockQuestions });
    });

    it('should save profession test results with valid token', async () => {
        const mockResult = { id: 'result1', user_id: '123', test_id: 'test1', results: { combat_officer: 10 } };
        const testResponse = { data: { id: 'test1' }, error: null };
        const insertResponse = { data: [mockResult], error: null };

        const mockTestSelect = jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue(testResponse),
            }),
        });
        const mockInsert = jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue(insertResponse),
        });
        createClient().from.mockImplementation(table => {
            console.log('Mock from called for table:', table);
            if (table === 'profession_tests') return { select: mockTestSelect };
            if (table === 'user_profession_results') return { insert: mockInsert };
            return { select: jest.fn() };
        });

        console.log('Mock test select configured to return:', testResponse);
        console.log('Mock insert configured to return:', insertResponse);

        const res = await request(app)
            .post('/api/profession-tests/test1/results')
            .set('Authorization', `Bearer ${mockToken}`)
            .send({ results: { combat_officer: 10 } });

        console.log('Save test results response:', { status: res.statusCode, body: res.body });

        expect(res.statusCode).toEqual(201);
        expect(res.body).toEqual({ message: 'Test results saved successfully', result: mockResult });
    });

    it('should fail to save test results with missing results', async () => {
        const res = await request(app)
            .post('/api/profession-tests/test1/results')
            .set('Authorization', `Bearer ${mockToken}`)
            .send({});

        console.log('Fail to save test results response:', { status: res.statusCode, body: res.body });

        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('error', 'Results are required');
    });

    it('should fail to save test results for non-existent test', async () => {
        const testResponse = { data: null, error: { message: 'Test not found' } };

        const mockTestSelect = jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue(testResponse),
            }),
        });
        createClient().from.mockReturnValue({ select: mockTestSelect });

        console.log('Mock test select configured to return:', testResponse);

        const res = await request(app)
            .post('/api/profession-tests/test1/results')
            .set('Authorization', `Bearer ${mockToken}`)
            .send({ results: { combat_officer: 10 } });

        console.log('Fail to save test results response:', { status: res.statusCode, body: res.body });

        expect(res.statusCode).toEqual(404);
        expect(res.body).toHaveProperty('error', 'Profession test not found');
    });
});