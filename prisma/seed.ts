import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

console.log('DATABASE_URL:', process.env.DATABASE_URL);

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Seeding database...');

    // Категорії
    const categories = [
        { name: 'Fruits' },
        { name: 'Vegetables' },
        { name: 'Dairy' },
        { name: 'Bakery' },
        { name: 'Beverages' },
    ];

    for (const cat of categories) {
        await prisma.category.upsert({
            where: { name: cat.name },
            update: {},
            create: cat,
        });
    }

    const allCategories = await prisma.category.findMany();

    // Продукти
    const products = [
        { name: 'Apple', description: 'Red apple', price: 1.2, stock: 100, categoryId: allCategories.find(c => c.name === 'Fruits')!.id },
        { name: 'Banana', description: 'Yellow banana', price: 0.8, stock: 150, categoryId: allCategories.find(c => c.name === 'Fruits')!.id },
        { name: 'Milk', description: '1L milk', price: 1.5, stock: 50, categoryId: allCategories.find(c => c.name === 'Dairy')!.id },
        { name: 'Bread', description: 'Whole grain bread', price: 2, stock: 40, categoryId: allCategories.find(c => c.name === 'Bakery')!.id },
        { name: 'Orange Juice', description: 'Fresh juice', price: 3, stock: 30, categoryId: allCategories.find(c => c.name === 'Beverages')!.id },
    ];

    for (const prod of products) {
        await prisma.product.upsert({
            where: { name: prod.name },
            update: {},
            create: prod,
        });
    }

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error('Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
