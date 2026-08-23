import api from './api'

export const paymentService = {
  calculateFare: async (bookingId) => {
    const { data } = await api.post('/payments/calculate-fare', { bookingId })
    return data.fareDetails
  },

  createOrder: async (bookingId) => {
    const { data } = await api.post('/payments/create-order', { bookingId })
    return data
  },

  verifyPayment: async (payload) => {
    const { data } = await api.post('/payments/verify', payload)
    return data
  },

  payWithWallet: async (bookingId) => {
    const { data } = await api.post('/payments/pay-wallet', { bookingId })
    return data
  },

  getWalletInfo: async () => {
    const { data } = await api.get('/payments/wallet')
    return data
  },

  topUpWallet: async (amount) => {
    const { data } = await api.post('/payments/wallet/top-up', { amount })
    return data
  },

  verifyWalletTopUp: async (payload) => {
    const { data } = await api.post('/payments/wallet/verify-top-up', payload)
    return data
  },

  getPaymentHistory: async (page = 1, limit = 10) => {
    const { data } = await api.get(`/payments/history?page=${page}&limit=${limit}`)
    return data
  }
}

export default paymentService
