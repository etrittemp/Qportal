import axios from 'axios';

async function testLogin() {
  console.log('🔐 Testing login API via IPv6...\n');

  const credentials = { email: 'ilir.bicja@hape-kosovo.eu', password: 'Admin123!' };

  console.log(`Testing: ${credentials.email}`);
  try {
    const response = await axios.post('http://[::1]:3001/api/auth/login', credentials);
    console.log('✅ Login successful!');
    console.log('User:', response.data.user);
    console.log('Token:', response.data.token.substring(0, 20) + '...');
  } catch (error) {
    console.log('❌ Login failed');
    console.log('Error:', error.response?.data || error.message);
  }
}

testLogin();
