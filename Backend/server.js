import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import loginRouter from './routes/login.js';
import itemRouter from './routes/item.js';
import storeRouter from './routes/store.js';
//import requiredRouter from './routes/required_qty.js';
import signinRouter from './routes/signin.js';

import { authenticateToken } from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/item', authenticateToken, itemRouter);  // used for protected api call
app.use('/store', authenticateToken, storeRouter);
//app.use('/reqqty', authenticateToken, requiredRouter);

app.use("/login",loginRouter);  // used for unprotected api call
app.use("/signin",signinRouter);

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running successfully',
    timestamp: new Date().toISOString()
  });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📌 API available at http://localhost:${PORT}`);
});