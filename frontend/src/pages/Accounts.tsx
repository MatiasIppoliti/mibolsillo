import React, { useEffect, useState } from "react";
import {
  Wallet,
  Plus,
  Landmark,
  Banknote,
  MoreVertical,
  Edit2,
  Trash2,
  Coins,
  CreditCard,
  DollarSign,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../hooks/useRedux";
import {
  fetchAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  payCreditCard,
} from "../features/accounts/accountsSlice";
import {
  Card,
  Button,
  Modal,
  Input,
  Select,
  Loading,
} from "../components/common";
import { formatCurrency } from "../utils/formatters";
import type { Account, AccountType, Currency } from "../types";

const accountIcons: Record<AccountType, React.ReactNode> = {
  cash: <Banknote size={22} />,
  bank: <Landmark size={22} />,
  wallet: <Wallet size={22} />,
  crypto: <Coins size={22} />,
  credit_card: <CreditCard size={22} />,
};

const accountGroups: { type: AccountType; label: string }[] = [
  { type: "cash", label: "Efectivo" },
  { type: "bank", label: "Cuentas Bancarias" },
  { type: "wallet", label: "Billeteras Virtuales" },
  { type: "credit_card", label: "Tarjetas de Crédito" },
  { type: "crypto", label: "Criptomonedas" },
];

const Accounts: React.FC = () => {
  const dispatch = useAppDispatch();
  const { accounts, isLoading } = useAppSelector((state) => state.accounts);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "bank" as AccountType,
    currency: "ARS" as Currency,
    balance: "",
    color: "#3b82f6",
    issuer: "" as string,
    last4Digits: "",
    expiryDate: "",
    creditLimit: "",
    closingDate: "",
  });

  /* Filters State */
  const [activeFilter, setActiveFilter] = useState<AccountType | "all">("all");

  /* Pay Credit Card Modal State */
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payingCard, setPayingCard] = useState<Account | null>(null);
  const [payFormData, setPayFormData] = useState({
    sourceAccountId: "",
    totalAmount: "",
    includesFees: false,
    feesAmount: "",
    feesDescription: "Intereses y comisiones",
  });
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const handleFilterChange = (type: AccountType | "all") => {
    setActiveFilter(type);
  };

  useEffect(() => {
    dispatch(fetchAccounts());
  }, [dispatch]);

  const handleOpenModal = (account?: Account) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        name: account.name,
        type: account.type,
        currency: account.currency,
        balance:
          account.type === "credit_card"
            ? Math.abs(account.balance).toString()
            : account.balance.toString(),
        color: account.color,
        issuer: account.issuer || "",
        last4Digits: account.last4Digits || "",
        expiryDate: account.expiryDate || "",
        creditLimit: account.creditLimit?.toString() || "",
        closingDate: account.closingDate || "",
      });
    } else {
      setEditingAccount(null);
      setFormData({
        name: "",
        type: "bank",
        currency: "ARS",
        balance: "",
        color: "#3b82f6",
        issuer: "",
        last4Digits: "",
        expiryDate: "",
        creditLimit: "",
        closingDate: "",
      });
    }
    setIsModalOpen(true);
    setMenuOpenId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Base account data
    const accountData: Omit<
      Account,
      "_id" | "userId" | "createdAt" | "updatedAt" | "initialBalance"
    > = {
      name: formData.name,
      type: formData.type,
      currency: formData.currency,
      color: formData.color,
      icon: formData.type,
      isActive: true,
      // Only set balance if it's a new account (initial balance)
      // or if we decide to allow balance editing.
      // Current design: Balance is editable in the form.
      balance: parseFloat(formData.balance.replace(/\./g, "")) || 0,
    };

    // For credit cards, the balance input represents debt, so we store it as a negative number.
    if (formData.type === "credit_card") {
      accountData.balance = -Math.abs(accountData.balance);
    }

    if (formData.type === "credit_card") {
      accountData.issuer = formData.issuer as
        | "VISA"
        | "Mastercard"
        | "American Express";
      accountData.last4Digits = formData.last4Digits;
      accountData.expiryDate = formData.expiryDate;
      accountData.creditLimit =
        parseFloat(formData.creditLimit.replace(/\./g, "")) || 0;
      accountData.closingDate = formData.closingDate;
    }

    if (editingAccount) {
      await dispatch(
        updateAccount({ id: editingAccount._id, data: accountData })
      );
    } else {
      await dispatch(createAccount(accountData));
    }
    dispatch(fetchAccounts());
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de eliminar esta cuenta?")) {
      await dispatch(deleteAccount(id));
      dispatch(fetchAccounts());
    }
    setMenuOpenId(null);
  };

  const getNextClosingDate = (closingDate: string) => {
    // closingDate format: DD/MM
    const [day, month] = closingDate.split("/").map(Number);

    const today = new Date();
    const currentYear = today.getFullYear();

    // Create the target date for this year
    let targetDate = new Date(currentYear, month - 1, day);

    // If the date has passed this year, show next year's date
    if (targetDate < today) {
      targetDate = new Date(currentYear + 1, month - 1, day);
    }

    return targetDate.toLocaleDateString("es-AR", {
      day: "numeric",
      month: "short",
    });
  };

  // Get non-credit-card accounts with same currency as the paying card
  const getSourceAccountOptions = () => {
    if (!payingCard) return [];
    return accounts
      .filter(
        (a) =>
          a.type !== "credit_card" &&
          a.currency === payingCard.currency &&
          a._id !== payingCard._id
      )
      .map((a) => ({
        value: a._id,
        label: `${a.name} (${formatCurrency(a.balance, a.currency)})`,
      }));
  };

  const handleOpenPayModal = (creditCard: Account) => {
    setPayingCard(creditCard);
    setPayFormData({
      sourceAccountId: "",
      totalAmount: Math.abs(creditCard.balance).toString(),
      includesFees: false,
      feesAmount: "",
      feesDescription: "Intereses y comisiones",
    });
    setPaymentSuccess(false);
    setIsPayModalOpen(true);
    setMenuOpenId(null);
  };

  const handleClosePayModal = () => {
    setIsPayModalOpen(false);
    setPayingCard(null);
    setPaymentSuccess(false);
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingCard) return;

    const totalAmount =
      parseFloat(payFormData.totalAmount.replace(/\./g, "")) || 0;
    const feesAmount = payFormData.includesFees
      ? parseFloat(payFormData.feesAmount.replace(/\./g, "")) || 0
      : 0;

    try {
      await dispatch(
        payCreditCard({
          creditCardId: payingCard._id,
          data: {
            sourceAccountId: payFormData.sourceAccountId,
            totalAmount,
            feesAmount: feesAmount > 0 ? feesAmount : undefined,
            feesDescription:
              feesAmount > 0 ? payFormData.feesDescription : undefined,
          },
        })
      ).unwrap();

      setPaymentSuccess(true);
      // Close after showing success message
      setTimeout(() => {
        handleClosePayModal();
        dispatch(fetchAccounts());
      }, 2000);
    } catch {
      // Error handled by Redux
    }
  };

  // Calculate derived values for the payment modal
  const currentDebt = payingCard ? Math.abs(payingCard.balance) : 0;
  const enteredAmount =
    parseFloat(payFormData.totalAmount.replace(/\./g, "")) || 0;
  const feesFromTotal = payFormData.includesFees
    ? parseFloat(payFormData.feesAmount.replace(/\./g, "")) || 0
    : 0;
  const selectedSourceAccount = accounts.find(
    (a) => a._id === payFormData.sourceAccountId
  );
  const hasInsufficientFunds =
    selectedSourceAccount && selectedSourceAccount.balance < enteredAmount;

  const currencyOptions = [
    { value: "ARS", label: "ARS - Peso Argentino" },
    { value: "USD", label: "USD - Dólar" },
    { value: "EUR", label: "EUR - Euro" },
    { value: "BRL", label: "BRL - Real" },
  ];

  const colorOptions = [
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
    "#ef4444",
    "#f97316",
    "#f59e0b",
    "#84cc16",
    "#10b981",
    "#14b8a6",
    "#06b6d4",
    "#6366f1",
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loading size="lg" text="Cargando cuentas..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      {/* Mobile Header & Filters */}
      <div className="md:hidden space-y-4">
        {/* Centered Title */}
        <div className="flex items-center justify-center">
          <h1 className="text-xl font-bold text-[var(--text-primary)]">
            Cuentas
          </h1>
        </div>

        {/* Filter Chips - Centered */}
        {accounts.length > 0 && (
          <div className="flex flex-col gap-3">
            {/* Type Filters - Centered horizontally */}
            <div className="flex justify-center gap-2 flex-wrap">
              {/* 'All Accounts' Chip */}
              <button
                onClick={() => handleFilterChange("all")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                  activeFilter === "all"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-transparent shadow-md shadow-emerald-500/20"
                    : "bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-color)] active:scale-95"
                }`}
              >
                Todas ({accounts.length})
              </button>

              {/* Specific Type Chips */}
              {accountGroups.map((group) => {
                const count = accounts.filter(
                  (a) => a.type === group.type
                ).length;
                if (count === 0) return null;

                const isActive = activeFilter === group.type;

                // Colors based on account type
                const typeColors = {
                  cash: "from-green-500 to-emerald-600 shadow-green-500/20",
                  bank: "from-blue-500 to-indigo-600 shadow-blue-500/20",
                  investment:
                    "from-purple-500 to-violet-600 shadow-purple-500/20",
                  credit_card:
                    "from-orange-500 to-red-500 shadow-orange-500/20",
                };
                const activeColor =
                  typeColors[group.type as keyof typeof typeColors] ||
                  "from-gray-500 to-slate-600 shadow-gray-500/20";

                return (
                  <button
                    key={group.type}
                    onClick={() => handleFilterChange(group.type)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                      isActive
                        ? `bg-gradient-to-r ${activeColor} text-white border-transparent shadow-md`
                        : "bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-color)] active:scale-95"
                    }`}
                  >
                    {group.label} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-[var(--text-primary)]">
            Cuentas
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Administra tus cuentas y saldos
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} leftIcon={<Plus size={18} />}>
          Nueva cuenta
        </Button>
      </div>

      {/* Filters & Groups */}
      <div className="space-y-6 md:space-y-8">
        {/* Desktop Filter Chips */}
        {accounts.length > 0 && (
          <div className="hidden md:flex flex-wrap gap-2">
            {/* 'All Accounts' Chip */}
            <button
              onClick={() => handleFilterChange("all")}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all
                ${
                  activeFilter === "all"
                    ? "bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-sm"
                    : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                }
              `}
            >
              <Wallet size={16} />
              Todas las cuentas
              <span
                className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${
                  activeFilter === "all"
                    ? "bg-[var(--bg-primary)] text-[var(--text-primary)]"
                    : "bg-[var(--text-muted)] text-white"
                }`}
              >
                {accounts.length}
              </span>
            </button>

            {/* Specific Type Chips */}
            {accountGroups.map((group) => {
              const count = accounts.filter(
                (a) => a.type === group.type
              ).length;
              if (count === 0) return null;

              const isVisible = activeFilter === group.type;
              return (
                <button
                  key={group.type}
                  onClick={() => handleFilterChange(group.type)}
                  className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all
                    ${
                      isVisible
                        ? "bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-sm"
                        : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                    }
                  `}
                >
                  {accountIcons[group.type]}
                  {group.label}
                  <span
                    className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${
                      isVisible
                        ? "bg-[var(--bg-primary)] text-[var(--text-primary)]"
                        : "bg-[var(--text-muted)] text-white"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Grouped Accounts - Mobile Version */}
        {accounts.length > 0 ? (
          <>
            {/* Mobile List View */}
            <div className="md:hidden space-y-6">
              {accountGroups.map((group) => {
                if (activeFilter !== "all" && activeFilter !== group.type)
                  return null;
                const groupAccounts = accounts.filter(
                  (a) => a.type === group.type
                );
                if (groupAccounts.length === 0) return null;

                return (
                  <section key={group.type} className="animate-fade-in">
                    {/* Group Header - Centered */}
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <span
                        className="text-[var(--text-muted)]"
                        style={{ opacity: 0.7 }}
                      >
                        {accountIcons[group.type]}
                      </span>
                      <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
                        {group.label}
                      </h3>
                    </div>

                    {/* Account Cards - Compact List */}
                    <Card
                      padding="none"
                      className="overflow-visible rounded-xl"
                    >
                      <div className="divide-y divide-[var(--border-color)]">
                        {groupAccounts.map((account, accountIndex) => (
                          <div
                            key={account._id}
                            className={`flex items-center justify-between p-3.5 hover:bg-[var(--bg-card-hover)] active:bg-[var(--bg-elevated)] transition-colors ${
                              accountIndex === 0 ? "rounded-t-xl" : ""
                            } ${
                              accountIndex === groupAccounts.length - 1
                                ? "rounded-b-xl"
                                : ""
                            }`}
                          >
                            {/* Left: Icon + Info */}
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                style={{
                                  backgroundColor: `${account.color}15`,
                                  color: account.color,
                                }}
                              >
                                {accountIcons[account.type]}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-sm text-[var(--text-primary)] truncate">
                                  {account.name}
                                </p>
                                <p className="text-xs text-[var(--text-secondary)] truncate">
                                  {account.type === "credit_card"
                                    ? `${account.issuer} •••• ${account.last4Digits}`
                                    : account.currency}
                                </p>
                              </div>
                            </div>

                            {/* Right: Balance + Menu */}
                            <div className="flex items-center gap-2 shrink-0 pl-2">
                              <div className="text-right">
                                {account.type === "credit_card" ? (
                                  <>
                                    <p className="text-sm font-bold text-[var(--text-primary)]">
                                      {formatCurrency(
                                        Math.abs(account.balance),
                                        account.currency
                                      )}
                                    </p>
                                    {account.creditLimit && (
                                      <p className="text-[10px] text-[var(--text-muted)]">
                                        Disp:{" "}
                                        {formatCurrency(
                                          account.creditLimit + account.balance,
                                          account.currency
                                        )}
                                      </p>
                                    )}
                                  </>
                                ) : (
                                  <p
                                    className="text-sm font-bold"
                                    style={{
                                      color:
                                        account.balance >= 0
                                          ? "var(--accent-success)"
                                          : "var(--accent-danger)",
                                    }}
                                  >
                                    {formatCurrency(
                                      account.balance,
                                      account.currency
                                    )}
                                  </p>
                                )}
                              </div>

                              {/* Menu Button */}
                              <div className="relative">
                                <button
                                  onClick={() =>
                                    setMenuOpenId(
                                      menuOpenId === account._id
                                        ? null
                                        : account._id
                                    )
                                  }
                                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] active:scale-95 transition-all"
                                >
                                  <MoreVertical size={16} />
                                </button>

                                {menuOpenId === account._id && (
                                  <div
                                    className={`absolute right-0 w-40 bg-white border border-[var(--border-color)] rounded-xl shadow-xl z-50 overflow-hidden ${
                                      accountIndex >= groupAccounts.length - 1
                                        ? "bottom-full mb-1 animate-slide-up"
                                        : "top-full mt-1 animate-slide-down"
                                    }`}
                                  >
                                    {account.type === "credit_card" && (
                                      <button
                                        onClick={() =>
                                          handleOpenPayModal(account)
                                        }
                                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium text-[var(--accent-success)] hover:bg-[var(--accent-success-bg)] transition-colors border-b border-[var(--border-color)]"
                                      >
                                        <DollarSign size={14} />
                                        Pagar
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleOpenModal(account)}
                                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
                                    >
                                      <Edit2 size={14} />
                                      Editar
                                    </button>
                                    <button
                                      onClick={() => handleDelete(account._id)}
                                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium text-[var(--accent-danger)] hover:bg-[var(--accent-danger-bg)] transition-colors"
                                    >
                                      <Trash2 size={14} />
                                      Eliminar
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </section>
                );
              })}
            </div>

            {/* Desktop Grid View */}
            <div className="hidden md:block space-y-10">
              {accountGroups.map((group) => {
                if (activeFilter !== "all" && activeFilter !== group.type)
                  return null;
                const groupAccounts = accounts.filter(
                  (a) => a.type === group.type
                );
                if (groupAccounts.length === 0) return null;

                return (
                  <section key={group.type} className="animate-fade-in">
                    <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                      {accountIcons[group.type]} {group.label}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {groupAccounts.map((account) => (
                        <Card
                          key={account._id}
                          className="relative overflow-visible group min-h-[220px] flex flex-col justify-between"
                          hover
                        >
                          {/* Decorative gradient */}
                          <div
                            className="absolute top-0 right-0 w-40 h-40 rounded-full -translate-y-1/2 translate-x-1/2 opacity-10 group-hover:opacity-20 transition-opacity duration-300"
                            style={{ backgroundColor: account.color }}
                          />

                          <div className="relative z-10">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-105"
                                  style={{
                                    backgroundColor: `${account.color}15`,
                                    color: account.color,
                                  }}
                                >
                                  {accountIcons[account.type]}
                                </div>
                                <div>
                                  <h3 className="font-bold text-[var(--text-primary)] text-lg leading-tight">
                                    {account.name}
                                  </h3>
                                  <p className="text-xs text-[var(--text-secondary)] font-medium">
                                    {account.type === "credit_card"
                                      ? `${account.issuer} •••• ${account.last4Digits}`
                                      : account.type === "bank"
                                      ? "Cuenta Bancaria"
                                      : account.type === "cash"
                                      ? "Efectivo"
                                      : account.type === "wallet"
                                      ? "Billetera Virtual"
                                      : "Criptomonedas"}
                                  </p>
                                </div>
                              </div>

                              {/* Menu */}
                              <div className="relative">
                                <button
                                  onClick={() =>
                                    setMenuOpenId(
                                      menuOpenId === account._id
                                        ? null
                                        : account._id
                                    )
                                  }
                                  className="p-2 rounded-xl hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-all duration-200"
                                >
                                  <MoreVertical size={18} />
                                </button>

                                {menuOpenId === account._id && (
                                  <div className="absolute right-0 top-full mt-2 w-44 bg-white border border-[var(--border-color)] rounded-xl shadow-xl z-50 overflow-hidden animate-slide-down">
                                    {account.type === "credit_card" && (
                                      <button
                                        onClick={() =>
                                          handleOpenPayModal(account)
                                        }
                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--accent-success)] hover:bg-[var(--accent-success-bg)] transition-colors border-b border-[var(--border-color)]"
                                      >
                                        <DollarSign size={16} />
                                        Pagar Tarjeta
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleOpenModal(account)}
                                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
                                    >
                                      <Edit2 size={16} />
                                      Editar
                                    </button>
                                    <button
                                      onClick={() => handleDelete(account._id)}
                                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--accent-danger)] hover:bg-[var(--accent-danger-bg)] transition-colors"
                                    >
                                      <Trash2 size={16} />
                                      Eliminar
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Main Metric */}
                            <div className="mb-4">
                              {account.type === "credit_card" ? (
                                <div>
                                  <p className="text-sm text-[var(--text-secondary)] font-medium mb-1">
                                    Deuda actual
                                  </p>
                                  <p className="text-2xl font-bold text-[var(--text-primary)]">
                                    {formatCurrency(
                                      Math.abs(account.balance),
                                      account.currency
                                    )}
                                  </p>
                                </div>
                              ) : (
                                <div>
                                  <p className="text-sm text-[var(--text-secondary)] font-medium mb-1">
                                    Saldo total
                                  </p>
                                  <p
                                    className="text-2xl font-bold"
                                    style={{
                                      color:
                                        account.balance >= 0
                                          ? "var(--accent-success)"
                                          : "var(--accent-danger)",
                                    }}
                                  >
                                    {formatCurrency(
                                      account.balance,
                                      account.currency
                                    )}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Secondary Info */}
                            {account.type === "credit_card" &&
                            account.creditLimit &&
                            account.closingDate ? (
                              <div className="space-y-3">
                                <div>
                                  <div className="flex justify-between text-xs font-medium mb-1.5">
                                    <span className="text-[var(--text-secondary)]">
                                      Disponible:{" "}
                                      {formatCurrency(
                                        account.creditLimit + account.balance,
                                        account.currency
                                      )}
                                    </span>
                                    <span className="text-[var(--text-muted)]">
                                      Límite:{" "}
                                      {formatCurrency(
                                        account.creditLimit,
                                        account.currency
                                      )}
                                    </span>
                                  </div>
                                  <div className="h-1.5 w-full bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full transition-all duration-500"
                                      style={{
                                        width: `${Math.max(
                                          0,
                                          Math.min(
                                            ((account.creditLimit +
                                              account.balance) /
                                              account.creditLimit) *
                                              100,
                                            100
                                          )
                                        )}%`,
                                        backgroundColor: account.color,
                                      }}
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)]">
                                  <span className="text-xs text-[var(--text-muted)] font-medium">
                                    Próximo cierre
                                  </span>
                                  <span className="text-sm font-semibold text-[var(--text-primary)]">
                                    {getNextClosingDate(account.closingDate)}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              // Placeholder for normal accounts or simpler view
                              <div className="pt-2 border-t border-[var(--border-color)]">
                                <p className="text-xs text-[var(--text-muted)]">
                                  {account.updatedAt
                                    ? `Actualizado: ${new Date(
                                        account.updatedAt
                                      ).toLocaleDateString()}`
                                    : "Sin actividad reciente"}
                                </p>
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </>
        ) : (
          <Card className="text-center py-12 md:py-16">
            <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 md:mb-6 rounded-2xl bg-[var(--bg-elevated)] flex items-center justify-center">
              <Wallet
                size={28}
                className="md:hidden text-[var(--text-muted)]"
              />
              <Wallet
                size={36}
                className="hidden md:block text-[var(--text-muted)]"
              />
            </div>
            <h3 className="text-lg md:text-xl font-bold text-[var(--text-primary)] mb-2">
              No tienes cuentas
            </h3>
            <p className="text-sm md:text-base text-[var(--text-secondary)] mb-4 md:mb-6 max-w-sm mx-auto px-4">
              Crea tu primera cuenta para empezar a registrar tus finanzas
            </p>
            <Button
              onClick={() => handleOpenModal()}
              leftIcon={<Plus size={18} />}
            >
              Crear cuenta
            </Button>
          </Card>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAccount ? "Editar cuenta" : "Nueva cuenta"}
        size="3xl"
      >
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column: General Info */}
            <div className="space-y-5">
              <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border-color)] pb-2 mb-4">
                Información General
              </h3>

              <Input
                label="Nombre de la cuenta"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder={
                  formData.type === "credit_card"
                    ? "Ej: Tarjeta Santander"
                    : "Ej: Banco Nación"
                }
                required
              />

              <Select
                label="Tipo de cuenta"
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as AccountType,
                  })
                }
                options={[
                  { value: "cash", label: "Efectivo" },
                  { value: "wallet", label: "Billetera" },
                  { value: "bank", label: "Banco" },
                  { value: "crypto", label: "Cripto" },
                  { value: "credit_card", label: "Tarjeta de Crédito" },
                ]}
              />

              <Select
                label="Moneda"
                value={formData.currency}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    currency: e.target.value as Currency,
                  })
                }
                options={currencyOptions}
              />

              <div>
                <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">
                  Color
                </label>
                <div className="flex flex-wrap gap-3">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-8 h-8 rounded-full transition-all duration-200 ${
                        formData.color === color
                          ? "ring-2 ring-[var(--accent-primary)] ring-offset-2 ring-offset-white scale-110"
                          : "hover:scale-105 opacity-70 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Specific Details */}
            <div className="space-y-5">
              <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border-color)] pb-2 mb-4">
                Detalles de la Cuenta
              </h3>

              {formData.type === "credit_card" ? (
                <>
                  <Select
                    label="Emisora"
                    value={formData.issuer}
                    onChange={(e) =>
                      setFormData({ ...formData, issuer: e.target.value })
                    }
                    options={[
                      { value: "VISA", label: "VISA" },
                      { value: "Mastercard", label: "Mastercard" },
                      { value: "American Express", label: "American Express" },
                    ]}
                    placeholder="Seleccionar..."
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Últimos 4 dígitos"
                      value={formData.last4Digits}
                      onChange={(e) => {
                        const val = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 4);
                        setFormData({ ...formData, last4Digits: val });
                      }}
                      placeholder="1234"
                      required
                    />
                    <Input
                      label="Vencimiento (MM/YY)"
                      value={formData.expiryDate}
                      onChange={(e) => {
                        let val = e.target.value;
                        if (
                          val.length === 2 &&
                          formData.expiryDate.length === 1
                        ) {
                          val += "/";
                        }
                        if (val.length > 5) return;
                        setFormData({ ...formData, expiryDate: val });
                      }}
                      placeholder="MM/YY"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Día de Cierre"
                      value={formData.closingDate}
                      onChange={(e) => {
                        let val = e.target.value;
                        // Auto-add slash after DD
                        if (
                          val.length === 2 &&
                          formData.closingDate.length === 1
                        ) {
                          val += "/";
                        }
                        if (val.length > 5) return;
                        setFormData({ ...formData, closingDate: val });
                      }}
                      placeholder="DD/MM"
                      required
                    />
                    <Input
                      label="Límite de crédito"
                      value={formData.creditLimit}
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/\./g, "");
                        if (!/^\d*$/.test(rawValue)) return;
                        const numberValue = parseInt(rawValue, 10);
                        if (isNaN(numberValue)) {
                          setFormData({ ...formData, creditLimit: "" });
                          return;
                        }
                        const formatted = new Intl.NumberFormat("es-AR").format(
                          numberValue
                        );
                        setFormData({ ...formData, creditLimit: formatted });
                      }}
                      placeholder="$$$"
                      required
                    />
                  </div>

                  <div className="pt-2">
                    <Input
                      label="Deuda Actual (Saldo)"
                      value={formData.balance}
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/\./g, "");
                        if (!/^\d*$/.test(rawValue)) return;
                        const numberValue = parseInt(rawValue, 10);
                        if (isNaN(numberValue)) {
                          setFormData({ ...formData, balance: "" });
                          return;
                        }
                        const formatted = new Intl.NumberFormat("es-AR").format(
                          numberValue
                        );
                        setFormData({ ...formData, balance: formatted });
                      }}
                      placeholder="0"
                    />
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      * El saldo en tarjetas se considera deuda.
                    </p>
                  </div>
                </>
              ) : (
                <div className="bg-[var(--bg-elevated)] p-5 rounded-xl border border-[var(--border-color)]">
                  <Input
                    label="Saldo actual"
                    type="text"
                    value={formData.balance}
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/\./g, "");
                      if (!/^\d*$/.test(rawValue)) return;
                      const numberValue = parseInt(rawValue, 10);
                      if (isNaN(numberValue)) {
                        setFormData({ ...formData, balance: "" });
                        return;
                      }
                      const formatted = new Intl.NumberFormat("es-AR").format(
                        numberValue
                      );
                      setFormData({ ...formData, balance: formatted });
                    }}
                    placeholder="0"
                  />
                  <p className="text-xs text-[var(--text-muted)] mt-3">
                    Ingresa el saldo actual de la cuenta. Podrás ajustarlo más
                    tarde mediante transacciones de "Ajuste de Balance".
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-6 mt-6 border-t border-[var(--border-color)]">
            <div className="w-full sm:w-auto grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  !formData.name ||
                  (formData.type === "credit_card"
                    ? !formData.issuer ||
                      !formData.last4Digits ||
                      !formData.expiryDate ||
                      !formData.creditLimit ||
                      !formData.closingDate
                    : formData.balance === "")
                }
              >
                {editingAccount ? "Guardar" : "Crear"}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Pay Credit Card Modal */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={handleClosePayModal}
        title="Pagar Tarjeta de Crédito"
        size="lg"
      >
        {paymentSuccess ? (
          <div className="py-12 text-center animate-fade-in">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--accent-success-bg)] flex items-center justify-center">
              <CheckCircle2
                size={40}
                className="text-[var(--accent-success)]"
              />
            </div>
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
              ¡Pago registrado!
            </h3>
            <p className="text-[var(--text-secondary)]">
              El pago de tu tarjeta se ha registrado correctamente.
            </p>
          </div>
        ) : (
          <form onSubmit={handlePaySubmit} className="space-y-6">
            {/* Card Info Summary */}
            {payingCard && (
              <div className="bg-gradient-to-r from-[var(--bg-elevated)] to-[var(--bg-hover)] p-5 rounded-2xl border border-[var(--border-color)]">
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{
                      backgroundColor: `${payingCard.color}20`,
                      color: payingCard.color,
                    }}
                  >
                    <CreditCard size={28} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-[var(--text-primary)] text-lg">
                      {payingCard.name}
                    </h4>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {payingCard.issuer} •••• {payingCard.last4Digits}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-[var(--text-secondary)]">
                      Deuda registrada
                    </p>
                    <p className="text-xl font-bold text-[var(--text-primary)]">
                      {formatCurrency(currentDebt, payingCard.currency)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Source Account */}
            <Select
              label="Pagar desde"
              value={payFormData.sourceAccountId}
              onChange={(e) =>
                setPayFormData({
                  ...payFormData,
                  sourceAccountId: e.target.value,
                })
              }
              options={getSourceAccountOptions()}
              placeholder="Seleccionar cuenta..."
              required
            />

            {hasInsufficientFunds && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--accent-danger-bg)] text-[var(--accent-danger)]">
                <AlertCircle size={18} />
                <span className="text-sm font-medium">
                  Saldo insuficiente en la cuenta seleccionada
                </span>
              </div>
            )}

            {/* Total Payment Amount */}
            <div>
              <Input
                label="Monto total a pagar (según resumen)"
                value={payFormData.totalAmount}
                onChange={(e) => {
                  const rawValue = e.target.value.replace(/\./g, "");
                  if (!/^\d*$/.test(rawValue)) return;
                  const numberValue = parseInt(rawValue, 10);
                  if (isNaN(numberValue)) {
                    setPayFormData({ ...payFormData, totalAmount: "" });
                    return;
                  }
                  const formatted = new Intl.NumberFormat("es-AR").format(
                    numberValue
                  );
                  setPayFormData({ ...payFormData, totalAmount: formatted });
                }}
                placeholder="0"
                required
              />
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Ingresa el monto total que figura en tu resumen de tarjeta
              </p>
            </div>

            {/* Fees Section */}
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={payFormData.includesFees}
                  onChange={(e) =>
                    setPayFormData({
                      ...payFormData,
                      includesFees: e.target.checked,
                      feesAmount: e.target.checked
                        ? payFormData.feesAmount
                        : "",
                    })
                  }
                  className="w-5 h-5 rounded-md border-2 border-[var(--border-color)] focus:ring-2 focus:ring-[var(--accent-primary)] cursor-pointer"
                />
                <span className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                  El monto incluye intereses o comisiones adicionales
                </span>
              </label>

              {payFormData.includesFees && (
                <div className="ml-8 space-y-4 animate-fade-in">
                  <Input
                    label="Monto de intereses/comisiones"
                    value={payFormData.feesAmount}
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/\./g, "");
                      if (!/^\d*$/.test(rawValue)) return;
                      const numberValue = parseInt(rawValue, 10);
                      if (isNaN(numberValue)) {
                        setPayFormData({ ...payFormData, feesAmount: "" });
                        return;
                      }
                      const formatted = new Intl.NumberFormat("es-AR").format(
                        numberValue
                      );
                      setPayFormData({ ...payFormData, feesAmount: formatted });
                    }}
                    placeholder="0"
                  />
                  <Input
                    label="Descripción (opcional)"
                    value={payFormData.feesDescription}
                    onChange={(e) =>
                      setPayFormData({
                        ...payFormData,
                        feesDescription: e.target.value,
                      })
                    }
                    placeholder="Ej: Intereses por pago mínimo"
                  />
                  {feesFromTotal > 0 && (
                    <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)]">
                      <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                        <ArrowRight size={16} />
                        <span className="text-sm">
                          <strong className="text-[var(--text-primary)]">
                            {formatCurrency(
                              feesFromTotal,
                              payingCard?.currency || "ARS"
                            )}
                          </strong>{" "}
                          se registrará como gasto en{" "}
                          <span className="font-medium text-[var(--accent-danger)]">
                            "Intereses / Comisiones"
                          </span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Summary */}
            {payFormData.sourceAccountId && enteredAmount > 0 && (
              <div className="p-5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-color)] space-y-3">
                <h4 className="font-semibold text-[var(--text-primary)]">
                  Resumen del pago
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">
                      Transferencia a tarjeta
                    </span>
                    <span className="font-medium text-[var(--text-primary)]">
                      {formatCurrency(
                        enteredAmount,
                        payingCard?.currency || "ARS"
                      )}
                    </span>
                  </div>
                  {feesFromTotal > 0 && (
                    <div className="flex justify-between text-[var(--accent-danger)]">
                      <span>Gastos (intereses/comisiones)</span>
                      <span className="font-medium">
                        {formatCurrency(
                          feesFromTotal,
                          payingCard?.currency || "ARS"
                        )}
                      </span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-[var(--border-color)] flex justify-between">
                    <span className="text-[var(--text-secondary)]">
                      Nueva deuda de tarjeta
                    </span>
                    <span className="font-bold text-[var(--accent-success)]">
                      {formatCurrency(
                        Math.max(
                          0,
                          currentDebt - enteredAmount + feesFromTotal
                        ),
                        payingCard?.currency || "ARS"
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t border-[var(--border-color)]">
              <Button
                type="button"
                variant="secondary"
                onClick={handleClosePayModal}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  !payFormData.sourceAccountId ||
                  !payFormData.totalAmount ||
                  enteredAmount <= 0 ||
                  hasInsufficientFunds ||
                  isLoading
                }
                leftIcon={<DollarSign size={18} />}
              >
                {isLoading ? "Procesando..." : "Registrar Pago"}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* FAB for Mobile */}
      <button
        onClick={() => handleOpenModal()}
        className="md:hidden fixed bottom-24 right-4 w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/30 flex items-center justify-center z-30 hover:from-emerald-600 hover:to-teal-700 active:scale-95 transition-all"
        aria-label="Nueva cuenta"
      >
        <Plus size={24} />
      </button>
    </div>
  );
};

export default Accounts;
