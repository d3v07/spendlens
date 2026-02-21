import { createContext, useContext, useMemo, useState, ReactNode } from 'react';
import {
  generateBillingData,
  generateRecommendations,
  generateAnomalies,
  generateResourceUtilization,
  generateTeamBudgets,
  calculateTotals,
  getServiceBreakdown,
  getTeamBreakdown,
  getEnvironmentBreakdown,
  getDailyTrend,
  getTopCostDrivers,
  getUnallocatedSpend,
  getCostUnitMetrics,
  BillingItem,
  Recommendation,
  Anomaly,
  ResourceUtilization,
  TeamBudget,
  DemoProfile,
  DEMO_PROFILES,
  RecommendationStatus,
} from '@/lib/demo-data';

interface Filters {
  days: number;
  service: string;
}

interface DemoDataContextType {
  // Data
  billingItems: BillingItem[];
  recommendations: Recommendation[];
  anomalies: Anomaly[];
  totals: {
    thisMonth: number;
    lastMonth: number;
    change: number;
  };
  
  // Filters
  filters: Filters;
  setFilters: (filters: Partial<Filters>) => void;
  
  // Demo profile
  currentProfile: DemoProfile;
  setProfile: (profileId: string) => void;
  profiles: DemoProfile[];
  
  // Computed data with filters
  getServiceBreakdown: () => { name: string; value: number }[];
  getTeamBreakdown: () => { name: string; value: number }[];
  getEnvironmentBreakdown: () => { name: string; value: number }[];
  getDailyTrend: () => { date: string; total: number }[];
  getTopCostDrivers: () => { service: string; currentCost: number; previousCost: number; change: number }[];
  getUnallocatedSpend: () => { amount: number; total: number };
  getCostUnitMetrics: () => ReturnType<typeof getCostUnitMetrics>;
  getResourceUtilization: () => ResourceUtilization[];
  getTeamBudgets: () => TeamBudget[];
  
  // Available services for filtering
  availableServices: string[];
  
  // Recommendation actions
  updateRecommendationStatus: (id: string, status: RecommendationStatus) => void;
  
  // Anomaly actions
  acknowledgeAnomaly: (id: string) => void;
  dismissAnomaly: (id: string) => void;
  
  // Demo controls
  resetDemoData: () => void;
}

const DemoDataContext = createContext<DemoDataContextType | undefined>(undefined);

export function DemoDataProvider({ children }: { children: ReactNode }) {
  const [currentProfileId, setCurrentProfileId] = useState<string>('startup-saas');
  const [filters, setFiltersState] = useState<Filters>({ days: 30, service: 'all' });
  const [recommendationStatuses, setRecommendationStatuses] = useState<Record<string, RecommendationStatus>>({});
  const [anomalyStatuses, setAnomalyStatuses] = useState<Record<string, 'new' | 'acknowledged' | 'dismissed'>>({});
  const [resetCounter, setResetCounter] = useState(0);

  const currentProfile = useMemo(
    () => DEMO_PROFILES.find((p) => p.id === currentProfileId) || DEMO_PROFILES[0],
    [currentProfileId]
  );

  const billingItems = useMemo(
    () => generateBillingData(90, currentProfile.type),
    [currentProfile.type, resetCounter]
  );

  const baseRecommendations = useMemo(() => generateRecommendations(), [resetCounter]);
  
  const recommendations = useMemo(() => 
    baseRecommendations.map((rec) => ({
      ...rec,
      status: recommendationStatuses[rec.id] || rec.status,
    })),
    [baseRecommendations, recommendationStatuses]
  );

  const baseAnomalies = useMemo(() => generateAnomalies(billingItems), [billingItems]);
  
  const anomalies = useMemo(() => 
    baseAnomalies.map((a) => ({
      ...a,
      status: anomalyStatuses[a.id] || a.status,
    })).filter((a) => a.status !== 'dismissed'),
    [baseAnomalies, anomalyStatuses]
  );

  const totals = useMemo(() => calculateTotals(billingItems), [billingItems]);

  const resourceUtilization = useMemo(
    () => generateResourceUtilization(currentProfile.type),
    [currentProfile.type, resetCounter]
  );

  const teamBudgets = useMemo(
    () => generateTeamBudgets(billingItems, filters.days),
    [billingItems, filters.days, resetCounter]
  );

  const availableServices = useMemo(() => {
    const services = new Set(billingItems.map((item) => item.service_name));
    return Array.from(services).sort();
  }, [billingItems]);

  const setFilters = (newFilters: Partial<Filters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
  };

  const setProfile = (profileId: string) => {
    setCurrentProfileId(profileId);
    setRecommendationStatuses({});
    setAnomalyStatuses({});
  };

  const updateRecommendationStatus = (id: string, status: RecommendationStatus) => {
    setRecommendationStatuses((prev) => ({ ...prev, [id]: status }));
  };

  const acknowledgeAnomaly = (id: string) => {
    setAnomalyStatuses((prev) => ({ ...prev, [id]: 'acknowledged' }));
  };

  const dismissAnomaly = (id: string) => {
    setAnomalyStatuses((prev) => ({ ...prev, [id]: 'dismissed' }));
  };

  const resetDemoData = () => {
    setResetCounter((c) => c + 1);
    setRecommendationStatuses({});
    setAnomalyStatuses({});
    setFiltersState({ days: 30, service: 'all' });
  };

  const value = useMemo(() => ({
    billingItems,
    recommendations,
    anomalies,
    totals,
    filters,
    setFilters,
    currentProfile,
    setProfile,
    profiles: DEMO_PROFILES,
    getServiceBreakdown: () => getServiceBreakdown(billingItems, filters.days, filters.service),
    getTeamBreakdown: () => getTeamBreakdown(billingItems, filters.days, filters.service),
    getEnvironmentBreakdown: () => getEnvironmentBreakdown(billingItems, filters.days, filters.service),
    getDailyTrend: () => getDailyTrend(billingItems, filters.days, filters.service),
    getTopCostDrivers: () => getTopCostDrivers(billingItems, filters.days),
    getUnallocatedSpend: () => getUnallocatedSpend(billingItems, filters.days),
    getCostUnitMetrics: () => getCostUnitMetrics(billingItems, filters.days),
    getResourceUtilization: () => resourceUtilization,
    getTeamBudgets: () => teamBudgets,
    availableServices,
    updateRecommendationStatus,
    acknowledgeAnomaly,
    dismissAnomaly,
    resetDemoData,
  }), [billingItems, recommendations, anomalies, totals, filters, currentProfile, resourceUtilization, teamBudgets, availableServices]);

  return (
    <DemoDataContext.Provider value={value}>
      {children}
    </DemoDataContext.Provider>
  );
}

export function useDemoData() {
  const context = useContext(DemoDataContext);
  if (context === undefined) {
    throw new Error('useDemoData must be used within a DemoDataProvider');
  }
  return context;
}
