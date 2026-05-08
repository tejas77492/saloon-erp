/**
 * Seed Script — Run once to create admin user + sample services
 * Usage: node services/seedData.js
 */

require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // Use Google DNS for SRV lookups
const mongoose = require('mongoose');
const User     = require('../models/User');
const Service  = require('../models/Service');
const WorkingHours = require('../models/WorkingHours');

const SERVICES = [
  { name: 'Classic Haircut',   description: 'Precision cut with styling',           price: 300,  duration: 30, category: 'hair',  isActive: true },
  { name: 'Beard Trim',        description: 'Shape and trim with razor finish',      price: 150,  duration: 20, category: 'beard', isActive: true },
  { name: 'Hair + Beard Combo',description: 'Full haircut and beard grooming',       price: 400,  duration: 45, category: 'hair',  isActive: true },
  { name: 'Facial',            description: 'Deep cleanse and hydration facial',     price: 500,  duration: 45, category: 'skin',  isActive: true },
  { name: 'Hair Spa',          description: 'Nourishing treatment for healthy hair', price: 800,  duration: 60, category: 'hair',  isActive: true },
  { name: 'Hair Coloring',     description: 'Full color or highlights',              price: 1200, duration: 90, category: 'hair',  isActive: true, bufferTime: 10 },
  { name: 'D-Tan Pack',        description: 'Face and neck de-tanning treatment',   price: 350,  duration: 30, category: 'skin',  isActive: true },
  { name: 'Shave',             description: 'Traditional straight razor shave',      price: 100,  duration: 15, category: 'beard', isActive: true },
];

const WORKING_HOURS = [
  { day: 0, openTime: '10:00', closeTime: '18:00', isClosed: true  }, // Sun - closed
  { day: 1, openTime: '10:00', closeTime: '20:00', isClosed: false },
  { day: 2, openTime: '10:00', closeTime: '20:00', isClosed: false },
  { day: 3, openTime: '10:00', closeTime: '20:00', isClosed: false },
  { day: 4, openTime: '10:00', closeTime: '20:00', isClosed: false },
  { day: 5, openTime: '10:00', closeTime: '20:00', isClosed: false },
  { day: 6, openTime: '09:00', closeTime: '21:00', isClosed: false }, // Sat - extended
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Admin user 1
    const existing = await User.findOne({ email: 'admin@salon.com' });
    if (!existing) {
      await User.create({ name: 'Salon Admin', email: 'admin@salon.com', password: 'admin123', role: 'admin' });
      console.log('✅ Admin created  →  admin@salon.com / admin123');
    } else {
      console.log('ℹ️  Admin (admin@salon.com) already exists');
    }

    // Admin user 2 - Avinash
    const existing2 = await User.findOne({ email: 'avinash@salon.com' });
    if (!existing2) {
      await User.create({ name: 'Avinash', email: 'avinash@salon.com', password: 'avinash111', role: 'admin' });
      console.log('✅ Admin created  →  avinash@salon.com / avinash111');
    } else {
      console.log('ℹ️  Admin (avinash@salon.com) already exists');
    }

    // Services
    const count = await Service.countDocuments();
    if (count === 0) {
      await Service.insertMany(SERVICES);
      console.log(`✅ ${SERVICES.length} services seeded`);
    } else {
      console.log(`ℹ️  Services already seeded (${count} found)`);
    }

    // Working Hours
    const whCount = await WorkingHours.countDocuments();
    if (whCount === 0) {
      await WorkingHours.insertMany(WORKING_HOURS);
      console.log('✅ Working hours seeded');
    } else {
      console.log('ℹ️  Working hours already exist');
    }

    console.log('\n🎉 Seed complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
}

seed();
