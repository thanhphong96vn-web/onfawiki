// MongoDB connection utility
const { MongoClient } = require('mongodb');

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is not set in environment variables');
  // Không throw error ngay, để API có thể trả về error message rõ ràng hơn
}

const uri = process.env.MONGODB_URI;
const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  retryWrites: true,
  w: 'majority'
};

let client;
let clientPromise;

if (!uri) {
  // Nếu không có URI, tạo một promise reject để API có thể handle
  clientPromise = Promise.reject(new Error('MONGODB_URI is not configured'));
} else if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

module.exports = clientPromise;

