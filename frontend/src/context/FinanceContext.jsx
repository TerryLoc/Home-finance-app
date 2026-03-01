import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import useLocalStorage from "../hooks/useLocalStorage";
import { createDemoTransactions, DEFAULT_BUCKET_TARGETS } from "../utils/budgetHelpers";

const FinanceContext = createContext(null);

const defaultSettings = {
  monthlyIncomes: {},
  currency: "EUR",
  bucketTargets: DEFAULT_BUCKET_TARGETS,
};

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
            [monthKey]: Number(amount || 0),
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
        transactions: [{ id: generateId(), ...action.payload }, ...state.transactions],
      };

    case "UPDATE_TRANSACTION":
      return {
        ...state,
        transactions: state.transactions.map((transaction) =>
          transaction.id === action.payload.id ? action.payload : transaction,
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
        goals: [{ id: generateId(), ...action.payload }, ...state.goals],
      };

    case "UPDATE_GOAL":
      return {
        ...state,
        goals: state.goals.map((goal) =>
          goal.id === action.payload.id ? action.payload : goal,
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
  const [storedSettings, setStoredSettings] = useLocalStorage("hft_settings", null);
  const [storedTransactions, setStoredTransactions] = useLocalStorage(
    "hft_transactions",
    null,
  );
  const [storedGoals, setStoredGoals] = useLocalStorage("hft_goals", null);

  const [state, dispatch] = useReducer(reducer, {
    settings: migrateSettings(storedSettings),
    transactions: storedTransactions ?? createDemoTransactions(),
    goals: storedGoals ?? [],
  });

  useEffect(() => {
    if (JSON.stringify(storedSettings) !== JSON.stringify(state.settings)) {
      setStoredSettings(state.settings);
    }
  }, [state.settings, storedSettings, setStoredSettings]);

  useEffect(() => {
    if (JSON.stringify(storedTransactions) !== JSON.stringify(state.transactions)) {
      setStoredTransactions(state.transactions);
    }
  }, [state.transactions, storedTransactions, setStoredTransactions]);

  useEffect(() => {
    if (JSON.stringify(storedGoals) !== JSON.stringify(state.goals)) {
      setStoredGoals(state.goals);
    }
  }, [state.goals, storedGoals, setStoredGoals]);

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
