const request = require('supertest');
const { app } = require('../src/app');
const { sequelize, Category, MenuItem } = require('../src/models');

describe('Menu Tests', () => {
  let adminToken;
  let categoryId;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Create admin
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'admin@test.com',
        password: 'Admin@123',
        first_name: 'Admin',
        role: 'admin'
      });
    
    adminToken = adminRes.body.data.accessToken;

    // Create category
    const category = await Category.create({
      name: 'Test Category',
      description: 'Test description'
    });
    categoryId = category.id;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Category Endpoints', () => {
    describe('POST /api/categories', () => {
      it('should create category (admin)', async () => {
        const res = await request(app)
          .post('/api/categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'New Category',
            name_uz: 'Yangi kategoriya',
            description: 'Test category'
          });

        expect(res.statusCode).toBe(201);
        expect(res.body.data.category.name).toBe('New Category');
      });

      it('should fail without authentication', async () => {
        const res = await request(app)
          .post('/api/categories')
          .send({ name: 'Unauthorized Category' });

        expect(res.statusCode).toBe(401);
      });
    });

    describe('GET /api/categories', () => {
      it('should get all categories', async () => {
        const res = await request(app).get('/api/categories');

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.data.categories)).toBe(true);
        expect(res.body.data.categories.length).toBeGreaterThan(0);
      });

      it('should filter active categories', async () => {
        const res = await request(app)
          .get('/api/categories?active_only=true');

        expect(res.statusCode).toBe(200);
      });
    });

    describe('PUT /api/categories/:id', () => {
      it('should update category', async () => {
        const res = await request(app)
          .put(`/api/categories/${categoryId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ description: 'Updated description' });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.category.description).toBe('Updated description');
      });
    });
  });

  describe('Menu Item Endpoints', () => {
    let menuItemId;

    describe('POST /api/menu', () => {
      it('should create menu item (admin)', async () => {
        const res = await request(app)
          .post('/api/menu')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            category_id: categoryId,
            name: 'Test Burger',
            price: 30000,
            description: 'Delicious test burger',
            preparation_time: 15
          });

        expect(res.statusCode).toBe(201);
        expect(res.body.data.menuItem.name).toBe('Test Burger');
        menuItemId = res.body.data.menuItem.id;
      });

      it('should fail with invalid category', async () => {
        const res = await request(app)
          .post('/api/menu')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            category_id: '00000000-0000-0000-0000-000000000000',
            name: 'Invalid Item',
            price: 10000
          });

        expect(res.statusCode).toBe(404);
      });

      it('should fail with negative price', async () => {
        const res = await request(app)
          .post('/api/menu')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            category_id: categoryId,
            name: 'Negative Price Item',
            price: -1000
          });

        expect(res.statusCode).toBe(400);
      });
    });

    describe('GET /api/menu', () => {
      it('should get all menu items', async () => {
        const res = await request(app).get('/api/menu');

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.data.menuItems)).toBe(true);
      });

      it('should filter by category', async () => {
        const res = await request(app)
          .get(`/api/menu?category_id=${categoryId}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.data.menuItems.length).toBeGreaterThan(0);
      });

      it('should filter available items', async () => {
        const res = await request(app)
          .get('/api/menu?available_only=true');

        expect(res.statusCode).toBe(200);
      });
    });

    describe('PUT /api/menu/:id', () => {
      it('should update menu item', async () => {
        const res = await request(app)
          .put(`/api/menu/${menuItemId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ price: 35000 });

        expect(res.statusCode).toBe(200);
        expect(parseFloat(res.body.data.menuItem.price)).toBe(35000);
      });
    });

    describe('PATCH /api/menu/:id/toggle-availability', () => {
      it('should toggle availability', async () => {
        const res = await request(app)
          .patch(`/api/menu/${menuItemId}/toggle-availability`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.data.menuItem.is_available).toBeDefined();
      });
    });

    describe('DELETE /api/menu/:id', () => {
      it('should delete menu item', async () => {
        const res = await request(app)
          .delete(`/api/menu/${menuItemId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
      });
    });
  });
});