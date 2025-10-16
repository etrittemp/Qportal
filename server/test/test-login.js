import axios from 'axios';

async function testLogin() {
  console.log('🔐 Testing login API...\n');

  const testCases = [
    { email: 'ilir.bicja@hape-kosovo.eu', password: 'Admin123!' },
    { email: 'admin@euda-portal.com', password: 'Admin123!' },
    { email: 'albert.avdiu@hape-kosovo.eu', password: 'Admin123!' },
  ];

  for (const credentials of testCases) {
    console.log(`Testing: ${credentials.email}`);
    try {
      const response = await axios.post('http://localhost:3001/api/auth/login', credentials);
      console.log('✅ Login successful!');
      console.log('User:', response.data.user);
      console.log('Token:', response.data.token.substring(0, 20) + '...');
    } catch (error) {
      console.log('❌ Login failed');
      console.log('Error:', error.response?.data || error.message);
    }
    console.log('---\n');
  }
}

testLogin();
