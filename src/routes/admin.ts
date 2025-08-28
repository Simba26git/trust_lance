import { Router } from 'express'

const router = Router()

// Admin routes placeholder
router.get('/stats', (req, res) => {
  res.json({ message: 'Admin stats endpoint' })
})

export default router
