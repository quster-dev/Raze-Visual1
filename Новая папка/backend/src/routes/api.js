import { Router } from 'express';
import { getContent } from '../controllers/contentController.js';
import { submitContact, listMessages } from '../controllers/contactController.js';
import { subscribe } from '../controllers/newsletterController.js';
import { getPage, listPages } from '../controllers/pagesController.js';
import { login, me, register, updateProfileController } from '../controllers/authController.js';
import { authRequired, adminRequired } from '../middleware/auth.js';
import {
  adminGrantSubscription,
  adminOverview,
  adminPlans,
  adminResetPassword,
  adminRevokeSubscription,
  adminSetStatus,
  adminUserDetails,
  adminUsers
} from '../controllers/adminController.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'maven-backend', timestamp: new Date().toISOString() });
});

router.get('/content', getContent);
router.get('/pages', listPages);
router.get('/pages/:slug', getPage);

router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', authRequired, me);
router.patch('/auth/profile', authRequired, updateProfileController);

router.get('/admin/overview', authRequired, adminRequired, adminOverview);
router.get('/admin/plans', authRequired, adminRequired, adminPlans);
router.get('/admin/users', authRequired, adminRequired, adminUsers);
router.get('/admin/users/:userId', authRequired, adminRequired, adminUserDetails);
router.patch('/admin/users/:userId/status', authRequired, adminRequired, adminSetStatus);
router.patch('/admin/users/:userId/password', authRequired, adminRequired, adminResetPassword);
router.post('/admin/users/:userId/subscriptions', authRequired, adminRequired, adminGrantSubscription);
router.delete('/admin/users/:userId/subscriptions/:subscriptionId', authRequired, adminRequired, adminRevokeSubscription);

router.post('/contact', submitContact);
router.get('/contact', listMessages);
router.post('/newsletter', subscribe);

export default router;
