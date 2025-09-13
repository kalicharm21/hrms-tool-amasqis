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

export interface CompanyItem {
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
}

export const useCompanies = () => {
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCompanies = useCallback(async (params: {
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

      const res = await fetch(`${API_BASE_URL}/api/companies?${query.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (!data.done) throw new Error(data.error || "Failed to fetch companies");
      setCompanies(data.data || []);
      setError(null);
      return data;
    } catch (e: any) {
      setError(e.message || "Failed to fetch companies");
      return { done: false, error: e.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getCompany = useCallback(async (id: string) => {
    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE_URL}/api/companies/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (!data.done) throw new Error(data.error || "Failed to fetch company");
      return data.data as CompanyItem;
    } catch (e: any) {
      setError(e.message || "Failed to fetch company");
      throw e;
    }
  }, []);

  const createCompany = useCallback(async (payload: Partial<CompanyItem>) => {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE_URL}/api/companies`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.done) {
      setCompanies((prev) => [data.data, ...prev]);
    }
    return data;
  }, []);

  const updateCompany = useCallback(async (id: string, payload: Partial<CompanyItem>) => {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE_URL}/api/companies/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.done) {
      setCompanies((prev) => prev.map((c) => (c._id === id ? data.data : c)));
    }
    return data;
  }, []);

  const deleteCompany = useCallback(async (id: string) => {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE_URL}/api/companies/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    const data = await res.json();
    if (data.done) {
      setCompanies((prev) => prev.filter((c) => c._id !== id));
    }
    return data;
  }, []);

  return {
    companies,
    loading,
    error,
    fetchCompanies,
    getCompany,
    createCompany,
    updateCompany,
    deleteCompany,
  };
};


