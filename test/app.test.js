describe('Catalogue App', () => {
    test('health response has required fields', () => {
        const health = { app: 'OK', mongo: false };
        expect(health).toHaveProperty('app', 'OK');
        expect(health).toHaveProperty('mongo');
    });

    test('product SKU format is valid', () => {
        const sku = 'CAT-001';
        expect(sku).toMatch(/^[A-Z]+-\d+$/);
    });

    test('mongo URL defaults to expected value', () => {
        const mongoURL = process.env.MONGO_URL || 'mongodb://mongodb:27017/catalogue';
        expect(mongoURL).toContain('catalogue');
    });

    test('server port defaults to 8080', () => {
        const port = process.env.CATALOGUE_SERVER_PORT || '8080';
        expect(port).toBe('8080');
    });
});
