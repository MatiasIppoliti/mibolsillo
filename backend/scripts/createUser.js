require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../src/models/User');

async function createUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if user already exists
    const existingUser = await User.findOne({ email: 'matiasippoliti@gmail.com' });
    if (existingUser) {
      console.log('User already exists:', existingUser.email);
      await mongoose.connection.close();
      return;
    }

    // Create new user
    const user = new User({
      email: 'matiasippoliti@gmail.com',
      password: 'mnfl853pa',
      name: 'Matias Ippoliti'
    });

    await user.save();
    console.log('User created successfully:', user.email);
    
    await mongoose.connection.close();
    console.log('Connection closed');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createUser();
