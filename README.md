# OoNt Grocery API

A NestJS + PostgreSQL backend service for grocery inventory, carts, categories, and order processing.

## Tech Stack

* NestJS
* Prisma ORM
* PostgreSQL
* Docker / Docker Compose
* Swagger
* Jest (unit + e2e tests)

---

## Features

* Product inventory management
* Product categories
* Persistent shopping carts
* Order creation and cancellation
* Stock reservation and restoration
* Pagination for products
* Swagger API documentation
* Prisma seed script
* Soft delete support for products
* Unit and e2e tests
* Dockerized setup

---

## Project Modules

* Products
* Categories
* Carts
* Orders

---

## Getting Started

### Clone the Repository

```bash
git clone https://github.com/greeschenko/oont-grocery-api.git
cd oont-grocery-api
cp env.example .env
```

### Build and Run

To build the Docker containers and start the application:

```bash
make build
```

If the images were already built before, you can simply run:

```bash
make run
```

The API will be available at:

```text
http://localhost:3000/
```

Swagger documentation will be available at:

```text
http://localhost:3000/api
```

---

## Running Tests

To run both unit tests and e2e tests:

```bash
make test
```

This command runs:

```bash
docker-compose exec app npm run test
docker-compose exec app npm run test:e2e
```

---

## Database Seed

A Prisma seed script is included to populate the database with sample categories and products.

To run the seed manually:

```bash
docker-compose exec app npx prisma db seed
```

The seed script creates:

* 5 categories
* Multiple sample products

Examples include:

* Fruits
* Vegetables
* Dairy
* Bakery
* Beverages

---

## Concurrency Strategy

The most important business requirement is preventing overselling when multiple users try to buy the same product at the same time.

To solve this, order creation and cancellation are wrapped in a single Prisma database transaction using `prisma.$transaction(...)`.

Inside the transaction, the service explicitly locks all affected product rows using PostgreSQL row-level locking with:

```sql
SELECT * FROM "Product"
WHERE id IN (...)
FOR UPDATE
```

This ensures that while one transaction is validating and updating stock, no other transaction can modify the same product rows.

During order creation:

1. The user's cart is loaded.
2. Product rows are locked.
3. Stock availability is validated.
4. The order is created.
5. Product stock is decremented.
6. The cart is cleared.

If any product does not have enough stock, the entire transaction fails and no changes are applied.

The same locking strategy is also used during order cancellation to safely restore stock.

---

## Soft Delete Strategy

Products support soft delete using a `deletedAt` field.

Soft-deleted products are excluded from public product listings, but historical orders remain valid because order items store product name and price snapshots.

---

## Important Design Decisions

* PostgreSQL is used because the project requires transactional consistency and row-level locking.
* Prisma ORM was chosen for type safety and fast development.
* Product information is snapshot into order items to preserve historical order data even if a product changes later.
* Cart data is stored in PostgreSQL instead of memory or Redis to ensure persistence.
* Docker Compose is used so the full application can be started with a single command.

---

## Swagger

Swagger UI:

```text
http://localhost:3000/api
```

