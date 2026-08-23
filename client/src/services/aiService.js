import api from './api';

export const aiService = {
  chat: async (message, context = {}) => {
    const { data } = await api.post('/ai/chat', { message, context });
    return data;
  }
};

export default aiService;
