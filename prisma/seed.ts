import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@restaurant.com' },
    update: {},
    create: {
      email: 'admin@restaurant.com',
      password: hashedPassword,
      role: 'admin',
      permissions: ['all'],
    },
  });

  console.log('✅ Admin user created:', admin.email);

  // Create waiter user
  const waiterPassword = await bcrypt.hash('waiter123', 10);
  
  const waiter = await prisma.user.upsert({
    where: { email: 'waiter@restaurant.com' },
    update: {},
    create: {
      email: 'waiter@restaurant.com',
      password: waiterPassword,
      role: 'waiter',
      permissions: ['orders:read', 'orders:update', 'tables:read', 'calls:read', 'calls:update'],
    },
  });

  console.log('✅ Waiter user created:', waiter.email);

  // Create chef user
  const chefPassword = await bcrypt.hash('chef123', 10);
  
  const chef = await prisma.user.upsert({
    where: { email: 'chef@restaurant.com' },
    update: {},
    create: {
      email: 'chef@restaurant.com',
      password: chefPassword,
      role: 'chef',
      permissions: ['orders:read', 'orders:update'],
    },
  });

  console.log('✅ Chef user created:', chef.email);

  // Create default settings
  const settings = await prisma.settings.upsert({
    where: { id: 'branding' },
    update: {},
    create: {
      id: 'branding',
      restaurantName: 'QR Restaurant',
      primaryColor: '#6200EE',
      secondaryColor: '#03DAC6',
      accentColor: '#FF6B6B',
    },
  });

  console.log('✅ Default settings created');

  // Create sample menu items
  const menuItems = [
    {
      name: 'Margherita Pizza',
      nameTranslations: { tr: 'Margherita Pizza', en: 'Margherita Pizza' },
      description: 'Classic pizza with tomato sauce, mozzarella, and basil',
      descriptionTranslations: {
        tr: 'Domates sosu, mozzarella ve fesleğen ile klasik pizza',
        en: 'Classic pizza with tomato sauce, mozzarella, and basil',
      },
      price: 12.99,
      category: 'Pizza',
      isPopular: true,
      popularRank: 1,
      allergens: ['gluten', 'dairy'],
    },
    {
      name: 'Caesar Salad',
      nameTranslations: { tr: 'Sezar Salata', en: 'Caesar Salad' },
      description: 'Fresh romaine lettuce with Caesar dressing and croutons',
      descriptionTranslations: {
        tr: 'Sezar sosu ve krutonlarla taze marul',
        en: 'Fresh romaine lettuce with Caesar dressing and croutons',
      },
      price: 8.99,
      category: 'Salads',
      isPopular: false,
      allergens: ['gluten', 'dairy', 'eggs'],
    },
    {
      name: 'Grilled Salmon',
      nameTranslations: { tr: 'Izgara Somon', en: 'Grilled Salmon' },
      description: 'Fresh salmon fillet with vegetables',
      descriptionTranslations: {
        tr: 'Sebzelerle taze somon fileto',
        en: 'Fresh salmon fillet with vegetables',
      },
      price: 18.99,
      category: 'Main Course',
      isPopular: true,
      popularRank: 2,
      allergens: ['fish'],
    },
  ];

  for (const item of menuItems) {
    await prisma.menuItem.upsert({
      where: { id: item.name.toLowerCase().replace(/\s+/g, '-') },
      update: {},
      create: item,
    });
  }

  console.log('✅ Sample menu items created');

  // Create sample tables
  const tables = [
    { name: 'Table 1', qrCodeUrl: '/qr/table-1.png' },
    { name: 'Table 2', qrCodeUrl: '/qr/table-2.png' },
    { name: 'Table 3', qrCodeUrl: '/qr/table-3.png' },
    { name: 'Table 4', qrCodeUrl: '/qr/table-4.png' },
    { name: 'Table 5', qrCodeUrl: '/qr/table-5.png' },
  ];

  for (const table of tables) {
    await prisma.table.upsert({
      where: { name: table.name },
      update: {},
      create: table,
    });
  }

  console.log('✅ Sample tables created');

  console.log('🎉 Seeding completed!');
  console.log('\n📝 Login credentials:');
  console.log('Admin: admin@restaurant.com / admin123');
  console.log('Waiter: waiter@restaurant.com / waiter123');
  console.log('Chef: chef@restaurant.com / chef123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
