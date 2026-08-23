import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUserPlus, FaTrash, FaStar, FaEdit, FaTimes, FaShieldAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';
import GlassCard from '../components/ui/GlassCard';
import AnimatedButton from '../components/ui/AnimatedButton';
import safetyService from '../services/safetyService';

const EmergencyContacts = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    relationship: '',
    isPrimary: false,
    autoShare: false
  });

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const data = await safetyService.getContacts();
      setContacts(data.contacts || []);
    } catch (error) {
      toast.error('Failed to load emergency contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.phone || !formData.relationship) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!/^[0-9]{10}$/.test(formData.phone)) {
      toast.error('Phone number must be exactly 10 digits');
      return;
    }

    try {
      if (isEditing) {
        await safetyService.updateContact(currentId, formData);
        toast.success('Emergency contact updated successfully');
      } else {
        await safetyService.addContact(formData);
        toast.success('Emergency contact added successfully');
      }
      resetForm();
      fetchContacts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    }
  };

  const handleEdit = (contact) => {
    setIsEditing(true);
    setCurrentId(contact._id);
    setFormData({
      name: contact.name,
      phone: contact.phone,
      relationship: contact.relationship,
      isPrimary: contact.isPrimary,
      autoShare: contact.autoShare
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this contact?')) return;
    try {
      await safetyService.deleteContact(id);
      toast.success('Emergency contact deleted');
      fetchContacts();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData({
      name: '',
      phone: '',
      relationship: '',
      isPrimary: false,
      autoShare: false
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3.5"
      >
        <div className="w-10 h-10 bg-primary-500/10 border border-primary-500/20 text-primary-400 rounded-xl flex items-center justify-center text-lg">
          <FaShieldAlt />
        </div>
        <div>
          <h1 className="text-3xl font-black font-display text-white tracking-tight">
            Emergency Contacts 🛡️
          </h1>
          <p className="text-gray-400 text-sm font-medium mt-1">Configure trusted safety partners to automatically share your locations or receive SOS alerts.</p>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-5 gap-8 items-start">
        {/* Form Column */}
        <div className="md:col-span-2">
          <GlassCard hoverable={false} className="border-white/5 bg-dark-900/40 p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {isEditing ? '✏️ Edit Contact' : '➕ Add Safety Contact'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Jane Doe"
                  className="input-field bg-dark-950/80 text-sm py-2.5"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="10 digit number"
                  className="input-field bg-dark-950/80 text-sm py-2.5"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Relationship</label>
                <select
                  name="relationship"
                  value={formData.relationship}
                  onChange={handleInputChange}
                  className="input-field bg-dark-950/80 text-xs py-2.5 cursor-pointer"
                >
                  <option value="">Select option</option>
                  <option value="Parent">Parent</option>
                  <option value="Spouse">Spouse / Partner</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Friend">Friend</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="isPrimary"
                    checked={formData.isPrimary}
                    onChange={handleInputChange}
                    className="w-4 h-4 rounded border-white/10 bg-dark-950 text-primary-500 focus:ring-primary-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-300">Set as Primary Contact</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="autoShare"
                    checked={formData.autoShare}
                    onChange={handleInputChange}
                    className="w-4 h-4 rounded border-white/10 bg-dark-950 text-primary-500 focus:ring-primary-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-300">Auto-share active trips</span>
                </label>
              </div>

              <div className="flex gap-3.5 pt-3">
                <AnimatedButton type="submit" variant="primary" className="flex-1 py-2.5 text-xs font-bold uppercase tracking-wider">
                  {isEditing ? 'Save Details' : 'Save Contact'}
                </AnimatedButton>
                
                {isEditing && (
                  <AnimatedButton type="button" variant="secondary" onClick={resetForm} className="py-2.5 px-3 text-xs">
                    <FaTimes />
                  </AnimatedButton>
                )}
              </div>
            </form>
          </GlassCard>
        </div>

        {/* List Column */}
        <div className="md:col-span-3 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            🛡️ Configured Contacts ({contacts.length})
          </h3>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : contacts.length === 0 ? (
            <GlassCard hoverable={false} className="border-white/5 bg-dark-900/40 p-12 text-center text-gray-400 space-y-2">
              <p className="font-bold text-sm">No Emergency Contacts Registered</p>
              <p className="text-xs">Add a contact on the left to secure your journeys.</p>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {contacts.map((contact) => (
                <GlassCard key={contact._id} hoverable={false} className="border-white/5 bg-dark-900/40 p-5 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-white font-bold text-sm">{contact.name}</h4>
                      <span className="px-2 py-0.5 bg-white/5 text-[8px] font-black uppercase text-gray-400 border border-white/5 rounded-full">
                        {contact.relationship}
                      </span>
                      {contact.isPrimary && (
                        <span className="px-2 py-0.5 bg-primary-500/10 border border-primary-500/20 text-primary-400 text-[8px] font-black uppercase rounded-full flex items-center gap-0.5">
                          <FaStar className="text-[7px]" /> Primary
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-xs font-semibold">{contact.phone}</p>
                    {contact.autoShare && (
                      <p className="text-[9px] text-green-400 font-bold uppercase tracking-wider">
                        ✓ Auto-shares active trip routes
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(contact)}
                      className="p-2.5 bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 text-gray-300 rounded-xl transition-all cursor-pointer text-xs"
                      title="Edit contact"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(contact._id)}
                      className="p-2.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 rounded-xl transition-all cursor-pointer text-xs"
                      title="Delete contact"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmergencyContacts;
