import { useState, useEffect } from "react";
import { useSocket } from "../../../SocketContext";
import type { Socket } from "socket.io-client";
import { useCallback } from "react";

interface DashboardStats {
	totalCompanies: number;
	activeCompanies: number;
	inactiveCompanies: number;
	totalSubscribers: number;
	totalEarnings: number;
}

interface Transaction {
	id: string;
	company: string;
	logo: string;
	transactionId: string;
	date: string;
	amount: string;
	plan: string;
}

interface RegisteredCompany {
	id: string;
	name: string;
	logo: string;
	domain: string;
	plan: string;
	users: number;
	registeredDate: string;
}

interface ExpiredPlan {
	id: string;
	name: string;
	logo: string;
	plan: string;
	expiredDate: string;
}

interface PlanDistribution {
	name: string;
	count: number;
	percentage: number;
}

interface DashboardData {
	stats: DashboardStats | null;
	weeklyCompanies: number[];
	monthlyRevenue: {
		income: number[];
		expenses: number[];
	};
	planDistribution: PlanDistribution[];
	recentTransactions: Transaction[];
	recentlyRegistered: RegisteredCompany[];
	expiredPlans: ExpiredPlan[];
}

export const useDashboardData = () => {
	const socket = useSocket() as Socket | null;
	const [dashboardData, setDashboardData] = useState<DashboardData>({
		stats: null,
		weeklyCompanies: [],
		monthlyRevenue: { income: [], expenses: [] },
		planDistribution: [],
		recentTransactions: [],
		recentlyRegistered: [],
		expiredPlans: [],
	});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchAllDashboardData = useCallback(() => {
		if (socket) {
			setLoading(true);
			setError(null);
			socket.emit("superadmin/dashboard/get-all-data");
		}
	}, [socket]);

	useEffect(() => {
		if (!socket) return;

		// Listener for all dashboard data
		interface DashboardDataResponse {
			done: boolean;
			data: DashboardData;
			error?: string;
		}

		const handleAllDataResponse = (response: DashboardDataResponse) => {
			setLoading(false);
			if (response.done) {
				setDashboardData({
					stats: response.data.stats,
					weeklyCompanies: response.data.weeklyCompanies,
					monthlyRevenue: response.data.monthlyRevenue,
					planDistribution: response.data.planDistribution,
					recentTransactions: response.data.recentTransactions,
					recentlyRegistered: response.data.recentlyRegistered,
					expiredPlans: response.data.expiredPlans,
				});
			} else {
				setError(response.error || "Failed to fetch dashboard data");
			}
		};

		// Register socket listeners
		socket.on(
			"superadmin/dashboard/get-all-data-response",
			handleAllDataResponse
		);

		// Initial data fetch
		fetchAllDashboardData();

		// Cleanup
		return () => {
			socket.off(
				"superadmin/dashboard/get-all-data-response",
				handleAllDataResponse
			);
		};
	}, [socket, fetchAllDashboardData]);

	const refetch = () => {
		fetchAllDashboardData();
	};

	return {
		dashboardData,
		loading,
		error,
		refetch,
	};
};
