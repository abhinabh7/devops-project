CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Seed some sample data
INSERT INTO products (name, price) VALUES
  ('Laptop', 999.99),
  ('Mouse', 29.99),
  ('Keyboard', 79.99)
ON CONFLICT DO NOTHING;
