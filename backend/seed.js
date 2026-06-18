const mongoose = require('mongoose');
const dns = require('dns');
require('dotenv').config();

// Fix DNS resolution issues
dns.setServers(['8.8.8.8', '8.8.4.4']);

const User    = require('./models/User');
const Product = require('./models/Product');

const products = [
  { name:'Recycled Paper Notebook', description:'Made from 100% recycled paper. Perfect for daily use.', category:'Stationery', price:150, stock:50, madeFrom:'Recycled Paper', ecoImpact:'Saves 2kg CO2', sold:24 },
  { name:'Eco Shopping Bag', description:'Reusable bag made from recycled plastic bottles.', category:'Bags', price:200, stock:100, madeFrom:'Recycled Plastic', ecoImpact:'Replaces 500 plastic bags', sold:78 },
  { name:'Glass Flower Vase', description:'Hand-crafted artisan vase from recycled glass.', category:'Home Decor', price:450, stock:30, madeFrom:'Recycled Glass', ecoImpact:'Repurposes 1kg glass', sold:12 },
  { name:'Aluminum Pen Holder', description:'Sleek desk organizer from recycled aluminum cans.', category:'Office', price:300, stock:60, madeFrom:'Recycled Aluminum', ecoImpact:'Saves 5kg bauxite mining', sold:35 },
  { name:'Recycled Cardboard Box Set', description:'Set of 3 nesting storage boxes.', category:'Storage', price:350, stock:40, madeFrom:'Recycled Cardboard', ecoImpact:'Saves 3 trees', sold:19 },
  { name:'Eco Glass Candle Holder', description:'Beautiful candle holder from glass bottles.', category:'Home Decor', price:250, stock:45, madeFrom:'Recycled Glass Bottles', ecoImpact:'Upcycles 2 bottles', sold:41 },
  { name:'Paper Seed Pots Set of 6', description:'Biodegradable seed pots from recycled paper pulp.', category:'Gardening', price:180, stock:75, madeFrom:'Recycled Paper Pulp', ecoImpact:'Fully biodegradable', sold:53 },
  { name:'Upcycled Tin Planter', description:'Charming planter made from used tin cans.', category:'Gardening', price:120, stock:90, madeFrom:'Recycled Tin Cans', ecoImpact:'Saves metal from landfill', sold:67 },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority',
    });
    console.log('✅ Connected to MongoDB');

    const adminExists = await User.findOne({ email: 'admin@ecotrade.com' });
    if (!adminExists) {
      await User.create({ name:'EcoTrade Admin', email:'admin@ecotrade.com', password:'admin123', role:'admin', phone:'+977 9800000000' });
      console.log('✅ Admin: admin@ecotrade.com / admin123');
    } else { console.log('ℹ️  Admin already exists'); }

    const userExists = await User.findOne({ email: 'user@ecotrade.com' });
    if (!userExists) {
      await User.create({ name:'Isha Shrestha', email:'user@ecotrade.com', password:'user1234', role:'contributor', phone:'+977 9811111111', ecoPoints:350, totalScraps:25 });
      console.log('✅ User: user@ecotrade.com / user1234');
    } else { console.log('ℹ️  User already exists'); }

    const count = await Product.countDocuments();
    if (count === 0) {
      await Product.insertMany(products);
      console.log(`✅ ${products.length} products seeded`);
    } else { console.log(`ℹ️  ${count} products already exist`); }

    console.log('\n🌱 Done! Login with:');
    console.log('   Admin: admin@ecotrade.com / admin123');
    console.log('   User:  user@ecotrade.com  / user1234');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
}
seed();
