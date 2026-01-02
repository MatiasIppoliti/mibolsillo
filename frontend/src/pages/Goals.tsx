import React, { useEffect, useState } from "react";
import { Target, Plus, Calendar, Trash2, DollarSign } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../hooks/useRedux";
import {
  fetchGoals,
  createGoal,
  deleteGoal,
  contributeToGoal,
} from "../features/goals/goalsSlice";
import {
  Card,
  Button,
  Modal,
  Input,
  Select,
  Loading,
  Badge,
} from "../components/common";
import { formatCurrency } from "../utils/formatters";
import type { Goal, Currency } from "../types";

const Goals: React.FC = () => {
  const dispatch = useAppDispatch();
  const { goals, isLoading } = useAppSelector((state) => state.goals);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [contributeAmount, setContributeAmount] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    targetAmount: "",
    currency: "ARS" as Currency,
    deadline: "",
    color: "#10b981",
  });

  useEffect(() => {
    dispatch(fetchGoals(true));
  }, [dispatch]);

  const handleOpenModal = () => {
    setFormData({
      name: "",
      targetAmount: "",
      currency: "ARS",
      deadline: "",
      color: "#10b981",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await dispatch(
      createGoal({
        name: formData.name,
        targetAmount: parseFloat(formData.targetAmount),
        currency: formData.currency,
        deadline: formData.deadline || undefined,
        color: formData.color,
      })
    );
    setIsModalOpen(false);
  };

  const handleOpenContribute = (goal: Goal) => {
    setSelectedGoal(goal);
    setContributeAmount("");
    setIsContributeModalOpen(true);
  };

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedGoal) {
      await dispatch(
        contributeToGoal({
          id: selectedGoal._id,
          amount: parseFloat(contributeAmount),
        })
      );
      setIsContributeModalOpen(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de eliminar esta meta?")) {
      await dispatch(deleteGoal(id));
    }
  };

  const currencyOptions = [
    { value: "ARS", label: "ARS" },
    { value: "USD", label: "USD" },
    { value: "EUR", label: "EUR" },
    { value: "BRL", label: "BRL" },
  ];

  const colorOptions = [
    "#10b981",
    "#06b6d4",
    "#6366f1",
    "#8b5cf6",
    "#ec4899",
    "#f59e0b",
  ];

  if (isLoading && goals.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loading size="lg" text="Cargando metas..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Metas de Ahorro</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Alcanza tus objetivos financieros
          </p>
        </div>
        <Button onClick={handleOpenModal} leftIcon={<Plus size={18} />}>
          Nueva meta
        </Button>
      </div>

      {goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((g: Goal) => (
            <Card key={g._id} className="relative overflow-hidden">
              <div
                className="absolute top-0 right-0 w-40 h-40 rounded-full -translate-y-1/2 translate-x-1/2 opacity-10"
                style={{ backgroundColor: g.color }}
              ></div>

              <div className="flex items-start justify-between mb-4 relative">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${g.color}20`, color: g.color }}
                >
                  <Target size={22} />
                </div>
                <div className="flex items-center gap-2">
                  {g.isCompleted && <Badge variant="success">Completada</Badge>}
                  <button
                    onClick={() => handleDelete(g._id)}
                    className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--accent-danger)]"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-semibold">{g.name}</h3>

              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[var(--text-secondary)]">Progreso</span>
                  <span className="font-medium">{g.progress}%</span>
                </div>
                <div className="h-3 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${g.progress}%`,
                      backgroundColor: g.color,
                    }}
                  ></div>
                </div>
              </div>

              <div className="mt-4 flex justify-between items-end">
                <div>
                  <p className="text-2xl font-bold" style={{ color: g.color }}>
                    {formatCurrency(g.currentAmount, g.currency)}
                  </p>
                  <p className="text-sm text-[var(--text-muted)]">
                    de {formatCurrency(g.targetAmount, g.currency)}
                  </p>
                </div>
                {!g.isCompleted && (
                  <Button
                    size="sm"
                    onClick={() => handleOpenContribute(g)}
                    leftIcon={<DollarSign size={14} />}
                  >
                    Aportar
                  </Button>
                )}
              </div>

              {g.deadline && (
                <div className="mt-4 pt-4 border-t border-[var(--border-color)] flex items-center gap-2 text-sm text-[var(--text-muted)]">
                  <Calendar size={14} />
                  <span>
                    {g.daysRemaining !== null && g.daysRemaining !== undefined
                      ? `${g.daysRemaining} días restantes`
                      : "Sin fecha límite"}
                  </span>
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <Target size={48} className="mx-auto text-[var(--text-muted)] mb-4" />
          <h3 className="text-lg font-semibold mb-2">No tienes metas</h3>
          <p className="text-[var(--text-secondary)] mb-4">
            Crea tu primera meta de ahorro
          </p>
          <Button onClick={handleOpenModal} leftIcon={<Plus size={18} />}>
            Crear meta
          </Button>
        </Card>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nueva meta"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Nombre"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ej: Vacaciones"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Monto objetivo"
              type="number"
              min="1"
              value={formData.targetAmount}
              onChange={(e) =>
                setFormData({ ...formData, targetAmount: e.target.value })
              }
              required
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
          </div>
          <Input
            label="Fecha límite (opcional)"
            type="date"
            value={formData.deadline}
            onChange={(e) =>
              setFormData({ ...formData, deadline: e.target.value })
            }
          />
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Color
            </label>
            <div className="flex gap-2">
              {colorOptions.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: c })}
                  className={`w-8 h-8 rounded-full ${
                    formData.color === c
                      ? "ring-2 ring-white ring-offset-2 ring-offset-[var(--bg-secondary)]"
                      : ""
                  }`}
                  style={{ backgroundColor: c }}
                ></button>
              ))}
            </div>
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
            <Button type="submit" fullWidth>
              Crear meta
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isContributeModalOpen}
        onClose={() => setIsContributeModalOpen(false)}
        title={`Aportar a "${selectedGoal?.name}"`}
        size="sm"
      >
        <form onSubmit={handleContribute} className="space-y-5">
          <Input
            label="Monto a aportar"
            type="number"
            min="0.01"
            step="0.01"
            value={contributeAmount}
            onChange={(e) => setContributeAmount(e.target.value)}
            required
          />
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsContributeModalOpen(false)}
              fullWidth
            >
              Cancelar
            </Button>
            <Button type="submit" fullWidth>
              Aportar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Goals;
