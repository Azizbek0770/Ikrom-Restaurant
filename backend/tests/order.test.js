const request = require('supertest');
const { app } = require('../src/app');
const { sequelize, User, Category, MenuItem, Address, Order } = require('../src/models');

describe('Order Tests', () => {
  let customerToken;
  let adminToken;
  let customerId;
  let addressId;
  let menuItemId;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Create customer
    const customerRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'customer@test.com',
        password: 'Customer@123',
        first_name: 'Customer',
        role: 'customer'
      });
    
    customerToken = customerRes.body.data.accessToken;
    customerId = customerRes.body.data.user.id;

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

    // Create category and menu item
    const category = await Category.create({ name: 'Test Category' });
    const menuItem = await MenuItem.create({
      category_id: category.id,
      name: 'Test Item',
      price: 25000,
      description: 'Test item description'
    });
    menuItemId = menuItem.id;

    // Create address
    const addressRes = await request(app)
      .post('/api/addresses')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        street_address: '123 Test St',
        city: 'Tashkent',
        latitude: 41.2995,
        longitude: 69.2401
      });
    
    addressId = addressRes.body.data.address.id;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/orders', () => {
    it('should create order successfully', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [
            {
              menu_item_id: menuItemId,
              quantity: 2,
              special_instructions: 'No onions'
            }
          ],
          address_id: addressId,
          payment_method: 'cash',
          delivery_notes: 'Ring the bell'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.order.order_number).toBeDefined();
      expect(res.body.data.order.total_amount).toBeDefined();
    });

    it('should fail without items', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [],
          address_id: addressId
        });

      expect(res.statusCode).toBe(400);
    });

    it('should fail with invalid menu item', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [
            {
              menu_item_id: '00000000-0000-0000-0000-000000000000',
              quantity: 1
            }
          ],
          address_id: addressId
        });

      expect(res.statusCode).toBe(404);
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .post('/api/orders')
        .send({
          items: [{ menu_item_id: menuItemId, quantity: 1 }],
          address_id: addressId
        });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/orders/my-orders', () => {
    it('should get customer orders', async () => {
      const res = await request(app)
        .get('/api/orders/my-orders')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.orders)).toBe(true);
      expect(res.body.data.orders.length).toBeGreaterThan(0);
    });

    it('should filter by status', async () => {
      const res = await request(app)
        .get('/api/orders/my-orders?status=pending')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/orders/:id', () => {
    let orderId;

    beforeAll(async () => {
      const order = await Order.findOne({ where: { customer_id: customerId } });
      orderId = order.id;
    });

    it('should get single order', async () => {
      const res = await request(app)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.order.id).toBe(orderId);
    });

    it('should fail for other customer order', async () => {
      // Create another customer
      const otherCustomer = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'other@test.com',
          password: 'Other@123',
          first_name: 'Other'
        });

      const res = await request(app)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${otherCustomer.body.data.accessToken}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe('PATCH /api/orders/:id/status', () => {
    let orderId;

    beforeAll(async () => {
      const order = await Order.findOne({ where: { customer_id: customerId } });
      orderId = order.id;
      // Set order as paid first
      await order.update({ payment_status: 'paid', status: 'paid' });
    });

    it('should update order status (admin)', async () => {
      const res = await request(app)
        .patch(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'confirmed' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.order.status).toBe('confirmed');
    });

    it('should fail for customer', async () => {
      const res = await request(app)
        .patch(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ status: 'preparing' });

      expect(res.statusCode).toBe(403);
    });

    it('should validate status transition', async () => {
      const res = await request(app)
        .patch(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'delivered' });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('PATCH /api/orders/:id/cancel', () => {
    let orderId;

    beforeAll(async () => {
      // Create a new order for cancellation
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ menu_item_id: menuItemId, quantity: 1 }],
          address_id: addressId,
          payment_method: 'cash'
        });
      
      orderId = res.body.data.order.id;
    });

    it('should cancel order', async () => {
      const res = await request(app)
        .patch(`/api/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ cancellation_reason: 'Changed my mind' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.order.status).toBe('cancelled');
    });
  });
});