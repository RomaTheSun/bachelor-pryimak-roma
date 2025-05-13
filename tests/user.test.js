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
            console.log('Creating mock Supabase client for user tests');
            return mockClient;
        }),
    };
});

describe('User Endpoints', () => {
    const mockToken = jwt.sign({ userId: '123' }, process.env.JWT_SECRET || 'secret');

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should get user data with valid token', async () => {
        const mockUser = { id: '123', email: 'test@example.com', nickname: 'TestUser' };
        const selectResponse = { data: mockUser, error: null };

        const mockSelect = jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue(selectResponse),
            }),
        });
        createClient().from.mockReturnValue({ select: mockSelect });

        console.log('Mock select configured to return:', selectResponse); 
        console.log('Mock from called:', createClient().from());
        console.log('Mock select called:', mockSelect()); 

        const res = await request(app)
            .get('/api/user')
            .set('Authorization', `Bearer ${mockToken}`);

        console.log('Get user data response:', { status: res.statusCode, body: res.body });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual(mockUser);
    });

    it('should fail to get user data without token', async () => {
        const res = await request(app).get('/api/user');

        console.log('Fail to get user data response:', { status: res.statusCode, body: res.body });

        expect(res.statusCode).toEqual(401);
    });

    it('should get profession results with valid token', async () => {
        const mockResults = [{ id: '1', user_id: '123', profession: 'Developer' }];
        const selectResponse = { data: mockResults, error: null };

        const mockSelect = jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue(selectResponse),
        });
        createClient().from.mockReturnValue({ select: mockSelect });

        console.log('Mock select configured to return:', selectResponse); 

        const res = await request(app)
            .get('/api/user/profession-results')
            .set('Authorization', `Bearer ${mockToken}`);

        console.log('Get profession results response:', { status: res.statusCode, body: res.body });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual(mockResults);
    });

    it('should get progress with valid token', async () => {
        const mockProgress = [{ id: '1', user_id: '123', course_id: '101', completed: true }];
        const selectResponse = { data: mockProgress, error: null };

        const mockSelect = jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue(selectResponse),
        });
        createClient().from.mockReturnValue({ select: mockSelect });

        console.log('Mock select configured to return:', selectResponse); 

        const res = await request(app)
            .get('/api/user/progress')
            .set('Authorization', `Bearer ${mockToken}`);

        console.log('Get progress response:', { status: res.statusCode, body: res.body }); 

        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual(mockProgress);
    });

    it('should update nickname with valid token', async () => {
        const mockUser = { id: '123', email: 'test@example.com', nickname: 'NewUser' };
        const updateResponse = { data: mockUser, error: null };

        const mockUpdate = jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue(updateResponse),
                }),
            }),
        });
        createClient().from.mockReturnValue({ update: mockUpdate });

        console.log('Mock update configured to return:', updateResponse); 

        const res = await request(app)
            .put('/api/user/nickname')
            .set('Authorization', `Bearer ${mockToken}`)
            .send({ nickname: 'NewUser' });

        console.log('Update nickname response:', { status: res.statusCode, body: res.body });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('message', 'Nickname updated successfully');
        expect(res.body.user).toEqual(mockUser);
    });
});