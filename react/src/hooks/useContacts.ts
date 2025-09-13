import { useEffect, useState, useCallback } from "react";

const API_BASE_URL =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.REACT_APP_BACKEND_URL) ||
  (typeof window !== "undefined" && (window as any).REACT_APP_BACKEND_URL) ||
  "http://localhost:5000";

const getAuthToken = async (): Promise<string | null> => {
  if (typeof window !== "undefined" && (window as any).Clerk) {
    return (window as any).Clerk.session?.getToken();
  }
  return null;
};

export interface ContactItem {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  rating?: number;
  ownerName?: string;
  image?: string;
  status?: string;
  address?: string;
  companyId?: string;
  companyName?: string;
  companyImage?: string;
  companyWebsite?: string;
  role?: string;
  gender?: string;
  birthday?: string;
  language?: string;
  currency?: string;
  source?: string;
  tags?: string[];
  about?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    skype?: string;
    whatsapp?: string;
    instagram?: string;
  };
  updatedAt?: string;
  createdAt?: string;
}

export const useContacts = () => {
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = useCallback(async (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  } = {}) => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      const query = new URLSearchParams();
      if (params.page) query.set("page", String(params.page));
      if (params.limit) query.set("limit", String(params.limit));
      if (params.search) query.set("search", params.search);
      if (params.status) query.set("status", params.status);
      if (params.sortBy) query.set("sortBy", params.sortBy);
      if (params.sortOrder) query.set("sortOrder", params.sortOrder);

      const res = await fetch(`${API_BASE_URL}/api/contacts?${query.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (!data.done) throw new Error(data.error || "Failed to fetch contacts");
      setContacts(data.data || []);
      setError(null);
      return data;
    } catch (e: any) {
      setError(e.message || "Failed to fetch contacts");
      return { done: false, error: e.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getContact = useCallback(async (id: string) => {
    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE_URL}/api/contacts/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (!data.done) throw new Error(data.error || "Failed to fetch contact");
      return data.data as ContactItem;
    } catch (e: any) {
      setError(e.message || "Failed to fetch contact");
      throw e;
    }
  }, []);

  const createContact = useCallback(async (payload: Partial<ContactItem>) => {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE_URL}/api/contacts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.done) {
      setContacts((prev) => [data.data, ...prev]);
    }
    return data;
  }, []);

  const updateContact = useCallback(async (id: string, payload: Partial<ContactItem>) => {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE_URL}/api/contacts/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.done) {
      setContacts((prev) => prev.map((c) => (c._id === id ? data.data : c)));
    }
    return data;
  }, []);

  const deleteContact = useCallback(async (id: string) => {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE_URL}/api/contacts/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    const data = await res.json();
    if (data.done) {
      setContacts((prev) => prev.filter((c) => c._id !== id));
    }
    return data;
  }, []);

  return {
    contacts,
    loading,
    error,
    fetchContacts,
    getContact,
    createContact,
    updateContact,
    deleteContact,
  };
};