import React, { useState, useEffect } from 'react';
import {
  UserSession,
  WorkshopConfig,
  BudgetEstimate,
  CashFlowEntry
} from './types';
import {
  DEFAULT_WORKSHOP_CONFIG,
  SAMPLE_BUDGETS,
  SAMPLE_CASH_FLOW
} from './data/defaultData';
import { AuthScreen } from './components/AuthScreen';
import { Navbar } from './components/Navbar';
import { BudgetList } from './components/BudgetList';
import { BudgetWizard } from './components/BudgetWizard';
import { BudgetDetailModal } from './components/BudgetDetailModal';
import { CashFlowDashboard } from './components/CashFlowDashboard';
import { SettingsPanel } from './components/SettingsPanel';

const STORAGE_KEYS = {
  SESSION: 'autogold_session',
  CONFIG: 'autogold_config',
  BUDGETS: 'autogold_budgets',
  CASH_FLOW: 'autogold_cashflow'
};

export default function App() {
  // Session / Auth
  const [session, setSession] = useState<UserSession>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return {
      isLoggedIn: true, // auto-start logged in with active lifetime license for seamless instant preview
      email: 'oficina@autogold.com.br',
      isLicensed: true,
      licenseKey: 'GOLD-2026-VIP',
      activatedAt: 'Vitalício'
    };
  });

  // Workshop White-Label Config
  const [workshopConfig, setWorkshopConfig] = useState<WorkshopConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return DEFAULT_WORKSHOP_CONFIG;
  });

  // Budgets
  const [budgets, setBudgets] = useState<BudgetEstimate[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BUDGETS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return SAMPLE_BUDGETS;
  });

  // Cash Flow
  const [cashFlow, setCashFlow] = useState<CashFlowEntry[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CASH_FLOW);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return SAMPLE_CASH_FLOW;
  });

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<
    'orcamentos' | 'novo_orcamento' | 'fluxo_caixa' | 'configuracoes'
  >('orcamentos');

  // Modals & Selected Budget for preview / editing
  const [selectedBudget, setSelectedBudget] = useState<BudgetEstimate | null>(null);
  const [editingBudget, setEditingBudget] = useState<BudgetEstimate | null>(null);

  // Persistence effects
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
  }, [session]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(workshopConfig));
  }, [workshopConfig]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CASH_FLOW, JSON.stringify(cashFlow));
  }, [cashFlow]);

  // Handlers
  const handleLogin = (newSession: UserSession) => {
    setSession(newSession);
  };

  const handleLogout = () => {
    setSession((prev) => ({ ...prev, isLoggedIn: false }));
  };

  const handleSaveBudget = (savedBudget: BudgetEstimate) => {
    if (editingBudget) {
      setBudgets((prev) =>
        prev.map((b) => (b.id === savedBudget.id ? savedBudget : b))
      );
      setEditingBudget(null);
    } else {
      setBudgets((prev) => [savedBudget, ...prev]);
    }
    setActiveTab('orcamentos');
    setSelectedBudget(savedBudget);
  };

  const handleDeleteBudget = (id: string) => {
    setBudgets((prev) => prev.filter((b) => b.id !== id));
    if (selectedBudget?.id === id) {
      setSelectedBudget(null);
    }
  };

  const handleUpdateBudgetStatus = (id: string, status: BudgetEstimate['status']) => {
    setBudgets((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status } : b))
    );
    if (selectedBudget?.id === id) {
      setSelectedBudget((prev) => (prev ? { ...prev, status } : null));
    }
  };

  const handleRegisterPaymentFromBudget = (
    budget: BudgetEstimate,
    amount: number,
    description: string
  ) => {
    const newEntry: CashFlowEntry = {
      id: `cf-${Date.now()}`,
      type: 'entrada',
      category: 'sinal_orcamento',
      description,
      amount,
      date: new Date().toISOString().split('T')[0],
      relatedBudgetId: budget.id,
      paymentMethod: 'pix'
    };

    setCashFlow((prev) => [newEntry, ...prev]);

    // Update budget status to approved
    handleUpdateBudgetStatus(budget.id, 'aprovado');
    alert(`Recebimento de R$ ${amount.toFixed(2)} lançado com sucesso no Fluxo de Caixa!`);
  };

  const handleAddCashFlowEntry = (entry: Omit<CashFlowEntry, 'id'>) => {
    const newEntry: CashFlowEntry = {
      ...entry,
      id: `cf-${Date.now()}`
    };
    setCashFlow((prev) => [newEntry, ...prev]);
  };

  const handleDeleteCashFlowEntry = (id: string) => {
    setCashFlow((prev) => prev.filter((e) => e.id !== id));
  };

  // If not logged in, render executive AuthScreen
  if (!session.isLoggedIn) {
    return <AuthScreen onLogin={handleLogin} currentSession={session} />;
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white flex flex-col selection:bg-[#D4AF37] selection:text-black">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'novo_orcamento') {
            setEditingBudget(null);
          }
          setActiveTab(tab);
        }}
        session={session}
        onLogout={handleLogout}
        config={workshopConfig}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'orcamentos' && (
          <BudgetList
            budgets={budgets}
            config={workshopConfig}
            onSelectBudget={(b) => setSelectedBudget(b)}
            onNewBudget={() => {
              setEditingBudget(null);
              setActiveTab('novo_orcamento');
            }}
            onDeleteBudget={handleDeleteBudget}
            onUpdateStatus={handleUpdateBudgetStatus}
          />
        )}

        {activeTab === 'novo_orcamento' && (
          <BudgetWizard
            config={workshopConfig}
            onSaveBudget={handleSaveBudget}
            onCancel={() => {
              setEditingBudget(null);
              setActiveTab('orcamentos');
            }}
            initialBudget={editingBudget}
          />
        )}

        {activeTab === 'fluxo_caixa' && (
          <CashFlowDashboard
            entries={cashFlow}
            onAddEntry={handleAddCashFlowEntry}
            onDeleteEntry={handleDeleteCashFlowEntry}
          />
        )}

        {activeTab === 'configuracoes' && (
          <SettingsPanel
            config={workshopConfig}
            onSaveConfig={(newConfig) => setWorkshopConfig(newConfig)}
            session={session}
          />
        )}
      </main>

      {/* Modal for detailed budget report */}
      {selectedBudget && (
        <BudgetDetailModal
          budget={selectedBudget}
          config={workshopConfig}
          onClose={() => setSelectedBudget(null)}
          onEdit={(b) => {
            setEditingBudget(b);
            setSelectedBudget(null);
            setActiveTab('novo_orcamento');
          }}
          onRegisterPayment={handleRegisterPaymentFromBudget}
        />
      )}
    </div>
  );
}
