import React, {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { Link } from "react-router-dom";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  TrendingDown,
  TrendingUp,
  Scale,
  CreditCard,
  PiggyBank,
  Tag,
  ArrowRightLeft,
  List,
  PieChart as PieChartIcon,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useAppDispatch, useAppSelector } from "../hooks/useRedux";
import {
  fetchAccountsSummary,
  fetchAccounts,
} from "../features/accounts/accountsSlice";
import {
  fetchTransactions,
  fetchTransactionStats,
  fetchMonthlyStats,
  fetchDistributionStats,
} from "../features/transactions/transactionsSlice";
import { fetchCategories } from "../features/categories/categoriesSlice";
import { Loading } from "../components/common";
import {
  formatCurrency,
  formatRelativeDate,
  formatCompactNumber,
  formatCompactCurrency,
} from "../utils/formatters";
import type { Transaction, Currency, Account, Category } from "../types";

// Types
type ChartViewType = "net" | "income" | "expense";
type DistributionType = "expense" | "income";
type DistributionGroupBy = "category" | "account";
type RightPanelTab = "recent" | "distribution";

interface MonthlyData {
  name: string;
  month: number;
  year: number;
  income: number;
  expense: number;
  net: number;
}

interface ActiveMonth {
  month: number; // 0-11
  year: number;
  label: string;
}

interface DistributionItem {
  id: string;
  name: string;
  value: number;
  count: number;
  color: string;
  percentage: number;
  [key: string]: string | number; // Index signature for recharts compatibility
}

// Colores para el donut chart cuando no hay color definido
const CHART_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#6366f1",
];

// Custom Tooltip para el gráfico de barras
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
    dataKey: string;
  }>;
  label?: string | number;
  currency: Currency;
  chartView: ChartViewType;
  previousData?: MonthlyData;
}

const CustomChartTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
  currency,
  chartView,
  previousData,
}) => {
  if (active && payload && payload.length) {
    const currentValue = payload[0]?.value || 0;
    const prevValue = previousData
      ? chartView === "income"
        ? previousData.income
        : chartView === "expense"
        ? previousData.expense
        : previousData.net
      : null;

    const variation =
      prevValue !== null && prevValue !== 0
        ? ((currentValue - prevValue) / Math.abs(prevValue)) * 100
        : null;

    return (
      <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100">
        <p className="font-semibold text-gray-900 mb-2">{label}</p>
        {payload.map((p, idx) => (
          <div key={idx} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: p.color }}
            />
            <span className="text-gray-600 capitalize">{p.name}:</span>
            <span className="font-bold text-gray-900">
              {formatCurrency(p.value, currency)}
            </span>
          </div>
        ))}
        {variation !== null && (
          <div
            className={`mt-2 text-xs font-medium ${
              variation >= 0 ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {variation >= 0 ? "↑" : "↓"} {Math.abs(variation).toFixed(1)}% vs
            mes anterior
          </div>
        )}
      </div>
    );
  }
  return null;
};

// Custom Tooltip para el donut chart
interface DonutTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: DistributionItem;
  }>;
  currency: Currency;
}

const DonutTooltip: React.FC<DonutTooltipProps> = ({
  active,
  payload,
  currency,
}) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-100 min-w-[160px]">
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: data.color }}
          />
          <span className="font-semibold text-gray-900 text-sm truncate">
            {data.name}
          </span>
        </div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Monto:</span>
            <span className="font-bold text-gray-900">
              {formatCurrency(data.value, currency)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Porcentaje:</span>
            <span className="font-semibold text-gray-700">
              {data.percentage.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Movimientos:</span>
            <span className="text-gray-700">{data.count}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const {
    summary,
    accounts,
    isLoading: accountsLoading,
  } = useAppSelector((state) => state.accounts);
  const {
    transactions,
    stats,
    monthlyStats,
    distributionStats,
    isLoading: transactionsLoading,
  } = useAppSelector((state) => state.transactions);
  const { categories } = useAppSelector((state) => state.categories);

  const [chartView, setChartView] = useState<ChartViewType>("net");
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>("ARS");

  // Estado para el mes activo
  const [activeMonth, setActiveMonth] = useState<ActiveMonth>(() => {
    const now = new Date();
    return {
      month: now.getMonth(),
      year: now.getFullYear(),
      label: now.toLocaleDateString("es-AR", {
        month: "long",
        year: "numeric",
      }),
    };
  });

  // Estados para el panel derecho
  const [rightPanelTab, setRightPanelTab] = useState<RightPanelTab>("recent");
  const [distributionType, setDistributionType] =
    useState<DistributionType>("expense");
  const [distributionGroupBy, setDistributionGroupBy] =
    useState<DistributionGroupBy>("category");
  const [isDistributionLoading, setIsDistributionLoading] = useState(false);

  // Ref para evitar doble inicialización de moneda
  const hasInitializedCurrency = useRef(false);

  // Fetch inicial de datos
  useEffect(() => {
    dispatch(fetchAccountsSummary());
    dispatch(fetchAccounts());
    dispatch(fetchCategories({}));

    // Fetch monthly stats for the last 6 months
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const startOfSixMonthsAgo = new Date(
      now.getFullYear(),
      now.getMonth() - 5,
      1
    );

    dispatch(
      fetchMonthlyStats({
        startDate: startOfSixMonthsAgo.toISOString(),
        endDate: endOfMonth.toISOString(),
        groupBy: "month",
      })
    );
  }, [dispatch]);

  // Fetch de transacciones y stats cuando cambia el mes activo
  useEffect(() => {
    const startOfMonth = new Date(activeMonth.year, activeMonth.month, 1);
    const endOfMonth = new Date(
      activeMonth.year,
      activeMonth.month + 1,
      0,
      23,
      59,
      59
    );

    dispatch(
      fetchTransactions({
        startDate: startOfMonth.toISOString(),
        endDate: endOfMonth.toISOString(),
        limit: 10,
      })
    );

    dispatch(
      fetchTransactionStats({
        startDate: startOfMonth.toISOString(),
        endDate: endOfMonth.toISOString(),
      })
    );
  }, [dispatch, activeMonth]);

  // Fetch de distribution stats cuando cambia el mes activo o el groupBy
  useEffect(() => {
    setIsDistributionLoading(true);
    const startOfMonth = new Date(activeMonth.year, activeMonth.month, 1);
    const endOfMonth = new Date(
      activeMonth.year,
      activeMonth.month + 1,
      0,
      23,
      59,
      59
    );

    dispatch(
      fetchDistributionStats({
        startDate: startOfMonth.toISOString(),
        endDate: endOfMonth.toISOString(),
        groupBy: distributionGroupBy,
      })
    ).finally(() => {
      setIsDistributionLoading(false);
    });
  }, [dispatch, activeMonth, distributionGroupBy]);

  // Set default currency based on user preference or first available
  useEffect(() => {
    if (hasInitializedCurrency.current) return;

    if (user?.preferredCurrency) {
      setSelectedCurrency(user.preferredCurrency);
      hasInitializedCurrency.current = true;
    } else if (!user?.preferredCurrency && summary.length > 0) {
      setSelectedCurrency(summary[0].currency);
      hasInitializedCurrency.current = true;
    }
  }, [user, summary]);

  const isLoading = accountsLoading || transactionsLoading;

  // Calcular totales del mes por moneda desde stats
  const monthlyTotals = useMemo(() => {
    const result: Record<
      Currency,
      { income: number; expense: number; net: number }
    > = {
      ARS: { income: 0, expense: 0, net: 0 },
      USD: { income: 0, expense: 0, net: 0 },
      EUR: { income: 0, expense: 0, net: 0 },
      BRL: { income: 0, expense: 0, net: 0 },
    };

    if (stats?.totals) {
      stats.totals.forEach((t) => {
        const currency = t._id.currency;
        const type = t._id.type;
        if (result[currency]) {
          if (type === "income") {
            result[currency].income = t.total;
          } else if (type === "expense") {
            result[currency].expense = t.total;
          }
        }
      });

      Object.keys(result).forEach((curr) => {
        const c = curr as Currency;
        result[c].net = result[c].income - result[c].expense;
      });
    }

    return result;
  }, [stats]);

  // Separar activos y deudas por moneda
  const balanceBreakdown = useMemo(() => {
    const result: Record<
      Currency,
      {
        assets: number;
        debts: number;
        netWorth: number;
        assetAccounts: Account[];
        debtAccounts: Account[];
      }
    > = {
      ARS: {
        assets: 0,
        debts: 0,
        netWorth: 0,
        assetAccounts: [],
        debtAccounts: [],
      },
      USD: {
        assets: 0,
        debts: 0,
        netWorth: 0,
        assetAccounts: [],
        debtAccounts: [],
      },
      EUR: {
        assets: 0,
        debts: 0,
        netWorth: 0,
        assetAccounts: [],
        debtAccounts: [],
      },
      BRL: {
        assets: 0,
        debts: 0,
        netWorth: 0,
        assetAccounts: [],
        debtAccounts: [],
      },
    };

    accounts.forEach((account) => {
      const currency = account.currency;
      if (result[currency]) {
        if (account.type === "credit_card") {
          result[currency].debts += Math.abs(account.balance);
          result[currency].debtAccounts.push(account);
        } else {
          result[currency].assets += account.balance;
          result[currency].assetAccounts.push(account);
        }
      }
    });

    Object.keys(result).forEach((curr) => {
      const c = curr as Currency;
      result[c].netWorth = result[c].assets - result[c].debts;
    });

    return result;
  }, [accounts]);

  // Obtener monedas disponibles
  const availableCurrencies = useMemo(() => {
    const currencies = new Set<Currency>();
    accounts.forEach((a) => currencies.add(a.currency));
    return Array.from(currencies);
  }, [accounts]);

  // Generar datos para el gráfico (últimos 6 meses)
  const chartData = useMemo((): MonthlyData[] => {
    const months: MonthlyData[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString("es-AR", { month: "short" });
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      const mData: MonthlyData = {
        name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
        month: date.getMonth(),
        year: year,
        income: 0,
        expense: 0,
        net: 0,
      };

      if (monthlyStats && monthlyStats.stats) {
        monthlyStats.stats.forEach((stat) => {
          if (
            stat.year === year &&
            stat.month === month &&
            stat.currency === selectedCurrency
          ) {
            if (stat.type === "income") {
              mData.income += stat.total;
            } else if (stat.type === "expense") {
              mData.expense += stat.total;
            }
          }
        });
      }

      mData.net = mData.income - mData.expense;
      months.push(mData);
    }

    return months;
  }, [monthlyStats, selectedCurrency]);

  // Handle click on chart bar to set active month
  const handleChartClick = useCallback((data: MonthlyData) => {
    setActiveMonth({
      month: data.month,
      year: data.year,
      label: new Date(data.year, data.month).toLocaleDateString("es-AR", {
        month: "long",
        year: "numeric",
      }),
    });
  }, []);

  // Datos para el donut chart de distribución
  const distributionData = useMemo((): DistributionItem[] => {
    if (!distributionStats?.stats) return [];

    const filteredStats = distributionStats.stats.filter(
      (s) => s.type === distributionType && s.currency === selectedCurrency
    );

    const total = filteredStats.reduce((sum, s) => sum + s.total, 0);

    const items: DistributionItem[] = filteredStats.map((s, index) => {
      const name =
        distributionGroupBy === "category"
          ? s.categoryName || "Sin categoría"
          : s.accountName || "Sin cuenta";

      const color =
        distributionGroupBy === "category"
          ? s.categoryColor || CHART_COLORS[index % CHART_COLORS.length]
          : s.accountColor || CHART_COLORS[index % CHART_COLORS.length];

      const id =
        distributionGroupBy === "category"
          ? s.categoryId || `uncategorized-${index}`
          : s.accountId || `unknown-account-${index}`;

      return {
        id,
        name,
        value: s.total,
        count: s.count,
        color,
        percentage: total > 0 ? (s.total / total) * 100 : 0,
      };
    });

    // Ordenar por valor descendente y limitar a top 8 + "Otros"
    items.sort((a, b) => b.value - a.value);

    if (items.length > 8) {
      const topItems = items.slice(0, 7);
      const otherItems = items.slice(7);
      const otherTotal = otherItems.reduce((sum, i) => sum + i.value, 0);
      const otherCount = otherItems.reduce((sum, i) => sum + i.count, 0);

      topItems.push({
        id: "others",
        name: "Otros",
        value: otherTotal,
        count: otherCount,
        color: "#94a3b8",
        percentage: total > 0 ? (otherTotal / total) * 100 : 0,
      });

      return topItems;
    }

    return items;
  }, [
    distributionStats,
    distributionType,
    distributionGroupBy,
    selectedCurrency,
  ]);

  // Total para el centro del donut
  const distributionTotal = useMemo(() => {
    return distributionData.reduce((sum, d) => sum + d.value, 0);
  }, [distributionData]);

  // Helper para obtener categoría por ID
  const getCategoryById = (
    categoryId: string | Category | undefined
  ): Category | null => {
    if (!categoryId) return null;
    if (typeof categoryId === "object") return categoryId;
    return categories.find((c) => c._id === categoryId) || null;
  };

  // Helper para obtener cuenta por ID
  const getAccountById = (
    accountId: string | Account | undefined
  ): Account | null => {
    if (!accountId) return null;
    if (typeof accountId === "object") return accountId as Account;
    return accounts.find((a) => a._id === accountId) || null;
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loading size="lg" text="Cargando..." />
      </div>
    );
  }

  const currentMonthTotals = monthlyTotals[selectedCurrency];
  const currentBalance = balanceBreakdown[selectedCurrency];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-10">
      {/* HEADER SECTION */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            {activeMonth.label.charAt(0).toUpperCase() +
              activeMonth.label.slice(1)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Currency Selector */}
          {availableCurrencies.length > 1 && (
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              {availableCurrencies.map((curr) => (
                <button
                  key={curr}
                  onClick={() => setSelectedCurrency(curr)}
                  className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-all ${
                    selectedCurrency === curr
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* KPI CARDS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Net Worth Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Scale size={24} />
            </div>
            <span
              className={`text-xs font-semibold px-2 py-1 rounded-lg ${
                currentBalance.netWorth >= 0
                  ? "text-emerald-600 bg-emerald-50"
                  : "text-red-600 bg-red-50"
              }`}
            >
              {currentBalance.netWorth >= 0 ? "Positivo" : "Negativo"}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 flex items-center gap-1">
              Patrimonio Neto
              <span className="text-xs text-gray-400">
                ({selectedCurrency})
              </span>
            </p>
            <h2
              className={`text-2xl font-bold mt-1 ${
                currentBalance.netWorth >= 0 ? "text-gray-900" : "text-red-600"
              }`}
            >
              {formatCompactCurrency(currentBalance.netWorth, selectedCurrency)}
            </h2>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 flex items-center gap-1">
                <PiggyBank size={14} className="text-emerald-500" />
                Activos
              </span>
              <span className="font-semibold text-emerald-600">
                {formatCompactCurrency(currentBalance.assets, selectedCurrency)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 flex items-center gap-1">
                <CreditCard size={14} className="text-red-500" />
                Deudas
              </span>
              <span className="font-semibold text-red-600">
                {formatCompactCurrency(currentBalance.debts, selectedCurrency)}
              </span>
            </div>
          </div>
        </div>

        {/* Net of Month Card */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow text-white">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Scale size={24} />
            </div>
            <span
              className={`text-xs font-semibold px-2 py-1 rounded-lg ${
                currentMonthTotals.net >= 0
                  ? "bg-emerald-400/30 text-emerald-100"
                  : "bg-red-400/30 text-red-100"
              }`}
            >
              {currentMonthTotals.net >= 0 ? "Superávit" : "Déficit"}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-white/80">Neto del Mes</p>
            <h2 className="text-2xl font-bold mt-1">
              {currentMonthTotals.net >= 0 ? "+" : ""}
              {formatCompactCurrency(currentMonthTotals.net, selectedCurrency)}
            </h2>
          </div>
          <div className="mt-4 pt-4 border-t border-white/20 text-sm text-white/80">
            <span>Ingresos − Gastos = Neto</span>
          </div>
        </div>

        {/* Income Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp size={24} />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Ingresos (Mes)</p>
            <h2 className="text-2xl font-bold text-gray-900 mt-1">
              {formatCompactCurrency(
                currentMonthTotals.income,
                selectedCurrency
              )}
            </h2>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-xl">
              <TrendingDown size={24} />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Gastos (Mes)</p>
            <h2 className="text-2xl font-bold text-gray-900 mt-1">
              {formatCompactCurrency(
                currentMonthTotals.expense,
                selectedCurrency
              )}
            </h2>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: CHART */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h3 className="font-bold text-gray-900 text-lg">
                Flujo de Caja Mensual
              </h3>
              <p className="text-sm text-gray-500">
                {chartView === "net"
                  ? "Ingresos − Gastos"
                  : chartView === "income"
                  ? "Total de ingresos"
                  : "Total de gastos"}
                {" · "}
                <span className="text-blue-600">
                  Hacé click en una barra para ver el detalle
                </span>
              </p>
            </div>

            {/* Chart View Tabs */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setChartView("net")}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  chartView === "net"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Neto
              </button>
              <button
                onClick={() => setChartView("income")}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  chartView === "income"
                    ? "bg-white text-emerald-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Ingresos
              </button>
              <button
                onClick={() => setChartView("expense")}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  chartView === "expense"
                    ? "bg-white text-red-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Gastos
              </button>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartView === "net" ? (
                <BarChart data={chartData}>
                  <defs>
                    <linearGradient
                      id="colorPositive"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop
                        offset="100%"
                        stopColor="#10b981"
                        stopOpacity={0.3}
                      />
                    </linearGradient>
                    <linearGradient
                      id="colorNegative"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8} />
                      <stop
                        offset="100%"
                        stopColor="#ef4444"
                        stopOpacity={0.3}
                      />
                    </linearGradient>
                  </defs>
                  <Tooltip
                    content={({ active, payload, label }) => {
                      const dataIndex = chartData.findIndex(
                        (d) => d.name === label
                      );
                      const previousData =
                        dataIndex > 0 ? chartData[dataIndex - 1] : undefined;
                      return (
                        <CustomChartTooltip
                          active={active}
                          payload={payload as CustomTooltipProps["payload"]}
                          label={label}
                          currency={selectedCurrency}
                          chartView={chartView}
                          previousData={previousData}
                        />
                      );
                    }}
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    tickFormatter={(value) => formatCompactNumber(value)}
                  />
                  <Bar
                    dataKey="net"
                    name="Neto"
                    radius={[4, 4, 0, 0]}
                    fill="#3b82f6"
                    cursor="pointer"
                    onClick={(_, index) => handleChartClick(chartData[index])}
                  />
                </BarChart>
              ) : (
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient
                      id="colorIncome"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="colorExpense"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Tooltip
                    content={({ active, payload, label }) => {
                      const dataIndex = chartData.findIndex(
                        (d) => d.name === label
                      );
                      const previousData =
                        dataIndex > 0 ? chartData[dataIndex - 1] : undefined;
                      return (
                        <CustomChartTooltip
                          active={active}
                          payload={payload as CustomTooltipProps["payload"]}
                          label={label}
                          currency={selectedCurrency}
                          chartView={chartView}
                          previousData={previousData}
                        />
                      );
                    }}
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    tickFormatter={(value) => formatCompactNumber(value)}
                  />
                  <Area
                    type="monotone"
                    dataKey={chartView}
                    name={chartView === "income" ? "Ingresos" : "Gastos"}
                    stroke={chartView === "income" ? "#10b981" : "#ef4444"}
                    strokeWidth={3}
                    fillOpacity={1}
                    fill={
                      chartView === "income"
                        ? "url(#colorIncome)"
                        : "url(#colorExpense)"
                    }
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-4 text-sm text-gray-500">
            {chartView === "net" ? (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span>Neto mensual (Ingresos − Gastos)</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    chartView === "income" ? "bg-emerald-500" : "bg-red-500"
                  }`}
                />
                <span>{chartView === "income" ? "Ingresos" : "Gastos"}</span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: TABS (Recientes | Distribución) */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-x-hidden min-w-0">
          {/* Tabs Header */}
          <div className="flex border-b border-gray-100 flex-shrink-0">
            <button
              onClick={() => setRightPanelTab("recent")}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 text-sm font-semibold transition-all whitespace-nowrap ${
                rightPanelTab === "recent"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <List size={16} />
              Recientes
            </button>
            <button
              onClick={() => setRightPanelTab("distribution")}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 text-sm font-semibold transition-all whitespace-nowrap ${
                rightPanelTab === "distribution"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <PieChartIcon size={16} />
              Distribución
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-5 overflow-x-hidden overflow-y-auto flex flex-col min-w-0">
            {rightPanelTab === "recent" ? (
              /* RECENT TRANSACTIONS TAB */
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 text-lg">
                    Transacciones
                  </h3>
                  <Link
                    to="/transactions"
                    className="text-sm text-blue-600 font-semibold hover:underline"
                  >
                    Ver todo
                  </Link>
                </div>
                <div className="space-y-3 flex-1 overflow-y-auto overflow-x-hidden">
                  {transactions.length > 0 ? (
                    transactions.slice(0, 6).map((t: Transaction) => {
                      const category = getCategoryById(t.categoryId);
                      const account = getAccountById(t.accountId);

                      return (
                        <div
                          key={t._id}
                          className="flex items-start justify-between group cursor-pointer hover:bg-gray-50 p-3 rounded-xl transition-colors -mx-1"
                        >
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div
                              className={`
                                w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                                ${
                                  t.type === "income"
                                    ? "bg-emerald-100 text-emerald-600"
                                    : t.type === "transfer"
                                    ? "bg-blue-100 text-blue-600"
                                    : "bg-red-100 text-red-600"
                                }
                              `}
                            >
                              {t.type === "income" ? (
                                <ArrowUpRight size={18} />
                              ) : t.type === "transfer" ? (
                                <ArrowRightLeft size={16} />
                              ) : (
                                <ArrowDownRight size={18} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-gray-900 truncate">
                                {t.description || "Sin descripción"}
                              </p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {category && (
                                  <span
                                    className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                                    style={{
                                      backgroundColor: `${category.color}20`,
                                      color: category.color,
                                    }}
                                  >
                                    <Tag size={10} />
                                    {category.name}
                                  </span>
                                )}
                                {account && (
                                  <span className="text-xs text-gray-400">
                                    {account.name}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-400 mt-1">
                                {formatRelativeDate(t.date)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <span
                              className={`font-bold text-sm ${
                                t.type === "income"
                                  ? "text-emerald-600"
                                  : t.type === "transfer"
                                  ? "text-blue-600"
                                  : "text-gray-900"
                              }`}
                            >
                              {t.type === "income"
                                ? "+"
                                : t.type === "expense"
                                ? "-"
                                : ""}
                              {formatCurrency(t.amount, t.currency)}
                            </span>
                            <span className="block text-xs text-gray-400 mt-0.5">
                              {t.currency}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center py-8">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                        <Wallet size={20} className="text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        Sin movimientos
                      </p>
                      <p className="text-xs text-gray-500 mt-1 max-w-[150px]">
                        No hay transacciones en {activeMonth.label}.
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* DISTRIBUTION TAB */
              <>
                {/* Distribution Controls */}
                <div className="space-y-3 mb-4">
                  {/* Type Toggle: Gastos | Ingresos */}
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setDistributionType("expense")}
                      className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                        distributionType === "expense"
                          ? "bg-white text-red-600 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Gastos
                    </button>
                    <button
                      onClick={() => setDistributionType("income")}
                      className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                        distributionType === "income"
                          ? "bg-white text-emerald-600 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Ingresos
                    </button>
                  </div>

                  {/* GroupBy Toggle: Categoría | Cuenta */}
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setDistributionGroupBy("category")}
                      className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                        distributionGroupBy === "category"
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Por categoría
                    </button>
                    <button
                      onClick={() => setDistributionGroupBy("account")}
                      className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                        distributionGroupBy === "account"
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Por cuenta
                    </button>
                  </div>
                </div>

                {/* Donut Chart */}
                {isDistributionLoading ? (
                  <div className="flex-1 flex items-center justify-center py-16">
                    <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                  </div>
                ) : distributionData.length > 0 ? (
                  <div className="flex-1 flex flex-col">
                    <div className="relative h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={distributionData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={80}
                            paddingAngle={2}
                            strokeWidth={0}
                          >
                            {distributionData.map((entry) => (
                              <Cell key={entry.id} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            content={({ active, payload }) => (
                              <DonutTooltip
                                active={active}
                                payload={
                                  payload as DonutTooltipProps["payload"]
                                }
                                currency={selectedCurrency}
                              />
                            )}
                            wrapperStyle={{ zIndex: 100 }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      {/* Center Label */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-xs text-gray-500">Total</span>
                        <span className="text-sm font-bold text-gray-900">
                          {formatCompactCurrency(
                            distributionTotal,
                            selectedCurrency
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="mt-4 space-y-2 overflow-y-auto overflow-x-hidden max-h-[150px]">
                      {distributionData.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between text-sm hover:bg-gray-50 p-2 rounded-lg cursor-pointer transition-colors -mx-2"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-gray-700 truncate">
                              {item.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                            <span className="text-gray-400 text-xs">
                              {item.percentage.toFixed(0)}%
                            </span>
                            <span className="font-semibold text-gray-900">
                              {formatCurrency(item.value, selectedCurrency)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <PieChartIcon size={20} className="text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      Sin datos
                    </p>
                    <p className="text-xs text-gray-500 mt-1 max-w-[180px]">
                      No hay{" "}
                      {distributionType === "expense" ? "gastos" : "ingresos"}{" "}
                      registrados en {activeMonth.label}.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
