import React, { useEffect, useState } from "react";
import {
  ArrowLeftRight,
  Plus,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Search,
  Wallet,
  Tag,
  Filter,
  X,
  ChevronDown,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../hooks/useRedux";
import {
  fetchTransactions,
  createTransaction,
  deleteTransaction,
} from "../features/transactions/transactionsSlice";
import { fetchAccounts } from "../features/accounts/accountsSlice";
import { fetchCategories } from "../features/categories/categoriesSlice";
import {
  Card,
  Button,
  Modal,
  Input,
  Select,
  Loading,
  Badge,
} from "../components/common";
import { formatCurrency, formatRelativeDate } from "../utils/formatters";
import type { Transaction, TransactionType, Currency } from "../types";

const Transactions: React.FC = () => {
  const dispatch = useAppDispatch();
  const { transactions, isLoading } = useAppSelector(
    (state) => state.transactions
  );
  const { accounts } = useAppSelector((state) => state.accounts);
  const { incomeCategories, expenseCategories } = useAppSelector(
    (state) => state.categories
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  /* Filters State */
  const [filterType, setFilterType] = useState<
    TransactionType | "all" | "transfer"
  >("all");
  const [filterAccount, setFilterAccount] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    accountId: "",
    categoryId: "",
    type: "expense" as TransactionType,
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    toAccountId: "",
  });

  useEffect(() => {
    dispatch(fetchTransactions({}));
    dispatch(fetchAccounts());
    dispatch(fetchCategories({}));
  }, [dispatch]);

  const handleOpenModal = () => {
    setFormData({
      accountId: accounts[0]?._id || "",
      categoryId: "",
      type: "expense",
      amount: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
      toAccountId: "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalAccountId = formData.accountId || accounts[0]?._id;

    if (!finalAccountId) {
      alert("No hay cuentas disponibles. Por favor crea una cuenta primero.");
      return;
    }

    await dispatch(
      createTransaction({
        accountId: finalAccountId,
        categoryId:
          formData.type !== "transfer" ? formData.categoryId : undefined,
        type: formData.type,
        amount:
          parseFloat(formData.amount.replace(/\./g, "").replace(",", ".")) || 0,
        description: formData.description,
        date: formData.date,
        toAccountId:
          formData.type === "transfer" ? formData.toAccountId : undefined,
      })
    );

    setIsModalOpen(false);
    dispatch(fetchAccounts()); // Refresh balances
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de eliminar esta transacción?")) {
      await dispatch(deleteTransaction(id));
      dispatch(fetchAccounts()); // Refresh balances
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    const matchesType = filterType === "all" || t.type === filterType;
    const matchesAccount =
      filterAccount === "all" ||
      (typeof t.accountId === "object"
        ? t.accountId._id === filterAccount
        : t.accountId === filterAccount) ||
      (typeof t.toAccountId === "object"
        ? t.toAccountId._id === filterAccount
        : t.toAccountId === filterAccount); // Include transfers involving this account

    const matchesCategory =
      filterCategory === "all" ||
      (typeof t.categoryId === "object"
        ? t.categoryId._id === filterCategory
        : t.categoryId === filterCategory);

    const matchesSearch =
      t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (typeof t.categoryId === "object" &&
        t.categoryId?.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesType && matchesAccount && matchesCategory && matchesSearch;
  });

  // Grouping Logic
  const groupedTransactions = filteredTransactions.reduce(
    (groups, transaction) => {
      // Assuming date is in ISO format YYYY-MM-DD or similar standard
      const dateKey = transaction.date.split("T")[0];
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(transaction);
      return groups;
    },
    {} as Record<string, Transaction[]>
  );

  // Helper to calculate daily total string
  const getDailyTotal = (txs: Transaction[]) => {
    const totalsByCurrency: Record<string, number> = {};

    txs.forEach((t) => {
      const amount =
        t.type === "expense" ? -t.amount : t.type === "income" ? t.amount : 0;
      // For simplicity in transfers we don't sum them in daily total or maybe 0?
      // User example "Ayer · -$ 42.300" implies net change.
      // Transfers don't change net worth but might affect account balance.
      // Let's count them as 0 for daily "Flow" or handle them if needed.
      // Usually daily total in these apps refers to Spending/Income.

      const currency = t.currency || "ARS";
      if (!totalsByCurrency[currency]) totalsByCurrency[currency] = 0;
      totalsByCurrency[currency] += amount;
    });

    return Object.entries(totalsByCurrency)
      .filter((entry) => entry[1] !== 0)
      .map(([curr, val]) => formatCurrency(val, curr as Currency) + ` ${curr}`)
      .join(" • ");
  };

  const currentCategories =
    formData.type === "income" ? incomeCategories : expenseCategories;

  /* const typeOptions removed in favor of direct mapping in render to allow flexible styling */

  const getTransactionIcon = (type: TransactionType) => {
    switch (type) {
      case "income":
        return <TrendingUp size={18} />;
      case "expense":
        return <TrendingDown size={18} />;
      case "transfer":
        return <ArrowRightLeft size={18} />;
    }
  };

  const getTransactionColor = (type: TransactionType) => {
    switch (type) {
      case "income":
        return "var(--accent-success)";
      case "expense":
        return "var(--accent-danger)";
      case "transfer":
        return "var(--accent-info)";
    }
  };

  const getParamsForType = (type: TransactionType) => {
    switch (type) {
      case "income":
        return {
          label: "Ingreso",
          color: "bg-emerald-600",
          activeClass: "bg-emerald-600 text-white",
        };
      case "expense":
        return {
          label: "Gasto",
          color: "bg-red-600",
          activeClass: "bg-red-600 text-white",
        };
      case "transfer":
        return {
          label: "Transferencia",
          color: "bg-blue-600",
          activeClass: "bg-blue-600 text-white",
        };
    }
  };

  if (isLoading && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loading size="lg" text="Cargando transacciones..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Movimientos</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Historial de todas tus transacciones
          </p>
        </div>
        <Button onClick={handleOpenModal} leftIcon={<Plus size={18} />}>
          Nueva transacción
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4">
        {/* Search and Tabs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />
            <input
              type="text"
              placeholder="Buscar transacciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] placeholder-[var(--text-muted)]"
            />
          </div>

          <div className="flex bg-[var(--bg-card)] p-1 rounded-lg border border-[var(--border-color)] overflow-x-auto">
            {(["all", "income", "expense", "transfer"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  filterType === type
                    ? "bg-black text-white shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                }`}
              >
                {type === "all"
                  ? "Todos"
                  : type === "income"
                  ? "Ingresos"
                  : type === "expense"
                  ? "Gastos"
                  : "Transferencias"}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Filters (Styled Chips) */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mr-2">
            <Filter size={16} />
            <span className="font-medium hidden sm:inline">Filtrar:</span>
          </div>

          {/* Account Filter */}
          <div className="relative group">
            <Wallet
              size={14}
              className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors pointer-events-none z-10 ${
                filterAccount !== "all" ? "text-white" : "text-slate-500"
              }`}
            />
            <select
              value={filterAccount}
              onChange={(e) => setFilterAccount(e.target.value)}
              className={`
                appearance-none cursor-pointer pl-10 pr-9 py-2 rounded-full text-sm font-medium border transition-all duration-200 outline-none
                ${
                  filterAccount !== "all"
                    ? "bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800"
                    : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 shadow-sm"
                }
              `}
            >
              <option value="all" className="bg-white text-slate-900">
                Todas las cuentas
              </option>
              {accounts.map((a) => (
                <option
                  key={a._id}
                  value={a._id}
                  className="bg-white text-slate-900"
                >
                  {a.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
                filterAccount !== "all" ? "text-slate-400" : "text-slate-400"
              }`}
            />
          </div>

          {/* Category Filter */}
          <div className="relative group">
            <Tag
              size={14}
              className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors pointer-events-none z-10 ${
                filterCategory !== "all" ? "text-white" : "text-slate-500"
              }`}
            />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className={`
                appearance-none cursor-pointer pl-10 pr-9 py-2 rounded-full text-sm font-medium border transition-all duration-200 outline-none
                ${
                  filterCategory !== "all"
                    ? "bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800"
                    : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 shadow-sm"
                }
              `}
            >
              <option value="all" className="bg-white text-slate-900">
                Todas las categorías
              </option>
              {[...incomeCategories, ...expenseCategories].map((c) => (
                <option
                  key={c._id}
                  value={c._id}
                  className="bg-white text-slate-900"
                >
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
                filterCategory !== "all" ? "text-slate-400" : "text-slate-400"
              }`}
            />
          </div>

          {/* Clear Filters Button */}
          {(filterAccount !== "all" ||
            filterCategory !== "all" ||
            filterType !== "all") && (
            <button
              onClick={() => {
                setFilterAccount("all");
                setFilterCategory("all");
                setFilterType("all");
                setSearchTerm("");
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
            >
              <X size={14} />
              <span className="hidden sm:inline">Limpiar</span>
            </button>
          )}
        </div>
      </div>

      {/* Transactions List */}
      {/* Transactions List Grouped */}
      {Object.keys(groupedTransactions).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedTransactions)
            .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
            .map(([date, dayTransactions]) => (
              <div key={date} className="animate-fade-in">
                <div className="flex items-center justify-between mb-2 px-2">
                  <span className="text-sm font-semibold text-[var(--text-secondary)] capitalize">
                    {formatRelativeDate(date)}
                  </span>
                  <span className="text-sm font-medium text-[var(--text-muted)]">
                    {getDailyTotal(dayTransactions)}
                  </span>
                </div>

                <Card padding="none" className="overflow-hidden">
                  <div className="divide-y divide-[var(--border-color)]">
                    {dayTransactions.map((t: Transaction) => {
                      const category =
                        typeof t.categoryId === "object" ? t.categoryId : null;
                      const account =
                        typeof t.accountId === "object" ? t.accountId : null;
                      const toAccount =
                        typeof t.toAccountId === "object"
                          ? t.toAccountId
                          : null;

                      return (
                        <div
                          key={t._id}
                          className="flex items-center justify-between p-4 hover:bg-[var(--bg-card-hover)] transition-all group"
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                              style={{
                                backgroundColor: `${
                                  category?.color || getTransactionColor(t.type)
                                }15`,
                                color:
                                  category?.color ||
                                  getTransactionColor(t.type),
                              }}
                            >
                              {/* If category exists and has icon we could use it here, for now keeping generic or type icon */}
                              {getTransactionIcon(t.type)}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <p className="font-semibold text-[var(--text-primary)] truncate">
                                  {t.description || "Sin descripción"}
                                </p>
                                {category && (
                                  <Badge
                                    variant="default" // Using default as secondary is not in type
                                    className="text-[10px] px-1.5 py-0 h-5 font-normal bg-opacity-50"
                                    style={{
                                      backgroundColor: category.color + "20",
                                      color: category.color,
                                    }}
                                  >
                                    {category.name}
                                  </Badge>
                                )}
                                {t.type === "transfer" && (
                                  <Badge
                                    variant="info"
                                    className="text-[10px] px-1.5 py-0 h-5 font-normal"
                                  >
                                    Transferencia
                                  </Badge>
                                )}
                              </div>

                              <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                                <span>{account?.name}</span>
                                {t.type === "transfer" && toAccount && (
                                  <>
                                    <ArrowRightLeft size={10} />
                                    <span>{toAccount.name}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <span
                              className="text-base font-bold flex items-center gap-1"
                              style={{
                                color:
                                  t.type === "income"
                                    ? "var(--accent-success)"
                                    : t.type === "expense"
                                    ? "var(--accent-danger)"
                                    : "var(--text-primary)",
                              }}
                            >
                              {t.type === "income"
                                ? "+"
                                : t.type === "expense"
                                ? "-"
                                : ""}
                              {formatCurrency(t.amount, t.currency)}
                              <span className="text-[10px] text-[var(--text-muted)] ml-0.5 font-normal">
                                {t.currency}
                              </span>
                            </span>

                            <button
                              onClick={() => handleDelete(t._id)}
                              className="p-1 px-2 rounded hover:bg-red-50 text-red-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>
            ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <ArrowLeftRight
            size={48}
            className="mx-auto text-[var(--text-muted)] mb-4"
          />
          <h3 className="text-lg font-semibold mb-2">No hay transacciones</h3>
          <p className="text-[var(--text-secondary)] mb-4">
            {searchTerm
              ? "No se encontraron resultados para tu búsqueda"
              : "Registra tu primera transacción para verla aquí"}
          </p>
        </Card>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nueva transacción"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Transaction Type Tabs */}
          <div className="flex p-1 bg-[var(--bg-elevated)] rounded-xl relative">
            {(["expense", "income", "transfer"] as const).map((type) => {
              const isActive = formData.type === type;
              const params = getParamsForType(type);

              return (
                <button
                  key={type}
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      type: type,
                      categoryId: "",
                    })
                  }
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 z-10 ${
                    isActive
                      ? "shadow-sm " + params.activeClass
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                  }`}
                >
                  {params.label}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-5">
            <Select
              label={formData.type === "transfer" ? "Cuenta origen" : "Cuenta"}
              value={formData.accountId}
              onChange={(e) =>
                setFormData({ ...formData, accountId: e.target.value })
              }
              options={accounts
                .filter(
                  (a) =>
                    formData.type !== "transfer" || a.type !== "credit_card"
                )
                .map((a) => ({
                  value: a._id,
                  label:
                    a.type === "credit_card"
                      ? `${a.issuer || "Tarjeta"} •••• ${a.last4Digits || ""}`
                      : `${a.name} (${formatCurrency(a.balance, a.currency)})`,
                }))}
              placeholder="Seleccionar cuenta"
            />

            {formData.type === "transfer" && (
              <Select
                label="Cuenta destino"
                value={formData.toAccountId}
                onChange={(e) =>
                  setFormData({ ...formData, toAccountId: e.target.value })
                }
                options={accounts
                  .filter((a) => {
                    const sourceAccount = accounts.find(
                      (acc) => acc._id === formData.accountId
                    );
                    // Filter out same account, credit cards, and different currencies
                    return (
                      a._id !== formData.accountId &&
                      a.type !== "credit_card" &&
                      (!sourceAccount || a.currency === sourceAccount.currency)
                    );
                  })
                  .map((a) => ({
                    value: a._id,
                    label: `${a.name} (${formatCurrency(
                      a.balance,
                      a.currency
                    )})`,
                  }))}
                placeholder="Seleccionar cuenta destino"
              />
            )}

            {formData.type !== "transfer" && (
              <Select
                label="Categoría"
                value={formData.categoryId}
                onChange={(e) =>
                  setFormData({ ...formData, categoryId: e.target.value })
                }
                options={currentCategories.map((category) => ({
                  value: category._id,
                  label: category.name,
                }))}
                placeholder="Seleccionar categoría"
              />
            )}

            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  label="Monto"
                  type="text"
                  value={formData.amount}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Remove dots to get raw number string (es-AR uses dots for thousands)
                    const cleanValue = value.replace(/\./g, "");

                    // Allow digits and max one comma
                    if (!/^\d*(,\d*)?$/.test(cleanValue)) return;

                    const [integerPart, decimalPart] = cleanValue.split(",");

                    // Format integer part
                    const formattedInteger =
                      integerPart === ""
                        ? ""
                        : new Intl.NumberFormat("es-AR").format(
                            parseInt(integerPart, 10)
                          );

                    let finalValue = formattedInteger;
                    // If there was a comma, append it (and any decimals)
                    if (decimalPart !== undefined) {
                      finalValue += "," + decimalPart;
                    }

                    setFormData({ ...formData, amount: finalValue });
                  }}
                  placeholder="0"
                  required
                  rightIcon={
                    <span className="text-xs font-bold text-slate-500">
                      {accounts.find((a) => a._id === formData.accountId)
                        ?.currency || "ARS"}
                    </span>
                  }
                />
              </div>

              <div className="w-1/3">
                <Input
                  label="Fecha"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <Input
              label="Descripción"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder={
                formData.type === "transfer"
                  ? "Ej: Pago de tarjeta"
                  : "Ej: Compra en supermercado"
              }
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
              fullWidth
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              fullWidth
              disabled={
                !formData.amount ||
                !formData.date ||
                (!formData.categoryId && formData.type !== "transfer") ||
                !formData.accountId ||
                (formData.type === "transfer" &&
                  (!formData.toAccountId || !formData.description))
              }
            >
              Crear transacción
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Transactions;
