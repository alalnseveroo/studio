
'use client'

import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { getProfile } from '@/lib/actions/profile';
import { getClients } from '@/lib/actions/clients';
import { getContracts } from '@/lib/actions/contratos';
import { getCharges } from '@/lib/actions/cobrancas';
import { getProposals } from '@/lib/actions/propostas';
import { getTasks } from '@/lib/actions/tasks';
import { getFinancialGoal } from '@/lib/actions/goals';
import type { DashboardContextType, Profile, Cliente, Contrato, Proposta, Cobranca, Task, FinancialGoal } from '@/lib/types';
import { useRouter } from 'next/navigation';

export const DashboardContext = createContext<DashboardContextType | null>(null);

export const DashboardProvider = ({ children }: { children: React.ReactNode }) => {
    const [profile, setProfile] = useState<(Profile & { email: string }) | null>(null);
    const [clients, setClients] = useState<Cliente[]>([]);
    const [contracts, setContracts] = useState<Contrato[]>([]);
    const [proposals, setProposals] = useState<Proposta[]>([]);
    const [charges, setCharges] = useState<Cobranca[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [financialGoal, setFinancialGoal] = useState<FinancialGoal | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const fetchDashboardData = useCallback(async () => {
        setIsLoading(true);
        const [
            profileResult,
            clientsResult,
            contractsResult,
            proposalsResult,
            chargesResult,
            tasksResult,
            goalResult,
        ] = await Promise.all([
            getProfile(),
            getClients(),
            getContracts(),
            getProposals(),
            getCharges(),
            getTasks(),
            getFinancialGoal(),
        ]);

        const profileData = profileResult.data as (Profile & { email: string }) | null;
        
        // Redirecionamento se o perfil não estiver completo
        if (profileData && !profileData.is_completed) {
            router.push('/dashboard/settings/profile');
            // Não para o carregamento, mas o layout irá redirecionar
        }

        setProfile(profileData);
        setClients(clientsResult.data || []);
        setContracts(contractsResult.data || []);
        setProposals(proposalsResult.data || []);
        setCharges(chargesResult.data || []);
        setTasks(tasksResult.data || []);
        setFinancialGoal(goalResult.data || null);
        setIsLoading(false);
    }, [router]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    return (
        <DashboardContext.Provider value={{
            profile,
            clients,
            contracts,
            proposals,
            charges,
            tasks,
            financialGoal,
            isLoading,
            fetchDashboardData,
        }}>
            {children}
        </DashboardContext.Provider>
    );
};

export const useDashboard = () => {
    const context = useContext(DashboardContext);
    if (!context) {
        throw new Error('useDashboard must be used within a DashboardProvider');
    }
    return context;
};
