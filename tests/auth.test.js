const request = require('supertest');
const app = require('../app');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

// Mock Supabase
jest.mock('@supabase/supabase-js', () => {
    const mockClient = {
        auth: {
            signUp: jest.fn(),
            signInWithPassword: jest.fn(),
            signOut: jest.fn(),
            resetPasswordForEmail: jest.fn(),
            updateUser: jest.fn(),
        },
        from: jest.fn(),
    };
    return {
        createClient: jest.fn(() => {
            console.log('Creating mock Supabase client');
            return mockClient;
        }),
    };
});

describe('Auth Endpoints', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should register a new user', async () => {
        const mockUser = { id: '123', email: 'test@example.com', nickname: 'TestUser', birth_date: '2000-01-01' };
        const signUpResponse = { data: { user: { id: '123', email: 'test@example.com' } }, error: null };
        const insertResponse = { data: mockUser, error: null };

        createClient().auth.signUp.mockResolvedValue(signUpResponse);

        const mockInsert = jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue(insertResponse),
            }),
        });
        createClient().from.mockReturnValue({ insert: mockInsert });

        console.log('Mock signUp configured to return:', signUpResponse);
        console.log('Mock insert configured to return:', insertResponse);
        console.log('Mock from called:', createClient().from());
        console.log('Mock insert called:', mockInsert());

        const res = await request(app)
            .post('/api/register')
            .send({
                email: 'test@example.com',
                password: 'password123',
                nickname: 'TestUser',
                birth_date: '2000-01-01',
            });

        console.log('Register new user response:', { status: res.statusCode, body: res.body });

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('message', 'User registered successfully');
        expect(res.body.user).toEqual(mockUser);
    });

    it('should fail to register with invalid data', async () => {
        const res = await request(app)
            .post('/api/register')
            .send({ email: 'test@example.com', password: 'short' });

        console.log('Fail to register response:', { status: res.statusCode, body: res.body });

        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('error', 'Missing required fields');
    });

    it('should login a user and return tokens', async () => {
        const mockUser = { id: '123', email: 'test@example.com' };
        const signInResponse = { data: { user: mockUser }, error: null };
        createClient().auth.signInWithPassword.mockResolvedValue(signInResponse);

        console.log('Mock signInWithPassword configured to return:', signInResponse);
        const res = await request(app)
            .post('/api/login')
            .send({ email: 'test@example.com', password: 'password123' });

        console.log('Login user response:', { status: res.statusCode, body: res.body });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body).toHaveProperty('refreshToken');
    });

    it('should fail login with invalid credentials', async () => {
        const signInResponse = { data: null, error: { message: 'Invalid credentials' } };
        createClient().auth.signInWithPassword.mockResolvedValue(signInResponse);

        console.log('Mock signInWithPassword configured to return:', signInResponse);

        const res = await request(app)
            .post('/api/login')
            .send({ email: 'test@example.com', password: 'wrong' });

        console.log('Fail to login response:', { status: res.statusCode, body: res.body });

        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('error', 'Invalid credentials');
    });
});