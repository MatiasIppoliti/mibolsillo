import React, { useEffect, useState } from "react";
import {
  Tags,
  Plus,
  TrendingUp,
  TrendingDown,
  Edit2,
  Trash2,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../hooks/useRedux";
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../features/categories/categoriesSlice";
import {
  Card,
  Button,
  Modal,
  Input,
  Select,
  Loading,
  Badge,
} from "../components/common";
import type { Category, CategoryType } from "../types";

const Categories: React.FC = () => {
  const dispatch = useAppDispatch();
  const { incomeCategories, expenseCategories, isLoading } = useAppSelector(
    (state) => state.categories
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [activeTab, setActiveTab] = useState<CategoryType>("expense");
  const [formData, setFormData] = useState({
    name: "",
    type: "expense" as CategoryType,
    icon: "tag",
    color: "#6366f1",
  });

  useEffect(() => {
    dispatch(fetchCategories({}));
  }, [dispatch]);

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        type: category.type,
        icon: category.icon,
        color: category.color,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: "",
        type: activeTab,
        icon: "tag",
        color: "#6366f1",
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingCategory) {
        await dispatch(
          updateCategory({
            id: editingCategory._id,
            data: {
              name: formData.name,
              icon: formData.icon,
              color: formData.color,
            },
          })
        ).unwrap();
      } else {
        await dispatch(
          createCategory({
            name: formData.name,
            type: formData.type,
            icon: formData.icon,
            color: formData.color,
          })
        ).unwrap();
      }

      // Force refresh to ensure consistency
      dispatch(fetchCategories({}));
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to save category:", error);
      alert("Error al guardar la categoría. Por favor intente nuevamente.");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de eliminar esta categoría?")) {
      try {
        await dispatch(deleteCategory(id)).unwrap();
        dispatch(fetchCategories({}));
      } catch (error) {
        console.error("Failed to delete category:", error);
        alert("Error al eliminar la categoría.");
      }
    }
  };

  const colorOptions = [
    "#ef4444",
    "#f97316",
    "#f59e0b",
    "#84cc16",
    "#10b981",
    "#14b8a6",
    "#06b6d4",
    "#3b82f6",
    "#6366f1",
    "#8b5cf6",
    "#a855f7",
    "#ec4899",
    "#f43f5e",
  ];

  const currentCategories =
    activeTab === "income" ? incomeCategories : expenseCategories;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loading size="lg" text="Cargando categorías..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Categorías</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Organiza tus ingresos y gastos
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} leftIcon={<Plus size={18} />}>
          Nueva categoría
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-[var(--bg-card)] rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("expense")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            activeTab === "expense"
              ? "bg-[var(--accent-danger)]/20 text-[var(--accent-danger)]"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <TrendingDown size={18} />
          Gastos
          <Badge variant="danger" size="sm">
            {expenseCategories.length}
          </Badge>
        </button>
        <button
          onClick={() => setActiveTab("income")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            activeTab === "income"
              ? "bg-[var(--accent-success)]/20 text-[var(--accent-success)]"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <TrendingUp size={18} />
          Ingresos
          <Badge variant="success" size="sm">
            {incomeCategories.length}
          </Badge>
        </button>
      </div>

      {/* Categories Grid */}
      {currentCategories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {currentCategories.map((category) => (
            <Card
              key={category._id}
              className="flex items-center justify-between group hover:border-[var(--accent-primary)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                  style={{ backgroundColor: category.color }}
                >
                  {activeTab === "income" ? (
                    <TrendingUp size={18} />
                  ) : (
                    <TrendingDown size={18} />
                  )}
                </div>
                <span className="font-medium">{category.name}</span>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleOpenModal(category)}
                  className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(category._id)}
                  className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--accent-danger)]"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <Tags size={48} className="mx-auto text-[var(--text-muted)] mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            No hay categorías de{" "}
            {activeTab === "income" ? "ingresos" : "gastos"}
          </h3>
          <p className="text-[var(--text-secondary)] mb-4">
            Crea categorías para organizar mejor tus finanzas
          </p>
          <Button
            onClick={() => handleOpenModal()}
            leftIcon={<Plus size={18} />}
          >
            Crear categoría
          </Button>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? "Editar categoría" : "Nueva categoría"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Nombre"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ej: Alimentación"
            required
          />

          {!editingCategory && (
            <Select
              label="Tipo"
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as CategoryType,
                })
              }
              options={[
                { value: "expense", label: "Gasto" },
                { value: "income", label: "Ingreso" },
              ]}
            />
          )}

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    formData.color === color
                      ? "ring-2 ring-white ring-offset-2 ring-offset-[var(--bg-secondary)] scale-110"
                      : ""
                  }`}
                  style={{ backgroundColor: color }}
                />
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
              {editingCategory ? "Guardar" : "Crear categoría"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Categories;
