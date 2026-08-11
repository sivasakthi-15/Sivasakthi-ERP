import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User, Role, Session } from '../models/erp-models';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middlewares/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'electrical_erp_secret_key_123';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'electrical_erp_refresh_key_456';

// Memory fallback database for offline operation when MongoDB is not connected
const memoryDb = {
  users: [
    {
      _id: 'mock_admin_id_123',
      name: 'Administrator (Offline Mode)',
      email: 'admin@electricalerp.com',
      passwordHash: '', // bypassed in offline mode
      phone: '9876543210',
      role: 'admin',
      branch: 'all',
      status: 'active',
      permittedBranches: ['sivasakthi_elec', 'meenatchi_pipes'],
      createdAt: new Date().toISOString()
    }
  ],
  roles: [
    {
      name: 'admin',
      label: 'Administrator',
      description: 'System admin with full management capabilities',
      permissions: {
        billing: { view: true, create: true, edit: true, delete: true, print: true, export: true },
        purchase: { view: true, create: true, edit: true, delete: true, print: true, export: true },
        inventory: { view: true, stockAdjustment: true, stockTransfer: true },
        reports: { view: true, export: true },
        accounting: { view: true, edit: true },
        settings: { fullControl: true }
      },
      isSystem: true
    },
    {
      name: 'owner',
      label: 'Business Owner',
      description: 'Full administrative controls & analytical overviews',
      permissions: {
        billing: { view: true, create: true, edit: true, delete: true, print: true, export: true },
        purchase: { view: true, create: true, edit: true, delete: true, print: true, export: true },
        inventory: { view: true, stockAdjustment: true, stockTransfer: true },
        reports: { view: true, export: true },
        accounting: { view: true, edit: true },
        settings: { fullControl: true }
      },
      isSystem: true
    }
  ],
  sessions: [] as any[]
};

// Helper to generate access and refresh tokens
const generateTokens = (user: any) => {
  const payload = {
    id: user._id,
    email: user.email,
    role: user.role,
    branch: user.branch,
    permittedBranches: user.permittedBranches || []
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });

  return { accessToken, refreshToken };
};

export const seedDefaultRolesAndAdmin = async () => {
  try {
    const rolesCount = await Role.countDocuments();
    if (rolesCount === 0) {
      logger.info('No roles found in MongoDB. Seeding default roles...');

      const defaultPermissions = {
        billing: { view: true, create: true, edit: true, delete: true, print: true, export: true },
        purchase: { view: true, create: true, edit: true, delete: true, print: true, export: true },
        inventory: { view: true, stockAdjustment: true, stockTransfer: true },
        reports: { view: true, export: true },
        accounting: { view: true, edit: true },
        settings: { fullControl: true }
      };

      const limitPermissions = {
        billing: { view: true, create: true, edit: false, delete: false, print: true, export: false },
        purchase: { view: true, create: false, edit: false, delete: false, print: false, export: false },
        inventory: { view: true, stockAdjustment: false, stockTransfer: false },
        reports: { view: false, export: false },
        accounting: { view: false, edit: false },
        settings: { fullControl: false }
      };

      await Role.create([
        {
          name: 'owner',
          label: 'Business Owner',
          description: 'Full administrative controls & analytical overviews',
          permissions: defaultPermissions,
          isSystem: true
        },
        {
          name: 'admin',
          label: 'Administrator',
          description: 'System admin with full management capabilities',
          permissions: defaultPermissions,
          isSystem: true
        },
        {
          name: 'manager',
          label: 'Store Manager',
          description: 'Manages sales, inventory, and purchases',
          permissions: {
            ...defaultPermissions,
            settings: { fullControl: false }
          },
          isSystem: true
        },
        {
          name: 'cashier',
          label: 'Cashier / POS Clerk',
          description: 'Quick billing checkout operations only',
          permissions: limitPermissions,
          isSystem: true
        },
        {
          name: 'accountant',
          label: 'Senior Accountant',
          description: 'Ledger reconciliations, journals, and GST reviews',
          permissions: {
            ...defaultPermissions,
            billing: { view: true, create: false, edit: false, delete: false, print: true, export: true },
            purchase: { view: true, create: false, edit: false, delete: false, print: true, export: true },
            inventory: { view: true, stockAdjustment: false, stockTransfer: false },
            settings: { fullControl: false }
          },
          isSystem: true
        }
      ]);
      logger.info('Default roles seeded successfully!');
    }

    const usersCount = await User.countDocuments();
    if (usersCount === 0) {
      logger.info('No users found in MongoDB. Seeding default administrator...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);

      await User.create({
        name: 'Administrator',
        email: 'admin@electricalerp.com',
        passwordHash: hashedPassword,
        phone: '9876543210',
        role: 'admin',
        branch: 'all',
        status: 'active',
        permittedBranches: ['sivasakthi_elec', 'meenatchi_pipes']
      });
      logger.info('Default admin user (admin@electricalerp.com / admin123) seeded successfully!');
    }
  } catch (error: any) {
    logger.error(`Error seeding initial auth data: ${error.message}`);
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    if (mongoose.connection.readyState !== 1) {
      logger.warn(`Offline fallback login: ${email}`);
      const fallbackUser = memoryDb.users.find(u => u.email === email) || memoryDb.users[0];
      const { accessToken, refreshToken } = generateTokens(fallbackUser);
      const roleConfig = memoryDb.roles.find(r => r.name === fallbackUser.role) || memoryDb.roles[0];
      res.json({
        success: true,
        user: {
          id: fallbackUser._id,
          name: fallbackUser.name,
          email: fallbackUser.email,
          phone: fallbackUser.phone,
          role: fallbackUser.role,
          branch: fallbackUser.branch,
          permittedBranches: fallbackUser.permittedBranches,
          permissions: roleConfig ? roleConfig.permissions : {}
        },
        accessToken,
        refreshToken
      });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    if (user.status === 'inactive') {
      res.status(403).json({ error: 'Your account is currently inactive. Contact administrator' });
      return;
    }

    // Check account lockout
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      res.status(423).json({ error: `Account is locked. Try again after ${user.lockedUntil}` });
      return;
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      const attempts = (user.failedAttempts || 0) + 1;
      let lockedUntil = undefined;
      
      if (attempts >= 5) {
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // lock 15 mins
        logger.warn(`User ${email} locked due to 5 consecutive login failures`);
      }

      await User.updateOne({ _id: user._id }, { failedAttempts: attempts, lockedUntil });
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Success login: reset attempts
    await User.updateOne({ _id: user._id }, { failedAttempts: 0, lockedUntil: null, lastLogin: new Date() });

    const { accessToken, refreshToken } = generateTokens(user);

    // Save session
    await Session.create({
      userId: user._id,
      userName: user.name,
      email: user.email,
      role: user.role,
      branch: user.branch,
      ipAddress: req.ip || req.headers['x-forwarded-for'] as string,
      device: req.headers['user-agent'] || 'Unknown Device',
      isActive: true,
      refreshToken
    });

    const roleConfig = await Role.findOne({ name: user.role });

    res.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        branch: user.branch,
        photo: user.photo,
        permittedBranches: user.permittedBranches,
        permissions: roleConfig ? roleConfig.permissions : {}
      },
      accessToken,
      refreshToken
    });
  } catch (error: any) {
    logger.error(`Login controller error: ${error.message}`);
    res.status(500).json({ error: 'Internal server error during login' });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (mongoose.connection.readyState !== 1) {
      res.json({ success: true, message: 'Logged out successfully (Offline)' });
      return;
    }
    if (refreshToken) {
      await Session.updateOne({ refreshToken }, { isActive: false });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error: any) {
    logger.error(`Logout controller error: ${error.message}`);
    res.status(500).json({ error: 'Internal server error during logout' });
  }
};

export const getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (mongoose.connection.readyState !== 1) {
      const fallbackUser = memoryDb.users.find(u => u._id === req.user?.id) || memoryDb.users[0];
      const roleConfig = memoryDb.roles.find(r => r.name === fallbackUser.role) || memoryDb.roles[0];
      res.json({
        id: fallbackUser._id,
        name: fallbackUser.name,
        email: fallbackUser.email,
        phone: fallbackUser.phone,
        role: fallbackUser.role,
        branch: fallbackUser.branch,
        permittedBranches: fallbackUser.permittedBranches,
        permissions: roleConfig ? roleConfig.permissions : {}
      });
      return;
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({ error: 'User profile not found' });
      return;
    }

    const roleConfig = await Role.findOne({ name: user.role });

    res.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      branch: user.branch,
      photo: user.photo,
      permittedBranches: user.permittedBranches,
      permissions: roleConfig ? roleConfig.permissions : {}
    });
  } catch (error: any) {
    logger.error(`Profile retrieval error: ${error.message}`);
    res.status(500).json({ error: 'Internal server error fetching profile' });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;
    if (!token) {
      res.status(400).json({ error: 'Refresh token is required' });
      return;
    }

    if (mongoose.connection.readyState !== 1) {
      jwt.verify(token, JWT_REFRESH_SECRET, (err: any, decoded: any) => {
        if (err) {
          res.status(403).json({ error: 'Refresh token expired' });
          return;
        }
        const fallbackUser = memoryDb.users.find(u => u._id === decoded.id) || memoryDb.users[0];
        const tokens = generateTokens(fallbackUser);
        res.json({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken
        });
      });
      return;
    }

    const session = await Session.findOne({ refreshToken: token, isActive: true });
    if (!session) {
      res.status(403).json({ error: 'Invalid or deactivated session refresh token' });
      return;
    }

    jwt.verify(token, JWT_REFRESH_SECRET, async (err: any, decoded: any) => {
      if (err) {
        res.status(403).json({ error: 'Refresh token expired' });
        return;
      }

      const user = await User.findById(decoded.id);
      if (!user || user.status === 'inactive') {
        res.status(403).json({ error: 'User is suspended or deleted' });
        return;
      }

      const tokens = generateTokens(user);
      await Session.updateOne({ _id: session._id }, { refreshToken: tokens.refreshToken });

      res.json({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      });
    });
  } catch (error: any) {
    logger.error(`Refresh token error: ${error.message}`);
    res.status(500).json({ error: 'Internal server error during token refresh' });
  }
};

// ------------------------------------------------------------------
// Admin operations on Users & Custom Roles
// ------------------------------------------------------------------

export const listUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.json(memoryDb.users.map(({ passwordHash, ...u }) => u));
      return;
    }
    const users = await User.find({}, '-passwordHash');
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to list users' });
  }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, phone, role, branch, password, permittedBranches } = req.body;

    if (mongoose.connection.readyState !== 1) {
      const existing = memoryDb.users.find(u => u.email === email);
      if (existing) {
        res.status(400).json({ error: 'User with this email already exists' });
        return;
      }
      const newUser = {
        _id: 'mock_user_' + Math.random().toString(36).substr(2, 9),
        name,
        email,
        phone,
        role,
        branch,
        passwordHash: '',
        status: 'active',
        permittedBranches: permittedBranches || [branch],
        createdAt: new Date().toISOString()
      };
      memoryDb.users.push(newUser);
      res.status(201).json({
        success: true,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          role: newUser.role,
          branch: newUser.branch
        }
      });
      return;
    }

    const existing = await User.findOne({ email });
    if (existing) {
      res.status(400).json({ error: 'User with this email already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password || 'password123', salt);

    const newUser = await User.create({
      name,
      email,
      phone,
      role,
      branch,
      passwordHash,
      status: 'active',
      permittedBranches: permittedBranches || [branch]
    });

    res.status(201).json({
      success: true,
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        branch: newUser.branch
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: `Failed to create user: ${error.message}` });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (mongoose.connection.readyState !== 1) {
      const index = memoryDb.users.findIndex(u => u._id === id);
      if (index === -1) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      memoryDb.users[index] = { ...memoryDb.users[index], ...updates };
      res.json({ success: true, message: 'User updated successfully (Offline)' });
      return;
    }

    if (updates.password) {
      const salt = await bcrypt.genSalt(10);
      updates.passwordHash = await bcrypt.hash(updates.password, salt);
      delete updates.password;
    }

    const updated = await User.findByIdAndUpdate(id, updates, { new: true });
    if (!updated) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ success: true, message: 'User updated successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update user' });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState !== 1) {
      const index = memoryDb.users.findIndex(u => u._id === id);
      if (index === -1) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      memoryDb.users.splice(index, 1);
      res.json({ success: true, message: 'User deleted successfully (Offline)' });
      return;
    }

    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    await Session.deleteMany({ userId: id });
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// Custom Roles CRUD
export const listRoles = async (req: Request, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.json(memoryDb.roles);
      return;
    }
    const roles = await Role.find();
    res.json(roles);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
};

export const createRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, label, description, permissions } = req.body;

    if (mongoose.connection.readyState !== 1) {
      const existing = memoryDb.roles.find(r => r.name === name);
      if (existing) {
        res.status(400).json({ error: 'Role already exists' });
        return;
      }
      const newRole = { name, label, description, permissions, isSystem: false };
      memoryDb.roles.push(newRole);
      res.status(201).json(newRole);
      return;
    }

    const existing = await Role.findOne({ name });
    if (existing) {
      res.status(400).json({ error: 'Role already exists' });
      return;
    }

    const newRole = await Role.create({ name, label, description, permissions, isSystem: false });
    res.status(201).json(newRole);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create role' });
  }
};

export const updateRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.params;
    const { permissions, description, label } = req.body;

    if (mongoose.connection.readyState !== 1) {
      const index = memoryDb.roles.findIndex(r => r.name === name);
      if (index === -1) {
        res.status(404).json({ error: 'Role not found' });
        return;
      }
      memoryDb.roles[index] = { ...memoryDb.roles[index], permissions, description, label };
      res.json(memoryDb.roles[index]);
      return;
    }

    const updated = await Role.findOneAndUpdate({ name }, { permissions, description, label }, { new: true });
    if (!updated) {
      res.status(404).json({ error: 'Role not found' });
      return;
    }

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update role' });
  }
};

export const deleteRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.params;

    if (mongoose.connection.readyState !== 1) {
      const role = memoryDb.roles.find(r => r.name === name);
      if (role?.isSystem) {
        res.status(400).json({ error: 'System roles cannot be deleted' });
        return;
      }
      const index = memoryDb.roles.findIndex(r => r.name === name);
      if (index === -1) {
        res.status(404).json({ error: 'Role not found' });
        return;
      }
      memoryDb.roles.splice(index, 1);
      res.json({ success: true, message: 'Role deleted successfully (Offline)' });
      return;
    }

    const role = await Role.findOne({ name });
    if (role?.isSystem) {
      res.status(400).json({ error: 'System roles cannot be deleted' });
      return;
    }

    await Role.findOneAndDelete({ name });
    res.json({ success: true, message: 'Role deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete role' });
  }
};
