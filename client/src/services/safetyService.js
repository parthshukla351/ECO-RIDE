import api from './api';

export const safetyService = {
  // Emergency Contacts
  getContacts: async () => {
    const { data } = await api.get('/safety/contacts');
    return data;
  },

  addContact: async (contactData) => {
    const { data } = await api.post('/safety/contacts', contactData);
    return data;
  },

  updateContact: async (id, contactData) => {
    const { data } = await api.put(`/safety/contacts/${id}`, contactData);
    return data;
  },

  deleteContact: async (id) => {
    const { data } = await api.delete(`/safety/contacts/${id}`);
    return data;
  },

  // SOS Incidents
  triggerSOS: async (sosData) => {
    const { data } = await api.post('/safety/sos', sosData);
    return data;
  },

  resolveSOS: async (id, resolveData) => {
    const { data } = await api.put(`/safety/sos/${id}/resolve`, resolveData);
    return data;
  },

  getSOSIncidents: async () => {
    const { data } = await api.get('/safety/sos');
    return data;
  },

  // Live Tracking Sessions
  createShareSession: async (rideId) => {
    const { data } = await api.post('/safety/share', { rideId });
    return data;
  },

  getShareSessionDetails: async (token) => {
    const { data } = await api.get(`/safety/share/${token}`);
    return data;
  },

  revokeShareSession: async (token) => {
    const { data } = await api.put(`/safety/share/${token}/revoke`);
    return data;
  },

  // Verification Reviews
  submitVerification: async (verifyData) => {
    const { data } = await api.post('/safety/verify', verifyData);
    return data;
  },

  reviewVerification: async (userId, reviewData) => {
    const { data } = await api.put(`/safety/verify/${userId}`, reviewData);
    return data;
  }
};

export default safetyService;
