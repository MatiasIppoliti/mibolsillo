import React, { useEffect, useState } from "react";
import {
  RepeatIcon,
  Plus,
  Calendar,
  Check,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../hooks/useRedux";
import {
  fetchRecurring,
  createRecurring,
  deleteRecurring,
  payRecurring,
} from "../features/recurring/recurringSlice";
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
import {
  formatCurrency,
  formatRelativeDate,
  formatFrequency,
  getTodayLocalDate,
} from "../utils/formatters";
import type { RecurringExpense, Frequency, Category } from "../types";

const Recurring: React.FC = () => {
  const dispatch = useAppDispatch();
  const { recurring, isLoading } = useAppSelector((state) => state.recurring);
  const { accounts } = useAppSelector((state) => state.accounts);
  const { expenseCategories } = useAppSelector((state) => state.categories);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    accountId: "",
    categoryId: "",
    amount: "",
    frequency: "monthly" as Frequency,
    startDate: getTodayLocalDate(),
  });

  useEffect(() => {
    dispatch(fetchRecurring());
    dispatch(fetchAccounts());
    dispatch(fetchCategories({}));
  }, [dispatch]);

  const handleOpenModal = () => {
    setFormData({
      name: "",
      accountId: accounts[0]?._id || "",
      categoryId: expenseCategories[0]?._id || "",
      amount: "",
      frequency: "monthly",
      startDate: getTodayLocalDate(),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await dispatch(
      createRecurring({
        name: formData.name,
        accountId: formData.accountId,
        categoryId: formData.categoryId,
        amount: parseFloat(formData.amount),
        frequency: formData.frequency,
        // Fix timezone issue by creating a Date at noon local time and converting to ISO
        startDate: new Date(formData.startDate + "T12:00:00").toISOString(),
      })
    );
    setIsModalOpen(false);
  };

  const handlePay = async (id: string) => {
    await dispatch(payRecurring(id));
    dispatch(fetchAccounts());
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de eliminar este gasto recurrente?")) {
      await dispatch(deleteRecurring(id));
    }
  };

  const frequencyOptions = [
    { value: "daily", label: "Diario" },
    { value: "weekly", label: "Semanal" },
    { value: "monthly", label: "Mensual" },
    { value: "yearly", label: "Anual" },
  ];

  const isDue = (nextDueDate: string) => new Date(nextDueDate) <= new Date();
  const isUpcoming = (nextDueDate: string) => {
    const now = new Date();
    const due = new Date(nextDueDate);
    const daysUntilDue = Math.ceil(
      (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilDue > 0 && daysUntilDue <= 7;
  };

  if (isLoading && recurring.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loading size="lg" text="Cargando gastos recurrentes..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Gastos Recurrentes</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Gestiona tus pagos periódicos
          </p>
        </div>
        <Button onClick={handleOpenModal} leftIcon={<Plus size={18} />}>
          Nuevo recurrente
        </Button>
      </div>

      {recurring.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recurring.map((r: RecurringExpense) => {
            const category =
              typeof r.categoryId === "object"
                ? (r.categoryId as Category)
                : null;
            const due = isDue(r.nextDueDate);
            const upcoming = isUpcoming(r.nextDueDate);

            return (
              <Card
                key={r._id}
                className={`relative overflow-hidden ${
                  due ? "border-[var(--accent-danger)]" : ""
                }`}
              >
                {due && (
                  <div className="absolute top-0 right-0 w-0 h-0 border-l-[40px] border-l-transparent border-t-[40px] border-t-[var(--accent-danger)]">
                    <AlertCircle
                      size={14}
                      className="absolute -top-[34px] right-1 text-white"
                    />
                  </div>
                )}

                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{
                      backgroundColor: `${category?.color || "#6366f1"}20`,
                      color: category?.color || "#6366f1",
                    }}
                  >
                    <RepeatIcon size={20} />
                  </div>
                  <div className="flex gap-1">
                    {due && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handlePay(r._id)}
                        leftIcon={<Check size={14} />}
                      >
                        Pagar
                      </Button>
                    )}
                    <button
                      onClick={() => handleDelete(r._id)}
                      className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--accent-danger)]"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-semibold">{r.name}</h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  {category?.name} • {formatFrequency(r.frequency)}
                </p>
                <p className="text-2xl font-bold mt-3 text-[var(--accent-danger)]">
                  {formatCurrency(r.amount, r.currency)}
                </p>

                <div className="mt-4 pt-4 border-t border-[var(--border-color)] flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                    <Calendar size={14} />
                    <span>Próximo: {formatRelativeDate(r.nextDueDate)}</span>
                  </div>
                  {due && <Badge variant="danger">Vencido</Badge>}
                  {!due && upcoming && <Badge variant="warning">Próximo</Badge>}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="text-center py-12">
          <RepeatIcon
            size={48}
            className="mx-auto text-[var(--text-muted)] mb-4"
          />
          <h3 className="text-lg font-semibold mb-2">
            No hay gastos recurrentes
          </h3>
          <p className="text-[var(--text-secondary)] mb-4">
            Agrega tus pagos periódicos
          </p>
          <Button onClick={handleOpenModal} leftIcon={<Plus size={18} />}>
            Nuevo recurrente
          </Button>
        </Card>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nuevo gasto recurrente"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Nombre"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ej: Netflix"
            required
          />
          <Select
            label="Cuenta"
            value={formData.accountId}
            onChange={(e) =>
              setFormData({ ...formData, accountId: e.target.value })
            }
            options={accounts.map((a) => ({
              value: a._id,
              label: `${a.name} (${a.currency})`,
            }))}
          />
          <Select
            label="Categoría"
            value={formData.categoryId}
            onChange={(e) =>
              setFormData({ ...formData, categoryId: e.target.value })
            }
            options={expenseCategories.map((c) => ({
              value: c._id,
              label: c.name,
            }))}
          />
          <Input
            label="Monto"
            type="number"
            step="0.01"
            min="0.01"
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: e.target.value })
            }
            required
          />
          <Select
            label="Frecuencia"
            value={formData.frequency}
            onChange={(e) =>
              setFormData({
                ...formData,
                frequency: e.target.value as Frequency,
              })
            }
            options={frequencyOptions}
          />
          <Input
            label="Fecha de inicio"
            type="date"
            value={formData.startDate}
            onChange={(e) =>
              setFormData({ ...formData, startDate: e.target.value })
            }
            required
          />
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
              fullWidth
            >
              Cancelar
            </Button>
            <Button type="submit" fullWidth>
              Crear
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Recurring;
