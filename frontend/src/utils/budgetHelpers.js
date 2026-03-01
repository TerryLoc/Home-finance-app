export const BUCKETS = [
  {
    key: 'fixed',
    label: 'Fixed Costs',
    min: 50,
    max: 60,
    color: '#6366f1',
  },
  {
    key: 'investments',
    label: 'Investments',
    min: 10,
    max: 100,
    color: '#22c55e',
  },
  {
    key: 'savings',
    label: 'Savings',
    min: 5,
    max: 10,
    color: '#06b6d4',
  },
  {
    key: 'guilt_free',
    label: 'Guilt-Free Spending',
    min: 20,
    max: 35,
    color: '#f59e0b',
  },
];

export const DEFAULT_BUCKET_TARGETS = {
  fixed: 55,
  investments: 15,
  savings: 10,
  guilt_free: 20,
};

const KEYWORD_BUCKET_MAP = {
  fixed: [
    'rent',
    'mortgage',
    'utility',
    'electric',
    'gas',
    'groceries',
    'aldi',
    'tesco',
    'walmart',
    'debt',
  ],
  investments: [
    'vanguard',
    'retirement',
    'index',
    'broker',
    'etf',
    'stocks',
    'isa',
    'pension',
  ],
  savings: ['emergency', 'sinking', 'goal', 'saving', 'deposit'],
  guilt_free: [
    'dining',
    'travel',
    'hobby',
    'netflix',
    'spotify',
    'fun',
    'entertainment',
  ],
};

export function getBucketMeta(bucketKey) {
  return BUCKETS.find((bucket) => bucket.key === bucketKey) ?? BUCKETS[0];
}

export function tagBucketFromDescription(description = '') {
  const clean = description.toLowerCase();

  for (const [bucket, keywords] of Object.entries(KEYWORD_BUCKET_MAP)) {
    if (keywords.some((keyword) => clean.includes(keyword))) {
      return bucket;
    }
  }

  return 'guilt_free';
}

export function getMonthKey(
  dateString = new Date().toISOString().slice(0, 10),
) {
  return dateString.slice(0, 7);
}

/**
 * Return the income for a given month from the per-month map.
 * Falls back to the most recent prior month's income, then 0.
 */
export function getMonthlyIncome(settings, monthKey) {
  const map = settings?.monthlyIncomes || {};
  if (map[monthKey] !== undefined) return Number(map[monthKey]);

  // Fallback: find the most recent month that has an entry
  const keys = Object.keys(map)
    .filter((k) => k < monthKey)
    .sort()
    .reverse();
  if (keys.length) return Number(map[keys[0]]);

  // Legacy single-value fallback
  if (settings?.monthlyIncome !== undefined)
    return Number(settings.monthlyIncome || 0);

  return 0;
}

export function calculateMonthlySpend(transactions, monthKey) {
  return transactions
    .filter((transaction) => getMonthKey(transaction.date) === monthKey)
    .filter((transaction) => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
}

export function calculateBucketBreakdown({
  transactions,
  monthlyIncome,
  bucketTargets,
  monthKey,
}) {
  const monthlyTransactions = transactions.filter(
    (transaction) => getMonthKey(transaction.date) === monthKey,
  );

  return BUCKETS.map((bucket) => {
    const actualAmount = monthlyTransactions
      .filter(
        (transaction) =>
          transaction.bucket === bucket.key && transaction.type === 'expense',
      )
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

    const targetPercent = Number(bucketTargets?.[bucket.key] ?? 0);
    const targetAmount = (Number(monthlyIncome || 0) * targetPercent) / 100;
    const actualPercent =
      monthlyIncome > 0 ? (actualAmount / monthlyIncome) * 100 : 0;

    return {
      ...bucket,
      targetPercent,
      targetAmount,
      actualAmount,
      actualPercent,
      status:
        actualPercent <= targetPercent
          ? 'good'
          : actualPercent <= targetPercent * 1.1
            ? 'warn'
            : 'danger',
    };
  });
}

export function calculateBudgetHealthScore(breakdown) {
  if (!breakdown.length) {
    return 0;
  }

  const total = breakdown.reduce((score, bucket) => {
    const denominator = Math.max(bucket.targetPercent, 1);
    const deviation =
      Math.abs(bucket.actualPercent - bucket.targetPercent) / denominator;
    return score + Math.max(0, 25 - deviation * 25);
  }, 0);

  return Math.max(0, Math.min(100, Math.round(total)));
}

export function createDemoTransactions() {
  const today = new Date();
  const thisMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  return [
    {
      id: crypto.randomUUID(),
      date: `${thisMonth}-01`,
      amount: 1250,
      description: 'Rent',
      category: 'Housing',
      bucket: 'fixed',
      type: 'expense',
    },
    {
      id: crypto.randomUUID(),
      date: `${thisMonth}-04`,
      amount: 130,
      description: 'Aldi groceries',
      category: 'Groceries',
      bucket: 'fixed',
      type: 'expense',
    },
    {
      id: crypto.randomUUID(),
      date: `${thisMonth}-06`,
      amount: 300,
      description: 'Vanguard index fund',
      category: 'Investments',
      bucket: 'investments',
      type: 'expense',
    },
    {
      id: crypto.randomUUID(),
      date: `${thisMonth}-09`,
      amount: 200,
      description: 'Emergency fund transfer',
      category: 'Savings',
      bucket: 'savings',
      type: 'expense',
    },
    {
      id: crypto.randomUUID(),
      date: `${thisMonth}-12`,
      amount: 85,
      description: 'Dining out',
      category: 'Food',
      bucket: 'guilt_free',
      type: 'expense',
    },
  ];
}

export function getProjectedGoalDate(goal, monthlyContribution) {
  const remaining =
    Number(goal.targetAmount || 0) - Number(goal.currentAmount || 0);
  if (remaining <= 0) {
    return 'Completed';
  }

  if (!monthlyContribution || monthlyContribution <= 0) {
    return 'N/A';
  }

  const months = Math.ceil(remaining / monthlyContribution);
  const projectedDate = new Date();
  projectedDate.setMonth(projectedDate.getMonth() + months);

  return projectedDate.toLocaleDateString(undefined, {
    month: 'short',
    year: 'numeric',
  });
}

export function formatCurrency(amount, currency = 'EUR') {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
}
