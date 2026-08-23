import api from './api'

export const intelligenceService = {
  smartSearch: async (query) => {
    const { data } = await api.post('/rides/smart-search', { query })
    return data
  },

  getRecommendations: async () => {
    const { data } = await api.get('/rides/personalized/recommendations')
    return data
  }
}

export default intelligenceService
