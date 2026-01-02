import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  PieChart,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../hooks/useRedux";
import { login, clearError } from "../../features/auth/authSlice";
import { Button, Input } from "../../components/common";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated } = useAppSelector(
    (state) => state.auth
  );

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(login({ email, password }));
  };

  return (
    <div className="min-h-screen flex w-full bg-slate-50 relative overflow-hidden">
      {/* Background Elements for Mobile/Tablet */}
      <div className="absolute top-0 right-0 w-full h-full lg:hidden z-0 bg-blue-600/5" />

      {/* 
        --------------------------------------------------
        LEFT SIDE: BRANDING & VALUE PROP (Hidden on mobile)
        --------------------------------------------------
      */}
      <div className="hidden lg:flex lg:w-5/12 relative bg-[#0f172a] overflow-hidden flex-col justify-between p-12 text-white z-10 transition-all duration-500 ease-in-out">
        {/* Animated Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/30 rounded-full blur-[100px] animate-pulse delay-75" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-violet-600/30 rounded-full blur-[100px] animate-pulse" />
        </div>

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3 animate-fade-in">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-violet-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Sparkles className="text-white" size={20} />
          </div>
          <span className="text-2xl font-bold tracking-tight">FinanceApp</span>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 space-y-8 max-w-lg">
          <h1 className="text-5xl font-extrabold leading-tight tracking-tight">
            Domina tus <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">
              Finanzas
            </span>{" "}
            app.
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed max-w-sm">
            La plataforma inteligente para gestionar gastos, visualizar metas y
            crecer tu patrimonio sin complicaciones.
          </p>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 gap-4 pt-4">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors duration-300">
              <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                <TrendingUp size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-white">
                  Análisis en tiempo real
                </h3>
                <p className="text-xs text-slate-400">
                  Visualiza tu flujo de dinero al instante
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors duration-300">
              <div className="p-2 rounded-lg bg-violet-500/20 text-violet-400">
                <PieChart size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-white">
                  Presupuestos inteligentes
                </h3>
                <p className="text-xs text-slate-400">
                  Controla gastos por categorías
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex justify-between items-center text-sm text-slate-500 pt-8 border-t border-white/10">
          <p>© 2026 FinanceApp Inc.</p>
        </div>
      </div>

      {/* 
        --------------------------------------------------
        RIGHT SIDE: LOGIN FORM
        --------------------------------------------------
      */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-24 relative z-10">
        <div className="w-full max-w-[420px] mx-auto space-y-8">
          {/* Header Mobile */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Sparkles className="text-white" size={24} />
            </div>
          </div>

          {/* Title Section */}
          <div className="text-center lg:text-left space-y-2 animate-slide-up">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
              Bienvenido de nuevo
            </h2>
            <p className="text-slate-500 text-lg">
              Ingresa tus credenciales para acceder a tu panel.
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-6 bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 animate-slide-up"
            style={{ animationDelay: "0.1s" }}
          >
            {/* Error Alert */}
            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 animate-fade-in">
                <div className="p-1 rounded-full bg-red-100 text-red-600 mt-0.5">
                  <ShieldCheck size={14} strokeWidth={3} />
                </div>
                <div className="text-sm text-red-700 font-medium">{error}</div>
              </div>
            )}

            <div className="space-y-4">
              <Input
                label="Correo Electrónico"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@ejemplo.com"
                leftIcon={<Mail size={18} className="text-slate-400" />}
                required
                className="!bg-slate-50 !border-slate-200 focus:!bg-white text-base py-3.5"
              />

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Contraseña
                  </label>
                  {/* Un-comment if Forgot Password is needed later
                       <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                         ¿Olvidaste tu contraseña?
                       </a>
                       */}
                </div>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  leftIcon={<Lock size={18} className="text-slate-400" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="hover:text-blue-600 transition-colors focus:outline-none"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  }
                  required
                  className="!bg-slate-50 !border-slate-200 focus:!bg-white text-base py-3.5"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                fullWidth
                size="lg"
                isLoading={isLoading}
                className="!rounded-xl !py-4 text-[15px] !font-bold shadow-lg shadow-blue-500/25 hover:shadow-blue-600/40 transition-all duration-300"
                rightIcon={!isLoading ? <ArrowRight size={18} /> : undefined}
              >
                Iniciar Sesión
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
