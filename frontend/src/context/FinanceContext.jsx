/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { createDemoTransactions, DEFAULT_BUCKET_TARGETS } from "../utils/budgetHelpers";

const FinanceContext = createContext(null);

const defaultSettings = {
  monthlyIncomes: {},
  currency: "EUR",
  bucketTargets: DEFAULT_BUCKET_TARGETS,
};

const STORAGE_KEYS = {
  settings: "hft_settings",
  transactions: "hft_transactions",
  goals: "hft_goals",
};

function readStorage(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota and serialization issues.
  }
}

/** Migrate old single monthlyIncome → per-month map */
function migrateSettings(raw) {
  if (!raw) return defaultSettings;
  if (raw.monthlyIncome !== undefined && !raw.monthlyIncomes) {
    const today = new Date();
    const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    return {
      ...raw,
      monthlyIncomes: { [key]: Number(raw.monthlyIncome || 0) },
      monthlyIncome: undefined,
    };
  }
  return { ...defaultSettings, ...raw };
}

function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.floor(Math.random() * 10_000)}`;
}

function toNumber(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function normalizeTransaction(transaction) {
  return {
    ...transaction,
    amount: toNumber(transaction.amount),
    date: transaction.date || new Date().toISOString().slice(0, 10),
    description: String(transaction.description || "").trim(),
    category: String(transaction.category || "").trim(),
    type: transaction.type === "income" ? "income" : "expense",
  };
}

function normalizeGoal(goal) {
  return {
    ...goal,
    name: String(goal.name || "").trim(),
    targetAmount: toNumber(goal.targetAmount),
    currentAmount: toNumber(goal.currentAmount),
    targetDate: goal.targetDate || "",
  };
}

function createInitialState() {
  const storedSettings = readStorage(STORAGE_KEYS.settings, null);
  const storedTransactions = readStorage(STORAGE_KEYS.transactions, null);
  const storedGoals = readStorage(STORAGE_KEYS.goals, null);

  const transactions = Array.isArray(storedTransactions)
    ? storedTransactions.map(normalizeTransaction)
    : createDemoTransactions();

  const goals = Array.isArray(storedGoals)
    ? storedGoals.map(normalizeGoal)
    : [];

  return {
    settings: migrateSettings(storedSettings),
    transactions,
    goals,
  };
}

function reducer(state, action) {
  switch (action.type) {
    case "SET_MONTH_INCOME": {
      const { monthKey, amount } = action.payload;
      return {
        ...state,
        settings: {
          ...state.settings,
          monthlyIncomes: {
            ...state.settings.monthlyIncomes,
            [monthKey]: toNumber(amount),
          },
        },
      };
    }

    case "UPDATE_SETTINGS":
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload,
          bucketTargets: {
            ...state.settings.bucketTargets,
            ...(action.payload.bucketTargets || {}),
          },
        },
      };

    case "ADD_TRANSACTION":
      return {
        ...state,
        transactions: [
          normalizeTransaction({ id: generateId(), ...action.payload }),
          ...state.transactions,
        ],
      };

    case "UPDATE_TRANSACTION":
      return {
        ...state,
        transactions: state.transactions.map((transaction) =>
          transaction.id === action.payload.id
            ? normalizeTransaction(action.payload)
            : transaction,
        ),
      };

    case "DELETE_TRANSACTION":
      return {
        ...state,
        transactions: state.transactions.filter(
          (transaction) => transaction.id !== action.payload,
        ),
      };

    case "ADD_GOAL":
      return {
        ...state,
        goals: [normalizeGoal({ id: generateId(), ...action.payload }), ...state.goals],
      };

    case "UPDATE_GOAL":
      return {
        ...state,
        goals: state.goals.map((goal) =>
          goal.id === action.payload.id ? normalizeGoal(action.payload) : goal,
        ),
      };

    case "DELETE_GOAL":
      return {
        ...state,
        goals: state.goals.filter((goal) => goal.id !== action.payload),
      };

    default:
      return state;
  }
}

export function FinanceProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.settings, state.settings);
  }, [state.settings]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.transactions, state.transactions);
  }, [state.transactions]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.goals, state.goals);
  }, [state.goals]);

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error("useFinance must be used inside FinanceProvider");
  }
  return context;
}
