import React, { useState } from 'react';
import { User, Phone, MapPin, Mail, Home, Upload, Image as ImageIcon } from 'lucide-react';
import api from '../../api/client';

export const Step1_PersonalDetails = ({ data, updateData, onNext, applicationId }) => {
  const [formData, setFormData] = useState({
    firstName: data.personalData?.firstName || '',
    lastName: data.personalData?.lastName || '',
    email: data.email || '',
    phone: data.personalData?.phone || '',
    currentLocation: data.personalData?.currentLocation || '',
    preferredLocation: data.personalData?.preferredLocation || '',
    address: data.personalData?.address || '',
    profilePhoto: data.profilePhoto || ''
  });
  const [uploading, setUploading] = useState(false);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setFormData(prev => ({ ...prev, profilePhoto: uploadEvent.target.result }));
    };
    reader.readAsDataURL(file);

    try {
      setUploading(true);
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('fieldType', 'profilePhoto');
      
      const res = await api.post(`/applications/${applicationId}/upload`, uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setFormData(prev => ({ ...prev, profilePhoto: res.data.fileUrl }));
      }
    } catch (err) {
      console.error('Photo upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateData('personalData', formData);
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
        <div className="p-2.5 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400">
          <User className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">Personal Information</h3>
          <p className="text-xs text-slate-400">Provide accurate contact and residential details for identity matching.</p>
        </div>
      </div>

      {/* Profile Photo Upload */}
      <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-slate-900/50 border border-slate-800">
        <div className="relative group w-24 h-24 rounded-2xl overflow-hidden bg-slate-800 border-2 border-dashed border-slate-700 flex items-center justify-center flex-shrink-0">
          {formData.profilePhoto ? (
            <img src={formData.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center p-2">
              <ImageIcon className="w-6 h-6 text-slate-500 mx-auto" />
              <span className="text-[10px] text-slate-400 block mt-1">Add Photo</span>
            </div>
          )}
          <label className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity text-xs text-white font-medium">
            <Upload className="w-4 h-4 mr-1" />
            Upload
            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
          </label>
        </div>
        <div className="text-xs text-slate-400 space-y-1">
          <p className="font-semibold text-slate-200">Profile Photo Requirement</p>
          <p>Please upload a clear, front-facing passport style portrait. This will be cross-referenced with your biometric verification.</p>
          {uploading && <span className="text-blue-400 font-medium">Uploading photo...</span>}
        </div>
      </div>

      {/* Name fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">First Name *</label>
          <input
            type="text"
            required
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            placeholder="e.g. Alex"
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Last Name *</label>
          <input
            type="text"
            required
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            placeholder="e.g. Morgan"
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Email & Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Verified Email</label>
          <div className="relative">
            <input
              type="email"
              disabled
              value={formData.email}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 text-sm cursor-not-allowed"
            />
            <span className="absolute right-3 top-2.5 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
              Verified
            </span>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Phone Number *</label>
          <div className="relative">
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91 98765 43210"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Locations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Current Location *</label>
          <input
            type="text"
            required
            value={formData.currentLocation}
            onChange={(e) => setFormData({ ...formData, currentLocation: e.target.value })}
            placeholder="City, Country (e.g. Bengaluru, India)"
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Preferred Job Location *</label>
          <input
            type="text"
            required
            value={formData.preferredLocation}
            onChange={(e) => setFormData({ ...formData, preferredLocation: e.target.value })}
            placeholder="e.g. Bengaluru / Remote / Hybrid"
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Full Address */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Residential Address *</label>
        <textarea
          rows={2}
          required
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Flat / House No, Street, Landmark, Pin Code"
          className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
        />
      </div>

      {/* Submit button */}
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all"
        >
          Save & Continue to Job Details →
        </button>
      </div>
    </form>
  );
};

