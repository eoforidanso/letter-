const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../middleware/auth');

// Register user
exports.register = (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  // Validation
  if (!email || !password || !firstName) {
    return res.status(400).json({ message: 'Email, password, and firstName are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  // Hash password
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      return res.status(500).json({ message: 'Server error' });
    }

    // Insert user into database
    db.run(
      `INSERT INTO users (email, password, firstName, lastName) VALUES (?, ?, ?, ?)`,
      [email, hashedPassword, firstName, lastName],
      (err) => {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ message: 'Email already registered' });
          }
          return res.status(500).json({ message: 'Server error' });
        }

        // Get the new user
        db.get(
          `SELECT id, email, firstName, lastName FROM users WHERE email = ?`,
          [email],
          (err, user) => {
            if (err) {
              return res.status(500).json({ message: 'Server error' });
            }

            const token = generateToken(user);
            res.status(201).json({
              message: 'User registered successfully',
              token,
              user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
              }
            });
          }
        );
      }
    );
  });
};

// Login user
exports.login = (req, res) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  // Find user
  db.get(
    `SELECT * FROM users WHERE email = ?`,
    [email],
    (err, user) => {
      if (err) {
        return res.status(500).json({ message: 'Server error' });
      }

      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Compare passwords
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) {
          return res.status(500).json({ message: 'Server error' });
        }

        if (!isMatch) {
          return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = generateToken(user);
        res.json({
          message: 'Login successful',
          token,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName
          }
        });
      });
    }
  );
};

// Get user profile
exports.getProfile = (req, res) => {
  db.get(
    `SELECT id, email, firstName, lastName, createdAt FROM users WHERE id = ?`,
    [req.user.id],
    (err, user) => {
      if (err) {
        return res.status(500).json({ message: 'Server error' });
      }

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(user);
    }
  );
};

// Update user profile
exports.updateProfile = (req, res) => {
  const { firstName, lastName } = req.body;

  db.run(
    `UPDATE users SET firstName = ?, lastName = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
    [firstName, lastName, req.user.id],
    (err) => {
      if (err) {
        return res.status(500).json({ message: 'Server error' });
      }

      // Get updated user
      db.get(
        `SELECT id, email, firstName, lastName FROM users WHERE id = ?`,
        [req.user.id],
        (err, user) => {
          if (err) {
            return res.status(500).json({ message: 'Server error' });
          }

          res.json({
            message: 'Profile updated successfully',
            user
          });
        }
      );
    }
  );
};
