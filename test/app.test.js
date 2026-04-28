// Mock @instana/collector before anything else — it instruments at require time
jest.mock('@instana/collector', () => {
    const mock = jest.fn();
    mock.currentSpan = jest.fn(() => ({ annotate: jest.fn() }));
    return mock;
});

// Mock mongodb so tests run without a real database
const mockFindResult = {
    toArray: jest.fn().mockResolvedValue([
        { sku: 'CAT-001', name: 'Robot Ninja', categories: ['apparel'] }
    ]),
    sort: jest.fn().mockReturnThis()
};

const mockCollection = {
    find:     jest.fn().mockReturnValue(mockFindResult),
    findOne:  jest.fn().mockResolvedValue({ sku: 'CAT-001', name: 'Robot Ninja' }),
    distinct: jest.fn().mockResolvedValue(['apparel', 'electronics'])
};

jest.mock('mongodb', () => ({
    MongoClient: {
        connect: jest.fn().mockResolvedValue({
            db: jest.fn().mockReturnValue({
                collection: jest.fn().mockReturnValue(mockCollection)
            })
        })
    },
    ObjectId: jest.fn()
}));

const request = require('supertest');
const app = require('../server');

beforeAll(async () => {
    // Allow the async mongoConnect() mock to resolve before tests run
    await new Promise(resolve => setTimeout(resolve, 200));
});

describe('Health Check', () => {
    test('GET /health returns 200 with app OK', async () => {
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
        expect(res.body.app).toBe('OK');
        expect(res.body).toHaveProperty('mongo');
    });
});

describe('Products', () => {
    test('GET /products returns array', async () => {
        const res = await request(app).get('/products');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test('GET /products/:cat returns filtered products', async () => {
        const res = await request(app).get('/products/apparel');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test('GET /product/:sku returns product when found', async () => {
        const res = await request(app).get('/product/CAT-001');
        expect(res.status).toBe(200);
        expect(res.body.sku).toBe('CAT-001');
    });

    test('GET /product/:sku returns 404 when not found', async () => {
        mockCollection.findOne.mockResolvedValueOnce(null);
        const res = await request(app).get('/product/INVALID-000');
        expect(res.status).toBe(404);
    });
});

describe('Categories', () => {
    test('GET /categories returns array', async () => {
        const res = await request(app).get('/categories');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
});

describe('Search', () => {
    test('GET /search/:text returns results array', async () => {
        const res = await request(app).get('/search/robot');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
});
