// The full code will be provided in the next message due to length.
import React, { useState } from "react";
import { Link } from "react-router-dom";
import CommonSelect from "../common/commonSelect";
import CommonTagsInput from "../common/Taginput";
import ImageWithBasePath from "../common/imageWithBasePath";
import { useUser, useAuth } from "@clerk/clerk-react";

// --- Option arrays ---
const owner = [
  { value: "Select", label: "Select" },
  { value: "Hendry Milner", label: "Hendry Milner" },
  { value: "Guilory Berggren", label: "Guilory Berggren" },
  { value: "Jami Carlile", label: "Jami Carlile" },
];
const dealsChoose = [
  { value: "Select", label: "Select" },
  { value: "Collins", label: "Collins" },
  { value: "Konopelski", label: "Konopelski" },
  { value: "Adams", label: "Adams" },
];
const industryChoose = [
  { value: "Select", label: "Select" },
  { value: "Retail Industry", label: "Retail Industry" },
  { value: "Banking", label: "Banking" },
  { value: "Hotels", label: "Hotels" },
  { value: "Financial Services", label: "Financial Services" },
  { value: "Insurance", label: "Insurance" },
];
const sourcesChoose = [
  { value: "Select", label: "Select" },
  { value: "Phone Calls", label: "Phone Calls" },
  { value: "Social Media", label: "Social Media" },
  { value: "Refferal Sites", label: "Refferal Sites" },
  { value: "Web Analytics", label: "Web Analytics" },
  { value: "Previous Purchase", label: "Previous Purchase" },
];
const currencyChoose = [
  { value: "Select", label: "Select" },
  { value: "USD", label: "USD" },
  { value: "Euro", label: "Euro" },
];
const languageChoose = [
  { value: "Select", label: "Select" },
  { value: "English", label: "English" },
  { value: "Arabic", label: "Arabic " },
];
const countryChoose = [
  { value: "Select", label: "Select" },
  { value: "USA", label: "USA" },
  { value: "Canada", label: "Canada" },
  { value: "Germany", label: "Germany" },
  { value: "France", label: "France" },
];
const stateChoose = [
  { value: "Select", label: "Select" },
  { value: "California", label: "California" },
  { value: "New York", label: "New York" },
  { value: "Texas", label: "Texas" },
  { value: "Florida", label: "Florida" },
];
const cityChoose = [
  { value: "Select", label: "Select" },
  { value: "Los Angeles", label: "Los Angeles" },
  { value: "San Diego", label: "San Diego" },
  { value: "Fresno", label: "Fresno" },
  { value: "San Francisco", label: "San Francisco" },
];
const status = [
  { value: "Select", label: "Select" },
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

const AddContact = () => {
  const API_BASE_URL =
    (typeof import.meta !== "undefined" && (import.meta as any).env?.REACT_APP_BACKEND_URL) ||
    (typeof window !== "undefined" && (window as any).REACT_APP_BACKEND_URL) ||
    "http://localhost:5000";
  const { getToken } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    phone2: "",
    fax: "",
    address: "",
    rating: "",
    ownerName: "",
    website: "",
    industry: "",
    source: "",
    currency: "",
    language: "",
    about: "",
    country: "",
    state: "",
    city: "",
    zipcode: "",
    facebook: "",
    twitter: "",
    linkedin: "",
    skype: "",
    whatsapp: "",
    instagram: "",
    status: "Active",
  });
  const [tags, setTags] = useState<string[]>([]);
  const [deals, setDeals] = useState<string[]>([]);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [errors, setErrors] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev: any) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev: any) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: any = {};
    if (!formData.name.trim()) newErrors.name = "Company name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    // else if (!/^[^\s@]+@[^\s@]+\\.[^\s@]+$/.test(formData.email)) newErrors.email = "Please enter a valid email address";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!formData.industry) newErrors.industry = "Industry is required";
    if (!formData.source) newErrors.source = "Source is required";
    if (!formData.currency) newErrors.currency = "Currency is required";
    if (!formData.language) newErrors.language = "Language is required";
    if (!formData.country) newErrors.country = "Country is required";
    if (!formData.state) newErrors.state = "State is required";
    if (!formData.city) newErrors.city = "City is required";
    if (!formData.zipcode.trim()) newErrors.zipcode = "Zip code is required";
    if (!formData.about.trim()) newErrors.about = "About is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const token = await getToken();
      // Split name into firstName and lastName for backend compatibility
      const [firstName, ...lastArr] = formData.name.trim().split(" ");
      const lastName = lastArr.join(" ");
      const payload = {
        ...formData,
        firstName,
        lastName,
        rating: Number(formData.rating) || 0,
        tags,
        deals,
        address: {
          street: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipcode,
          country: formData.country,
          fullAddress: `${formData.address}, ${formData.city}, ${formData.state} ${formData.zipcode}, ${formData.country}`,
        },
        socialLinks: {
          facebook: formData.facebook,
          twitter: formData.twitter,
          linkedin: formData.linkedin,
          skype: formData.skype,
          whatsapp: formData.whatsapp,
          instagram: formData.instagram,
        },
        image: imageBase64 ? "uploaded.png" : "contact-01.svg",
      };
      const response = await fetch(`${API_BASE_URL}/api/contacts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (result.done) {
        setFormData({
          name: "",
          email: "",
          phone: "",
          phone2: "",
          fax: "",
          address: "",
          rating: "",
          ownerName: "",
          website: "",
          industry: "",
          source: "",
          currency: "",
          language: "",
          about: "",
          country: "",
          state: "",
          city: "",
          zipcode: "",
          facebook: "",
          twitter: "",
          linkedin: "",
          skype: "",
          whatsapp: "",
          instagram: "",
          status: "Active",
        });
        setTags([]);
        setDeals([]);
        setImageBase64(null);
        setErrors({});
        // Close modal
        const modal = document.getElementById('add_contact');
        if (modal) {
          const modalInstance = (window as any).bootstrap?.Modal?.getInstance(modal);
          if (modalInstance) modalInstance.hide();
        }
  window.dispatchEvent(new CustomEvent('contacts:changed'));
      } else {
  // Optionally handle error UI here (e.g., set error state)
      }
    } catch (error) {
  // Optionally handle error UI here (e.g., set error state)
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="modal fade" id="add_contact">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Add New Contact</h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
              <div className="modal-body pb-0 ">
                <div className="row">
                  {/* contact Name */}
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Contact Name <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                      />
                      {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                    </div>
                  </div>
                  {/* Email */}
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Email <span className="text-danger">*</span></label>
                      <input
                        type="email"
                        className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                      />
                      {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                    </div>
                  </div>
                  {/* Phone */}
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Phone Number <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                      />
                      {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
                    </div>
                  </div>
                  {/* Phone2 */}
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Phone Number 2</label>
                      <input type="text" className="form-control" name="phone2" value={formData.phone2} onChange={handleChange} />
                    </div>
                  </div>
                  {/* Fax */}
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Fax</label>
                      <input type="text" className="form-control" name="fax" value={formData.fax} onChange={handleChange} />
                    </div>
                  </div>
                  {/* Website */}
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Website</label>
                      <input type="text" className="form-control" name="website" value={formData.website} onChange={handleChange} />
                    </div>
                  </div>
                  {/* Rating */}
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Ratings</label>
                      <input type="text" className="form-control" name="rating" value={formData.rating} onChange={handleChange} />
                    </div>
                  </div>
                  {/* Owner */}
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Owner</label>
                      <CommonSelect
                        className="select"
                        options={owner}
                        defaultValue={owner.find(o => o.value === formData.ownerName) || owner[0]}
                        onChange={opt => handleSelectChange("ownerName", opt?.value || "")}
                      />
                    </div>
                  </div>
                  {/* Tags */}
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Tags</label>
                      <CommonTagsInput
                        value={tags}
                        onChange={setTags}
                        placeholder="Add New"
                        className="custom-input-class"
                      />
                    </div>
                  </div>
                  {/* Deals */}
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Deals</label>
                      <CommonSelect
                        className="select"
                        options={dealsChoose}
                        defaultValue={dealsChoose.find(d => deals.includes(d.value)) || dealsChoose[0]}
                        onChange={opt => setDeals(opt ? [opt.value] : [])}
                      />
                    </div>
                  </div>
                  {/* Industry */}
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Industry <span className="text-danger">*</span></label>
                      <CommonSelect
                        className="select"
                        options={industryChoose}
                        defaultValue={industryChoose.find(i => i.value === formData.industry) || industryChoose[0]}
                        onChange={opt => handleSelectChange("industry", opt?.value || "")}
                      />
                      {errors.industry && <div className="invalid-feedback d-block">{errors.industry}</div>}
                    </div>
                  </div>
                  {/* Source */}
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Source <span className="text-danger">*</span></label>
                      <CommonSelect
                        className="select"
                        options={sourcesChoose}
                        defaultValue={sourcesChoose.find(s => s.value === formData.source) || sourcesChoose[0]}
                        onChange={opt => handleSelectChange("source", opt?.value || "")}
                      />
                      {errors.source && <div className="invalid-feedback d-block">{errors.source}</div>}
                    </div>
                  </div>
                  {/* Currency */}
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Currency <span className="text-danger">*</span></label>
                      <CommonSelect
                        className="select"
                        options={currencyChoose}
                        defaultValue={currencyChoose.find(c => c.value === formData.currency) || currencyChoose[0]}
                        onChange={opt => handleSelectChange("currency", opt?.value || "")}
                      />
                      {errors.currency && <div className="invalid-feedback d-block">{errors.currency}</div>}
                    </div>
                  </div>
                  {/* Language */}
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Language <span className="text-danger">*</span></label>
                      <CommonSelect
                        className="select"
                        options={languageChoose}
                        defaultValue={languageChoose.find(l => l.value === formData.language) || languageChoose[0]}
                        onChange={opt => handleSelectChange("language", opt?.value || "")}
                      />
                      {errors.language && <div className="invalid-feedback d-block">{errors.language}</div>}
                    </div>
                  </div>
                  {/* Country */}
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Country <span className="text-danger">*</span></label>
                      <CommonSelect
                        className="select"
                        options={countryChoose}
                        defaultValue={countryChoose.find(c => c.value === formData.country) || countryChoose[0]}
                        onChange={opt => handleSelectChange("country", opt?.value || "")}
                      />
                      {errors.country && <div className="invalid-feedback d-block">{errors.country}</div>}
                    </div>
                  </div>
                  {/* State */}
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">State <span className="text-danger">*</span></label>
                      <CommonSelect
                        className="select"
                        options={stateChoose}
                        defaultValue={stateChoose.find(s => s.value === formData.state) || stateChoose[0]}
                        onChange={opt => handleSelectChange("state", opt?.value || "")}
                      />
                      {errors.state && <div className="invalid-feedback d-block">{errors.state}</div>}
                    </div>
                  </div>
                  {/* City */}
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">City <span className="text-danger">*</span></label>
                      <CommonSelect
                        className="select"
                        options={cityChoose}
                        defaultValue={cityChoose.find(c => c.value === formData.city) || cityChoose[0]}
                        onChange={opt => handleSelectChange("city", opt?.value || "")}
                      />
                      {errors.city && <div className="invalid-feedback d-block">{errors.city}</div>}
                    </div>
                  </div>
                  {/* Zipcode */}
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Zipcode <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className={`form-control ${errors.zipcode ? 'is-invalid' : ''}`}
                        name="zipcode"
                        value={formData.zipcode}
                        onChange={handleChange}
                      />
                      {errors.zipcode && <div className="invalid-feedback">{errors.zipcode}</div>}
                    </div>
                  </div>
                  {/* About */}
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">About <span className="text-danger">*</span></label>
                      <textarea
                        className={`form-control ${errors.about ? 'is-invalid' : ''}`}
                        name="about"
                        value={formData.about}
                        onChange={handleChange}
                      />
                      {errors.about && <div className="invalid-feedback">{errors.about}</div>}
                    </div>
                  </div>
                  {/* Social Links */}
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Facebook</label>
                      <input type="text" className="form-control" name="facebook" value={formData.facebook} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Twitter</label>
                      <input type="text" className="form-control" name="twitter" value={formData.twitter} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">LinkedIn</label>
                      <input type="text" className="form-control" name="linkedin" value={formData.linkedin} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Skype</label>
                      <input type="text" className="form-control" name="skype" value={formData.skype} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Whatsapp</label>
                      <input type="text" className="form-control" name="whatsapp" value={formData.whatsapp} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Instagram</label>
                      <input type="text" className="form-control" name="instagram" value={formData.instagram} onChange={handleChange} />
                    </div>
                  </div>
                  {/* Status */}
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Status</label>
                      <CommonSelect
                        className="select"
                        options={status}
                        defaultValue={status.find(s => s.value === formData.status) || status[1]}
                        onChange={opt => handleSelectChange("status", opt?.value || "Active")}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light me-2"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddContact;