import { DatePicker } from 'antd';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CommonSelect from '../common/commonSelect';
import CommonTagsInput from '../common/Taginput';
import ImageWithBasePath from '../common/imageWithBasePath';
import { useAuth } from "@clerk/clerk-react";

const EditContact = () => {
  const API_BASE_URL =
    (typeof import.meta !== "undefined" && (import.meta as any).env?.REACT_APP_BACKEND_URL) ||
    (typeof window !== "undefined" && (window as any).REACT_APP_BACKEND_URL) ||
    "http://localhost:5000";
  const { getToken } = useAuth();
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [tags, setTags] = useState<string[]>([]);

  // Load contact data when modal opens
  useEffect(() => {
    const loadContactData = async () => {
      const contactId = (window as any).CURRENT_CONTACT_ID;
      const contactData = (window as any).CURRENT_CONTACT_DATA;

      if (contactData) {
        setForm({
          name: contactData.name || "",
          lastName: contactData.lastName || "",
          role: contactData.role || "",
          companyName: contactData.companyName || "",
          email: contactData.email || "",
          phone: contactData.phone || "",
          phone2: contactData.phone2 || "",
          fax: contactData.fax || "",
          deals: contactData.deals || "",
          birthday: contactData.birthday || "",
          rating: contactData.rating || "",
          owner: contactData.ownerName || "",
          industry: contactData.industry || "",
          currency: contactData.currency || "",
          language: contactData.language || "",
          source: contactData.source || "",
          address: contactData.address || "",
          country: contactData.country || "",
          state: contactData.state || "",
          city: contactData.city || "",
          zipcode: contactData.zipcode || "",
          facebook: contactData.socialLinks?.facebook || "",
          twitter: contactData.socialLinks?.twitter || "",
          linkedin: contactData.socialLinks?.linkedin || "",
          skype: contactData.socialLinks?.skype || "",
          whatsapp: contactData.socialLinks?.whatsapp || "",
          instagram: contactData.socialLinks?.instagram || "",
          status: contactData.status || "Active",
        });
        setTags(contactData.tags || []);
      } else if (contactId) {
        setLoading(true);
        try {
          const token = await getToken();
          const response = await fetch(`${API_BASE_URL}/api/contacts/${contactId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await response.json();
          if (data.done) {
            const contact = data.data;
            setForm({
              name: contact.name || "",
              lastName: contact.lastName || "",
              role: contact.role || "",
              companyName: contact.companyName || "",
              email: contact.email || "",
              phone: contact.phone || "",
              phone2: contact.phone2 || "",
              fax: contact.fax || "",
              deals: contact.deals || "",
              birthday: contact.birthday || "",
              rating: contact.rating || "",
              owner: contact.ownerName || "",
              industry: contact.industry || "",
              currency: contact.currency || "",
              language: contact.language || "",
              source: contact.source || "",
              address: contact.address || "",
              country: contact.country || "",
              state: contact.state || "",
              city: contact.city || "",
              zipcode: contact.zipcode || "",
              facebook: contact.socialLinks?.facebook || "",
              twitter: contact.socialLinks?.twitter || "",
              linkedin: contact.socialLinks?.linkedin || "",
              skype: contact.socialLinks?.skype || "",
              whatsapp: contact.socialLinks?.whatsapp || "",
              instagram: contact.socialLinks?.instagram || "",
              status: contact.status || "Active",
            });
            setTags(contact.tags || []);
          }
        } catch (error) {
          console.error('Error loading contact:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    const modal = document.getElementById('edit_contact');
    if (modal) {
      modal.addEventListener('shown.bs.modal', loadContactData);
      return () => {
        modal.removeEventListener('shown.bs.modal', loadContactData);
      };
    }
  }, [getToken, API_BASE_URL]);

  const onChange = (e: any) => {
    const { name, value } = e.target;
    setForm((p: any) => ({ ...p, [name]: value }));
    if (errors[name]) {
      setErrors((prev: any) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: any = {};
    if (!form.name?.trim()) newErrors.name = "Name is required";
    if (!form.email?.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!form.phone?.trim()) newErrors.phone = "Phone number is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSave = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const id = (window as any).CURRENT_CONTACT_ID;
      if (!id) return;
      const token = await getToken();
      const payload = {
        ...form,
        tags,
        socialLinks: {
          facebook: form.facebook || "",
          twitter: form.twitter || "",
          linkedin: form.linkedin || "",
          skype: form.skype || "",
          whatsapp: form.whatsapp || "",
          instagram: form.instagram || "",
        },
        rating: Number(form.rating) || 0,
      };
      const res = await fetch(`${API_BASE_URL}/api/contacts/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.done) {
        window.dispatchEvent(new CustomEvent('contacts:changed'));
        const modal = document.getElementById('edit_contact');
        if (modal) {
          const modalInstance = (window as any).bootstrap?.Modal?.getInstance(modal);
          if (modalInstance) modalInstance.hide();
        }
        alert('Contact updated successfully!');
      } else {
        alert(`Failed to update contact: ${data.error}`);
      }
    } catch (err) {
      console.error('edit contact error', err);
      alert('Error updating contact. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ...option arrays (companyName, dealsChoose, owner, etc.) can be reused from your current code...

  // The rest of the modal JSX structure is the same as your EditCompany, but with contact fields and onSave wired up.

  return (
    <>
      {/* Edit Contact */}
      <div className="modal fade" id="edit_contact">
        {/* ...modal dialog and content... */}
        <form>
          {/* ...tab navigation and content... */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-light me-2"
              data-bs-dismiss="modal"
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={onSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
      {/* /Edit Contact */}
    </>
  );
};

export default EditContact;