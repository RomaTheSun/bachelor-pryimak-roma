const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const professionTestRoutes = require('./routes/professionTestRoutes');
const courseRoutes = require('./routes/courseRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', professionTestRoutes);
app.use('/api', courseRoutes);

// Welcome route
app.get('/', (req, res) => {
    res.send('Welcome to your Express App!');
});

module.exports = app;