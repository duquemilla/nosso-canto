import React, { useState } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Check,
  CheckCircle2,
  Clock,
  Edit3,
  HelpCircle,
  CreditCard,
  Home,
  Layers,
  Trash2,
  Wallet,
  Receipt,
  Droplets,
  Zap,
  Wifi,
  Users,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Paperclip,
  Image as ImageIcon,
  ExternalLink,
  ShieldCheck,
  Filter,
} from 'lucide-react';
import {
  MonthlyConsumption,
  CoupleProfile,
  CustomExpense,
  MonthExpenseRecord,
  MonthBillPaidStatus,
  PartnerId,
} from '../types';
import { compressImageFile } from '../utils/imageCompression';
import { PartnerAvatar } from './PartnerAvatar';

interface ConsumptionReportViewProps {
  consumption?: MonthlyConsumption;
  profile: CoupleProfile;
  activePartner?: PartnerId;
  onUpdateConsumption?: (updated: MonthlyConsumption) => void;
}

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

// Helper to format year-month label
const getMonthLabelFromKey = (key: string): string => {
  const [yearStr, monthStr] = key.split('-');
  const year = parseInt(yearStr, 10);
  const mIndex = parseInt(monthStr, 10) - 1;
  if (mIndex >= 0 && mIndex < 12) {
    return `${MONTH_NAMES[mIndex]} ${year}`;
  }
  return key;
};

// Shift month key forward or backward (+1 or -1)
const shiftMonthKey = (key: string, delta: number): string => {
  const [yearStr, monthStr] = key.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10) + delta;

  while (month > 12) {
    month -= 12;
    year += 1;
  }
  while (month < 1) {
    month += 12;
    year -= 1;
  }

  const mm = String(month).padStart(2, '0');
  return `${year}-${mm}`;
};

export const ConsumptionReportView: React.FC<ConsumptionReportViewProps> = ({
  consumption: rawConsumption,
  profile,
  activePartner = 'partner1',
  onUpdateConsumption,
}) => {
  // Currently active or selected month (format "YYYY-MM")
  const defaultMonthKey = rawConsumption?.activeMonthKey || '2026-09';
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(defaultMonthKey);

  // Filter state: 'all' | 'partner1' | 'partner2' | 'pending'
  const [filterMode, setFilterMode] = useState<'all' | 'partner1' | 'partner2' | 'pending'>('all');

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [monthSwitchNotification, setMonthSwitchNotification] = useState<string | null>(null);

  // In-UI Confirmation Modal states (safe for iframes)
  const [billPendingDelete, setBillPendingDelete] = useState<{
    id: string;
    title: string;
    isCore: boolean;
  } | null>(null);
  const [isConfirmRestoreOpen, setIsConfirmRestoreOpen] = useState(false);

  // Receipt Preview / Upload Modal state
  const [receiptModalBill, setReceiptModalBill] = useState<{
    id: string;
    title: string;
    receiptUrl?: string;
    isCustom?: boolean;
  } | null>(null);
  const [inputReceiptUrl, setInputReceiptUrl] = useState('');

  // Setup records by month from consumption props
  const monthsRecords: Record<string, MonthExpenseRecord> = rawConsumption?.monthsRecords || {};

  // Current month record
  const currentRecord: MonthExpenseRecord = monthsRecords[selectedMonthKey] || {
    monthKey: selectedMonthKey,
    monthLabel: getMonthLabelFromKey(selectedMonthKey),
    rentSpent: Number(rawConsumption?.rentSpent) || 0,
    electricitySpent: Number(rawConsumption?.electricitySpent) || 0,
    waterSpent: Number(rawConsumption?.waterSpent) || 0,
    internetSpent: Number(rawConsumption?.internetSpent) || 0,
    creditCardSpent: Number(rawConsumption?.creditCardSpent) || 0,
    paidStatus: rawConsumption?.paidStatus || {
      rent: false,
      water: false,
      electricity: false,
      internet: false,
      creditCard: false,
    },
    billAuthors: {
      rent: 'partner1',
      electricity: 'partner2',
      water: 'partner1',
      internet: 'partner2',
      creditCard: 'partner1',
    },
    billPaidBy: {},
    billDueDates: {
      rent: '10',
      electricity: '15',
      water: '20',
      internet: '25',
      creditCard: '05',
    },
    customExpenses: rawConsumption?.customExpenses || [],
  };

  const rentSpent = Number(currentRecord.rentSpent) || 0;
  const electricitySpent = Number(currentRecord.electricitySpent) || 0;
  const waterSpent = Number(currentRecord.waterSpent) || 0;
  const internetSpent = Number(currentRecord.internetSpent) || 0;
  const creditCardSpent = Number(currentRecord.creditCardSpent) || 0;
  const paidStatus: MonthBillPaidStatus = currentRecord.paidStatus || {};
  const customExpenses: CustomExpense[] = currentRecord.customExpenses || [];
  const billAuthors = currentRecord.billAuthors || {};
  const billPaidBy = currentRecord.billPaidBy || {};
  const billDueDates = currentRecord.billDueDates || {};
  const billReceipts = currentRecord.billReceipts || {};

  const deletedBills: string[] = currentRecord.deletedBills || [];
  const billCustomTitles = currentRecord.billCustomTitles || {};
  const billCategories = currentRecord.billCategories || {};

  const isRentActive = !deletedBills.includes('rent');
  const isElecActive = !deletedBills.includes('electricity');
  const isWaterActive = !deletedBills.includes('water');
  const isNetActive = !deletedBills.includes('internet');
  const isCardActive = !deletedBills.includes('creditCard');

  const activeRentSpent = isRentActive ? rentSpent : 0;
  const activeElectricitySpent = isElecActive ? electricitySpent : 0;
  const activeWaterSpent = isWaterActive ? waterSpent : 0;
  const activeInternetSpent = isNetActive ? internetSpent : 0;
  const activeCreditCardSpent = isCardActive ? creditCardSpent : 0;

  const customExpensesTotal = customExpenses.reduce(
    (acc, curr) => acc + (Number(curr.amount) || 0),
    0
  );

  // Total household expenses
  const totalExpenses =
    activeRentSpent +
    activeWaterSpent +
    activeElectricitySpent +
    activeInternetSpent +
    activeCreditCardSpent +
    customExpensesTotal;

  // 50/50 Division
  const halfExpense = totalExpenses / 2;

  // Calculate paid vs pending
  const paidCoreSum =
    (isRentActive && paidStatus.rent ? rentSpent : 0) +
    (isWaterActive && paidStatus.water ? waterSpent : 0) +
    (isElecActive && paidStatus.electricity ? electricitySpent : 0) +
    (isNetActive && paidStatus.internet ? internetSpent : 0) +
    (isCardActive && paidStatus.creditCard ? creditCardSpent : 0);

  const paidCustomSum = customExpenses
    .filter((c) => c.paid)
    .reduce((acc, c) => acc + (Number(c.amount) || 0), 0);

  const totalPaid = paidCoreSum + paidCustomSum;
  const totalPending = Math.max(0, totalExpenses - totalPaid);

  // Count active and paid bills
  const activeCoreCount = [isRentActive, isWaterActive, isElecActive, isNetActive, isCardActive].filter(Boolean).length;
  const paidCoreCount = [
    isRentActive && paidStatus.rent,
    isWaterActive && paidStatus.water,
    isElecActive && paidStatus.electricity,
    isNetActive && paidStatus.internet,
    isCardActive && paidStatus.creditCard,
  ].filter(Boolean).length;

  const paidCustomCount = customExpenses.filter((c) => c.paid).length;
  const totalBillsCount = activeCoreCount + customExpenses.length;
  const totalPaidBillsCount = paidCoreCount + paidCustomCount;
  const totalPendingBillsCount = totalBillsCount - totalPaidBillsCount;

  // Partner references
  const partner1 = profile.partner1;
  const partner2 = profile.partner2;

  const getPartnerName = (pId?: PartnerId) => {
    if (pId === 'partner1') return partner1.nickname || partner1.name;
    if (pId === 'partner2') return partner2.nickname || partner2.name;
    return 'Casal';
  };

  const getPartnerAvatar = (pId?: PartnerId) => {
    if (pId === 'partner1') return partner1.avatar;
    if (pId === 'partner2') return partner2.avatar;
    return '👥';
  };

  // Persist update helper
  const saveMonthRecord = (updatedRecord: MonthExpenseRecord) => {
    const updatedRecords = {
      ...monthsRecords,
      [updatedRecord.monthKey]: updatedRecord,
    };

    if (onUpdateConsumption) {
      onUpdateConsumption({
        ...(rawConsumption || {}),
        activeMonthKey: selectedMonthKey,
        monthsRecords: updatedRecords,
        rentSpent: updatedRecord.rentSpent,
        electricitySpent: updatedRecord.electricitySpent,
        waterSpent: updatedRecord.waterSpent,
        internetSpent: updatedRecord.internetSpent,
        creditCardSpent: updatedRecord.creditCardSpent,
        paidStatus: updatedRecord.paidStatus,
        customExpenses: updatedRecord.customExpenses,
      });
    }
  };

  // Toggle paid status for a core bill in THIS month
  const toggleBillPaid = (billKey: keyof MonthBillPaidStatus) => {
    const isNowPaid = !paidStatus[billKey];
    const updatedStatus: MonthBillPaidStatus = {
      ...paidStatus,
      [billKey]: isNowPaid,
    };
    const currentPartnerId: PartnerId = activePartner === 'partner2' ? 'partner2' : 'partner1';
    const currentPaidBy: Record<string, PartnerId> = { ...(billPaidBy || {}) };
    if (isNowPaid) {
      currentPaidBy[billKey as string] = currentPartnerId;
    } else {
      delete currentPaidBy[billKey as string];
    }

    saveMonthRecord({
      ...currentRecord,
      paidStatus: updatedStatus,
      billPaidBy: currentPaidBy,
    });
  };

  // Toggle paid status for custom expense in THIS month
  const toggleCustomExpensePaid = (id: string) => {
    const currentPartnerId: PartnerId = activePartner === 'partner2' ? 'partner2' : 'partner1';
    const updatedCustom: CustomExpense[] = customExpenses.map((exp) => {
      if (exp.id === id) {
        const isNowPaid = !exp.paid;
        return {
          ...exp,
          paid: isNowPaid,
          paidBy: isNowPaid ? currentPartnerId : undefined,
        };
      }
      return exp;
    });
    saveMonthRecord({
      ...currentRecord,
      customExpenses: updatedCustom,
    });
  };

  // Switch month
  const handleSelectMonth = (newKey: string) => {
    if (!monthsRecords[newKey]) {
      const newMonthRecord: MonthExpenseRecord = {
        monthKey: newKey,
        monthLabel: getMonthLabelFromKey(newKey),
        rentSpent: rentSpent,
        electricitySpent: electricitySpent,
        waterSpent: waterSpent,
        internetSpent: internetSpent,
        creditCardSpent: 0,
        paidStatus: {
          rent: false,
          water: false,
          electricity: false,
          internet: false,
          creditCard: false,
        },
        billAuthors: { ...billAuthors },
        billPaidBy: {},
        billDueDates: { ...billDueDates },
        customExpenses: customExpenses.map((c) => ({ ...c, paid: false, paidBy: undefined })),
      };

      const updatedRecords = {
        ...monthsRecords,
        [newKey]: newMonthRecord,
      };

      if (onUpdateConsumption) {
        onUpdateConsumption({
          ...(rawConsumption || {}),
          activeMonthKey: newKey,
          monthsRecords: updatedRecords,
          rentSpent: newMonthRecord.rentSpent,
          electricitySpent: newMonthRecord.electricitySpent,
          waterSpent: newMonthRecord.waterSpent,
          internetSpent: newMonthRecord.internetSpent,
          creditCardSpent: newMonthRecord.creditCardSpent,
          paidStatus: newMonthRecord.paidStatus,
          customExpenses: newMonthRecord.customExpenses,
        });
      }

      setMonthSwitchNotification(
        `✨ Mês de ${getMonthLabelFromKey(newKey)} iniciado! Contas fixas copiadas e marcadas como A Pagar.`
      );
      setTimeout(() => setMonthSwitchNotification(null), 4000);
    }

    setSelectedMonthKey(newKey);
  };

  // Modal edit state for batch adjusting
  const [editRent, setEditRent] = useState(String(rentSpent));
  const [editWater, setEditWater] = useState(String(waterSpent));
  const [editElectricity, setEditElectricity] = useState(String(electricitySpent));
  const [editInternet, setEditInternet] = useState(String(internetSpent));
  const [editCreditCard, setEditCreditCard] = useState(String(creditCardSpent));
  const [editCustomExpenses, setEditCustomExpenses] = useState<CustomExpense[]>(customExpenses);

  // Edit authors & due dates
  const [editBillAuthors, setEditBillAuthors] = useState<Record<string, PartnerId>>(billAuthors);
  const [editBillDueDates, setEditBillDueDates] = useState<Record<string, string>>(billDueDates);

  // Individual Bill Edit Modal State
  const [editingBill, setEditingBill] = useState<{
    id: string;
    isCore: boolean;
    title: string;
    amount: string;
    dueDate: string;
    category: string;
    author: PartnerId;
    receiptUrl?: string;
  } | null>(null);

  // Quick Launch New Bill Modal State
  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);
  const [launchTitle, setLaunchTitle] = useState('');
  const [launchAmount, setLaunchAmount] = useState('');
  const [launchDueDate, setLaunchDueDate] = useState('');
  const [launchCategory, setLaunchCategory] = useState('Moradia Fixa');
  const [launchAuthor, setLaunchAuthor] = useState<PartnerId>(activePartner || 'partner1');
  const [launchPaid, setLaunchPaid] = useState(false);

  // New custom expense in batch modal
  const [newExpName, setNewExpName] = useState('');
  const [newExpAmount, setNewExpAmount] = useState('');
  const [newExpDueDate, setNewExpDueDate] = useState('');
  const [newExpCategory, setNewExpCategory] = useState('Casa & Lazer');
  const [newExpAuthor, setNewExpAuthor] = useState<PartnerId>(activePartner || 'partner1');

  const openEditModal = () => {
    setEditRent(String(rentSpent));
    setEditWater(String(waterSpent));
    setEditElectricity(String(electricitySpent));
    setEditInternet(String(internetSpent));
    setEditCreditCard(String(creditCardSpent));
    setEditCustomExpenses([...customExpenses]);
    setEditBillAuthors({ ...billAuthors });
    setEditBillDueDates({ ...billDueDates });
    setIsEditModalOpen(true);
  };

  // Open individual bill edit
  const openIndividualBillEdit = (bill: {
    id: string;
    isCore: boolean;
    title: string;
    amount: number;
    dueDate?: string;
    category: string;
    author?: PartnerId;
    receiptUrl?: string;
  }) => {
    setEditingBill({
      id: bill.id,
      isCore: bill.isCore,
      title: bill.title,
      amount: String(bill.amount),
      dueDate: bill.dueDate || '',
      category: bill.category,
      author: bill.author || 'partner1',
      receiptUrl: bill.receiptUrl,
    });
  };

  // Delete any bill (core or custom) - opens safe in-UI modal
  const handleDeleteBill = (id: string, title: string, isCore: boolean) => {
    setBillPendingDelete({ id, title, isCore });
  };

  // Confirmed delete execution
  const confirmDeleteBill = () => {
    if (!billPendingDelete) return;
    const { id, title, isCore } = billPendingDelete;

    if (isCore) {
      const updatedDeleted = Array.from(new Set([...(currentRecord.deletedBills || []), id]));
      const updatedRecord: MonthExpenseRecord = {
        ...currentRecord,
        deletedBills: updatedDeleted,
        ...(id === 'rent' ? { rentSpent: 0 } : {}),
        ...(id === 'electricity' ? { electricitySpent: 0 } : {}),
        ...(id === 'water' ? { waterSpent: 0 } : {}),
        ...(id === 'internet' ? { internetSpent: 0 } : {}),
        ...(id === 'creditCard' ? { creditCardSpent: 0 } : {}),
      };
      saveMonthRecord(updatedRecord);
    } else {
      const updatedCustom = (currentRecord.customExpenses || []).filter((c) => c.id !== id);
      const updatedRecord: MonthExpenseRecord = {
        ...currentRecord,
        customExpenses: updatedCustom,
      };
      saveMonthRecord(updatedRecord);
    }

    setMonthSwitchNotification(`🗑️ Conta "${title}" foi removida de ${currentRecord.monthLabel}.`);
    setTimeout(() => setMonthSwitchNotification(null), 3500);
    setBillPendingDelete(null);
  };

  // Restore Default Bills Handler - opens safe in-UI modal
  const handleRestoreDefaultBills = () => {
    setIsConfirmRestoreOpen(true);
  };

  const confirmRestoreDefaultBills = () => {
    saveMonthRecord({
      ...currentRecord,
      deletedBills: [],
    });
    setMonthSwitchNotification('✨ Contas padrão restauradas com sucesso!');
    setTimeout(() => setMonthSwitchNotification(null), 3500);
    setIsConfirmRestoreOpen(false);
  };

  // Save individual bill edit
  const handleSaveIndividualBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBill) return;

    const numAmount = parseFloat(editingBill.amount.replace(',', '.')) || 0;

    if (editingBill.isCore) {
      const id = editingBill.id;
      const updatedRecord: MonthExpenseRecord = {
        ...currentRecord,
        ...(id === 'rent' ? { rentSpent: numAmount } : {}),
        ...(id === 'electricity' ? { electricitySpent: numAmount } : {}),
        ...(id === 'water' ? { waterSpent: numAmount } : {}),
        ...(id === 'internet' ? { internetSpent: numAmount } : {}),
        ...(id === 'creditCard' ? { creditCardSpent: numAmount } : {}),
        billCustomTitles: {
          ...(currentRecord.billCustomTitles || {}),
          [id]: editingBill.title.trim(),
        },
        billDueDates: {
          ...(currentRecord.billDueDates || {}),
          [id]: editingBill.dueDate.trim(),
        },
        billCategories: {
          ...(currentRecord.billCategories || {}),
          [id]: editingBill.category.trim(),
        },
        billAuthors: {
          ...(currentRecord.billAuthors || {}),
          [id]: editingBill.author,
        },
      };
      saveMonthRecord(updatedRecord);
    } else {
      const updatedCustom = (currentRecord.customExpenses || []).map((c) =>
        c.id === editingBill.id
          ? {
              ...c,
              name: editingBill.title.trim(),
              amount: numAmount,
              dueDate: editingBill.dueDate.trim() || undefined,
              category: editingBill.category.trim(),
              addedBy: editingBill.author,
            }
          : c
      );
      saveMonthRecord({
        ...currentRecord,
        customExpenses: updatedCustom,
      });
    }

    setEditingBill(null);
    setMonthSwitchNotification(`✓ Conta "${editingBill.title}" atualizada com sucesso!`);
    setTimeout(() => setMonthSwitchNotification(null), 3500);
  };

  // Launch New Bill
  const handleLaunchNewBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!launchTitle.trim()) return;

    const numAmount = parseFloat(launchAmount.replace(',', '.')) || 0;
    const newId = 'bill-' + Date.now();
    const currentPartnerId: PartnerId = launchAuthor;

    const newItem: CustomExpense = {
      id: newId,
      name: launchTitle.trim(),
      amount: numAmount,
      dueDate: launchDueDate.trim() || undefined,
      category: launchCategory,
      addedBy: currentPartnerId,
      paid: launchPaid,
      paidBy: launchPaid ? currentPartnerId : undefined,
    };

    saveMonthRecord({
      ...currentRecord,
      customExpenses: [...(currentRecord.customExpenses || []), newItem],
    });

    setLaunchTitle('');
    setLaunchAmount('');
    setLaunchDueDate('');
    setLaunchPaid(false);
    setIsLaunchModalOpen(false);

    setMonthSwitchNotification(`🎉 Conta "${newItem.name}" lançada para ${currentRecord.monthLabel}!`);
    setTimeout(() => setMonthSwitchNotification(null), 3500);
  };

  const handleAddCustomExpense = () => {
    if (!newExpName.trim()) return;
    const numAmount = parseFloat(newExpAmount.replace(',', '.')) || 0;
    const newId = 'ce-' + Date.now();
    const newItem: CustomExpense = {
      id: newId,
      name: newExpName.trim(),
      amount: numAmount,
      dueDate: newExpDueDate.trim() || undefined,
      category: newExpCategory,
      paid: false,
      addedBy: newExpAuthor,
    };
    setEditCustomExpenses([...editCustomExpenses, newItem]);
    setNewExpName('');
    setNewExpAmount('');
    setNewExpDueDate('');
  };

  const handleRemoveCustomExpense = (id: string) => {
    setEditCustomExpenses(editCustomExpenses.filter((c) => c.id !== id));
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedRecord: MonthExpenseRecord = {
      ...currentRecord,
      rentSpent: parseFloat(editRent.replace(',', '.')) || 0,
      waterSpent: parseFloat(editWater.replace(',', '.')) || 0,
      electricitySpent: parseFloat(editElectricity.replace(',', '.')) || 0,
      internetSpent: parseFloat(editInternet.replace(',', '.')) || 0,
      creditCardSpent: parseFloat(editCreditCard.replace(',', '.')) || 0,
      customExpenses: editCustomExpenses,
      billAuthors: editBillAuthors,
      billDueDates: editBillDueDates,
    };
    saveMonthRecord(updatedRecord);
    setIsEditModalOpen(false);
  };

  // Receipt Modal Handlers
  const handleOpenReceiptModal = (
    id: string,
    title: string,
    receiptUrl?: string,
    isCustom?: boolean
  ) => {
    setReceiptModalBill({ id, title, receiptUrl, isCustom });
    setInputReceiptUrl(receiptUrl || '');
  };

  const handleSaveReceipt = (url: string) => {
    if (!receiptModalBill) return;
    if (receiptModalBill.isCustom) {
      const updatedCustom = customExpenses.map((exp) =>
        exp.id === receiptModalBill.id ? { ...exp, receiptUrl: url } : exp
      );
      saveMonthRecord({
        ...currentRecord,
        customExpenses: updatedCustom,
      });
    } else {
      const updatedReceipts = {
        ...billReceipts,
        [receiptModalBill.id]: url,
      };
      saveMonthRecord({
        ...currentRecord,
        billReceipts: updatedReceipts,
      });
    }
    setReceiptModalBill(null);
  };

  const handleFileUploadReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 1000, 0.75);
      setInputReceiptUrl(compressed);
    } catch {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setInputReceiptUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Available month keys sorted
  const availableMonthKeys = Array.from(
    new Set([...Object.keys(monthsRecords), selectedMonthKey])
  ).sort();

  // Core household bills definition (supports customization & deletion)
  const allCoreBills: Array<{
    id: keyof MonthBillPaidStatus;
    title: string;
    category: string;
    amount: number;
    paid: boolean;
    icon: React.ReactNode;
    color: string;
    bgIcon: string;
    author?: PartnerId;
    paidBy?: PartnerId;
    dueDate?: string;
    receiptUrl?: string;
  }> = [
    {
      id: 'rent',
      title: billCustomTitles.rent || 'Aluguel & Condomínio',
      category: billCategories.rent || 'Moradia Fixa',
      amount: rentSpent,
      paid: !!paidStatus.rent,
      icon: <Home className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      color: 'bg-emerald-500',
      bgIcon: 'bg-emerald-50 dark:bg-emerald-950/60',
      author: billAuthors.rent || 'partner1',
      paidBy: billPaidBy.rent,
      dueDate: billDueDates.rent || '10',
      receiptUrl: billReceipts.rent,
    },
    {
      id: 'electricity',
      title: billCustomTitles.electricity || 'Luz / Energia Elétrica',
      category: billCategories.electricity || 'Utilidades',
      amount: electricitySpent,
      paid: !!paidStatus.electricity,
      icon: <Zap className="w-5 h-5 text-amber-500" />,
      color: 'bg-amber-500',
      bgIcon: 'bg-amber-50 dark:bg-amber-950/60',
      author: billAuthors.electricity || 'partner2',
      paidBy: billPaidBy.electricity,
      dueDate: billDueDates.electricity || '15',
      receiptUrl: billReceipts.electricity,
    },
    {
      id: 'water',
      title: billCustomTitles.water || 'Água & Gás',
      category: billCategories.water || 'Utilidades',
      amount: waterSpent,
      paid: !!paidStatus.water,
      icon: <Droplets className="w-5 h-5 text-sky-500" />,
      color: 'bg-sky-500',
      bgIcon: 'bg-sky-50 dark:bg-sky-950/60',
      author: billAuthors.water || 'partner1',
      paidBy: billPaidBy.water,
      dueDate: billDueDates.water || '20',
      receiptUrl: billReceipts.water,
    },
    {
      id: 'internet',
      title: billCustomTitles.internet || 'Internet Fibra',
      category: billCategories.internet || 'Conectividade',
      amount: internetSpent,
      paid: !!paidStatus.internet,
      icon: <Wifi className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
      color: 'bg-teal-500',
      bgIcon: 'bg-teal-50 dark:bg-teal-950/60',
      author: billAuthors.internet || 'partner2',
      paidBy: billPaidBy.internet,
      dueDate: billDueDates.internet || '25',
      receiptUrl: billReceipts.internet,
    },
    {
      id: 'creditCard',
      title: billCustomTitles.creditCard || 'Faturas de Cartão de Crédito',
      category: billCategories.creditCard || 'Compras Gerais & Assinaturas',
      amount: creditCardSpent,
      paid: !!paidStatus.creditCard,
      icon: <CreditCard className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      color: 'bg-indigo-500',
      bgIcon: 'bg-indigo-50 dark:bg-indigo-950/60',
      author: billAuthors.creditCard || 'partner1',
      paidBy: billPaidBy.creditCard,
      dueDate: billDueDates.creditCard || '05',
      receiptUrl: billReceipts.creditCard,
    },
  ];

  // Filter out core bills deleted by user
  const coreBills = allCoreBills.filter((b) => !deletedBills.includes(b.id));

  // Filtering bills by author or status
  const filteredCoreBills = coreBills.filter((bill) => {
    if (filterMode === 'partner1') return bill.author === 'partner1';
    if (filterMode === 'partner2') return bill.author === 'partner2';
    if (filterMode === 'pending') return !bill.paid;
    return true;
  });

  const filteredCustomExpenses = customExpenses.filter((exp) => {
    if (filterMode === 'partner1') return exp.addedBy === 'partner1';
    if (filterMode === 'partner2') return exp.addedBy === 'partner2';
    if (filterMode === 'pending') return !exp.paid;
    return true;
  });

  // Visual Category Distribution
  const categoriesDistribution = [
    { label: 'Aluguel', amount: rentSpent, color: 'bg-emerald-500' },
    { label: 'Energia', amount: electricitySpent, color: 'bg-amber-500' },
    { label: 'Água/Gás', amount: waterSpent, color: 'bg-sky-500' },
    { label: 'Internet', amount: internetSpent, color: 'bg-teal-500' },
    { label: 'Cartão', amount: creditCardSpent, color: 'bg-indigo-500' },
    { label: 'Outras', amount: customExpensesTotal, color: 'bg-purple-500' },
  ].filter((c) => c.amount > 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Month Switch Success Toast Banner */}
      {monthSwitchNotification && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between shadow-md animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span>{monthSwitchNotification}</span>
          </div>
          <button
            onClick={() => setMonthSwitchNotification(null)}
            className="text-xs text-emerald-700 dark:text-emerald-300 hover:underline"
          >
            Dispensar
          </button>
        </div>
      )}

      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#2D2327] dark:text-[#FAF4F0]">
              Contas do Mês
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#FAF3EC] dark:bg-[#2D2228] text-[#E07A8B] font-bold border border-[#F2E8E4] dark:border-[#3D2F36]">
              {currentRecord.monthLabel}
            </span>
          </div>
          <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF] mt-0.5">
            Divisão 50/50 de {partner1.name} & {partner2.name}, com indicação de quem lançou e comprovantes.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {deletedBills.length > 0 && (
            <button
              onClick={handleRestoreDefaultBills}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition-colors"
              title="Restaurar contas originais ocultadas ou excluídas"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Padrões ({deletedBills.length})</span>
            </button>
          )}

          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FAF3EC] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-xs font-semibold text-[#E07A8B] dark:text-[#F492A5] hover:bg-[#F2E8E4] transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Como funciona?</span>
          </button>

          <button
            onClick={() => setIsLaunchModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E07A8B] hover:bg-[#d66a7c] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Lançar Nova Conta</span>
          </button>

          <button
            onClick={openEditModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#2D2327] hover:bg-zinc-50 text-xs font-semibold shadow-2xs transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Ajustar em Massa</span>
          </button>
        </div>
      </div>

      {/* Interactive Month Selector Bar */}
      <div className="p-3 rounded-2xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleSelectMonth(shiftMonthKey(selectedMonthKey, -1))}
            className="p-1.5 rounded-xl border border-[#F2E8E4] dark:border-[#3D2F36] text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#2D2327] hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Mês anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Month Dropdown */}
          <div className="relative">
            <select
              value={selectedMonthKey}
              onChange={(e) => handleSelectMonth(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-xs font-bold text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B] cursor-pointer"
            >
              {availableMonthKeys.map((k) => (
                <option key={k} value={k}>
                  📅 {getMonthLabelFromKey(k)} {k === '2026-09' ? '(Mês Atual)' : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => handleSelectMonth(shiftMonthKey(selectedMonthKey, 1))}
            className="p-1.5 rounded-xl border border-[#F2E8E4] dark:border-[#3D2F36] text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#2D2327] hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Próximo mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Month Status Pills */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-[#7D6F74] dark:text-[#B8A8AF] text-[11px]">
            Status de <strong>{currentRecord.monthLabel}</strong>:
          </span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
              totalPendingBillsCount === 0
                ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300'
                : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300'
            }`}
          >
            {totalPendingBillsCount === 0
              ? '🎉 Todas as contas pagas!'
              : `⏳ ${totalPaidBillsCount} pagas • ${totalPendingBillsCount} a pagar`}
          </span>

          <button
            onClick={() => handleSelectMonth(shiftMonthKey(selectedMonthKey, 1))}
            className="text-[11px] font-semibold text-[#E07A8B] hover:underline flex items-center gap-1 ml-auto sm:ml-0"
          >
            <Plus className="w-3 h-3" />
            <span>Ir para próximo mês</span>
          </button>
        </div>
      </div>

      {/* Author Filter Tabs (Quem lançou / Status) */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-[#FAF8F5] dark:bg-[#20181D] border border-[#F2E8E4] dark:border-[#3D2F36] text-xs">
        <span className="text-[11px] font-semibold text-[#7D6F74] dark:text-[#B8A8AF] px-2 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-[#E07A8B]" />
          <span>Filtrar:</span>
        </span>

        <button
          onClick={() => setFilterMode('all')}
          className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
            filterMode === 'all'
              ? 'bg-white dark:bg-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] shadow-xs font-bold'
              : 'text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#2D2327]'
          }`}
        >
          Todas as Contas ({totalBillsCount})
        </button>

        <button
          onClick={() => setFilterMode('partner1')}
          className={`px-3 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
            filterMode === 'partner1'
              ? 'bg-white dark:bg-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] shadow-xs font-bold'
              : 'text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#2D2327]'
          }`}
        >
          <PartnerAvatar avatar={partner1.avatar} name={partner1.name} size="xs" />
          <span>Lançadas por {partner1.nickname || partner1.name}</span>
        </button>

        <button
          onClick={() => setFilterMode('partner2')}
          className={`px-3 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
            filterMode === 'partner2'
              ? 'bg-white dark:bg-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] shadow-xs font-bold'
              : 'text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#2D2327]'
          }`}
        >
          <PartnerAvatar avatar={partner2.avatar} name={partner2.name} size="xs" />
          <span>Lançadas por {partner2.nickname || partner2.name}</span>
        </button>

        <button
          onClick={() => setFilterMode('pending')}
          className={`px-3 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1 ${
            filterMode === 'pending'
              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 shadow-xs font-bold'
              : 'text-amber-700 dark:text-amber-300 hover:text-amber-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Somente Pendentes ({totalPendingBillsCount})</span>
        </button>
      </div>

      {/* Explanation Banner */}
      {showExplanation && (
        <div className="p-5 rounded-3xl bg-white dark:bg-[#241C21] border border-[#E07A8B]/30 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#E07A8B]" />
              <h3 className="font-serif font-bold text-base text-[#2D2327] dark:text-[#FAF4F0]">
                Como funciona o controle mensal e a virada de mês?
              </h3>
            </div>
            <button
              onClick={() => setShowExplanation(false)}
              className="text-xs text-[#7D6F74] hover:text-[#2D2327] dark:hover:text-white"
            >
              Fechar ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-[#7D6F74] dark:text-[#B8A8AF]">
            <div className="p-3.5 rounded-2xl bg-[#FAF8F5] dark:bg-[#2A2026] border border-[#F2E8E4] dark:border-[#3D2F36] space-y-1">
              <strong className="text-[#2D2327] dark:text-[#FAF4F0] block text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                1. Histórico Preservado (Nada é apagado):
              </strong>
              <p>
                Quando você marca uma conta como <strong>Pago ✓</strong>, isso fica registrado com a data e quem pagou para aquele mês. Você pode voltar a qualquer mês anterior para conferir.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAF8F5] dark:bg-[#2A2026] border border-[#F2E8E4] dark:border-[#3D2F36] space-y-1">
              <strong className="text-[#2D2327] dark:text-[#FAF4F0] block text-xs flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-sky-500" />
                2. Contas Fixas Herdadas:
              </strong>
              <p>
                Ao avançar para um novo mês, o app traz automaticamente suas contas fixas (Aluguel, Luz, Água, Internet) para você não precisar digitar tudo de novo. As contas começam como <strong>A Pagar ⏳</strong> para vocês irem marcando.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAF8F5] dark:bg-[#2A2026] border border-[#F2E8E4] dark:border-[#3D2F36] space-y-1">
              <strong className="text-[#2D2327] dark:text-[#FAF4F0] block text-xs flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-indigo-500" />
                3. Sem Dupla Contagem:
              </strong>
              <p>
                Supermercado e delivery não são somados separadamente aqui porque vocês já usam Cartão Alimentação ou Cartão de Crédito. A fatura do cartão cobre essas despesas sem duplicar!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Financial Overview Cards for Selected Month */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total General Expenses */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[#7D6F74] dark:text-[#B8A8AF]">
            <span>Total de Contas ({currentRecord.monthLabel})</span>
            <Wallet className="w-4 h-4 text-[#E07A8B]" />
          </div>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-[#2D2327] dark:text-[#FAF4F0]">
            R$ {totalExpenses.toFixed(2)}
          </p>
          <p className="text-[11px] text-[#7D6F74] dark:text-[#B8A8AF] font-medium">
            Aluguel, luz, água, net, cartão e despesas do mês
          </p>
        </div>

        {/* 50/50 Split for the couple */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[#7D6F74] dark:text-[#B8A8AF]">
            <span>Divisão por Pessoa (50%)</span>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            R$ {halfExpense.toFixed(2)}
          </p>
          <p className="text-[11px] text-[#7D6F74] dark:text-[#B8A8AF] truncate">
            {profile.partner1.name} e {profile.partner2.name}
          </p>
        </div>

        {/* Paid Status Summary */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[#7D6F74] dark:text-[#B8A8AF]">
            <span>Já Pago no Mês</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            R$ {totalPaid.toFixed(2)}
          </p>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
            {totalPaidBillsCount} de {totalBillsCount} contas quitadas
          </p>
        </div>

        {/* Pending Bills */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[#7D6F74] dark:text-[#B8A8AF]">
            <span>Falta Pagar (Pendente)</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400">
            R$ {totalPending.toFixed(2)}
          </p>
          <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
            {totalPendingBillsCount} conta{totalPendingBillsCount === 1 ? '' : 's'} aguardando pagamento
          </p>
        </div>
      </div>

      {/* Grid of Core Household Bills for this month */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif font-bold text-lg text-[#2D2327] dark:text-[#FAF4F0] flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#E07A8B]" />
              <span>Contas do Lar ({currentRecord.monthLabel})</span>
            </h3>
            <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF]">
              Edite valores e vencimentos ou exclua as contas que não precisar este mês.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLaunchModalOpen(true)}
              className="text-xs font-semibold text-[#E07A8B] hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Lançar Conta</span>
            </button>
            <span className="text-zinc-300 dark:text-zinc-700 hidden sm:inline">•</span>
            <button
              onClick={openEditModal}
              className="text-xs text-[#7D6F74] hover:text-[#2D2327] dark:hover:text-white hidden sm:flex items-center gap-1"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Ajustar em massa</span>
            </button>
          </div>
        </div>

        {filteredCoreBills.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCoreBills.map((bill) => {
              const pct = totalExpenses > 0 ? ((bill.amount / totalExpenses) * 100).toFixed(1) : '0';
              const author = bill.author === 'partner1' ? partner1 : partner2;
              const paidByPartner = bill.paidBy ? (bill.paidBy === 'partner1' ? partner1 : partner2) : null;

              return (
                <div
                  key={bill.id}
                  className={`p-4 rounded-3xl bg-white dark:bg-[#241C21] border transition-all ${
                    bill.paid
                      ? 'border-[#F2E8E4] dark:border-[#3D2F36]'
                      : 'border-amber-300/90 dark:border-amber-700/60 shadow-xs'
                  } flex flex-col justify-between space-y-3`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div
                          className={`w-10 h-10 rounded-2xl ${bill.bgIcon} flex items-center justify-center shrink-0`}
                        >
                          {bill.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] text-[#7D6F74] dark:text-[#B8A8AF]">
                              {bill.category}
                            </span>
                            {bill.dueDate && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-medium">
                                📅 Vence dia {bill.dueDate}
                              </span>
                            )}
                          </div>
                          <h4 className="font-semibold text-sm text-[#2D2327] dark:text-[#FAF4F0] leading-tight mt-0.5 truncate">
                            {bill.title}
                          </h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Edit button */}
                        <button
                          type="button"
                          onClick={() =>
                            openIndividualBillEdit({
                              id: bill.id,
                              isCore: true,
                              title: bill.title,
                              amount: bill.amount,
                              dueDate: bill.dueDate,
                              category: bill.category,
                              author: bill.author,
                              receiptUrl: bill.receiptUrl,
                            })
                          }
                          className="p-1.5 rounded-lg text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#2D2327] dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                          title="Editar esta conta"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteBill(bill.id, bill.title, true)}
                          className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Excluir esta conta deste mês"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Toggle paid button */}
                        <button
                          onClick={() => toggleBillPaid(bill.id)}
                          title="Clique para alternar status"
                          className={`ml-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all border ${
                            bill.paid
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300/60'
                              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300/60'
                          }`}
                        >
                          {bill.paid ? '✓ Pago' : '⏳ A Pagar'}
                        </button>
                      </div>
                    </div>

                    {/* Badges: Who launched and Who paid */}
                    <div className="flex items-center justify-between gap-2 pt-1 text-[11px]">
                      <span className="inline-flex items-center gap-1 text-[#7D6F74] dark:text-[#B8A8AF]">
                        <PartnerAvatar avatar={author.avatar} name={author.name} size="xs" />
                        <span>Lançado por <strong>{author.nickname || author.name}</strong></span>
                      </span>

                      {bill.paid && (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium text-[10px]">
                          <Check className="w-3 h-3" />
                          <span>{paidByPartner ? `Pago por ${paidByPartner.nickname}` : 'Pago'}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-[#F2E8E4] dark:border-[#3D2F36]">
                    <div className="flex items-end justify-between">
                      <div>
                        <span className="text-[10px] text-[#7D6F74] dark:text-[#B8A8AF] block">
                          Total da Conta
                        </span>
                        <span className="font-serif text-xl font-bold text-[#2D2327] dark:text-[#FAF4F0]">
                          R$ {bill.amount.toFixed(2)}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-[#7D6F74] dark:text-[#B8A8AF] block">
                          Cada um (50%)
                        </span>
                        <span className="font-semibold text-xs text-emerald-600 dark:text-emerald-400">
                          R$ {(bill.amount / 2).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Pix Receipt Button */}
                    <div className="pt-1 flex items-center justify-between text-[11px]">
                      <button
                        type="button"
                        onClick={() => handleOpenReceiptModal(bill.id, bill.title, bill.receiptUrl, false)}
                        className={`flex items-center gap-1 font-medium transition-colors ${
                          bill.receiptUrl
                            ? 'text-emerald-600 dark:text-emerald-400 hover:underline'
                            : 'text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#E07A8B]'
                        }`}
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                        <span>{bill.receiptUrl ? '📎 Ver Comprovante Pix' : '+ Anexar Comprovante Pix'}</span>
                      </button>
                      <span className="text-[10px] text-[#7D6F74] dark:text-[#B8A8AF]">
                        {pct}% do mês
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 px-4 rounded-3xl bg-[#FAF8F5] dark:bg-[#2A2026] border border-dashed border-[#F2E8E4] dark:border-[#3D2F36] space-y-3">
            <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF]">
              {deletedBills.length > 0
                ? 'Você excluiu as contas padrão deste mês ou aplicou filtros.'
                : 'Nenhuma conta encontrada com o filtro selecionado.'}
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {deletedBills.length > 0 && (
                <button
                  onClick={handleRestoreDefaultBills}
                  className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar contas padrão ({deletedBills.length})</span>
                </button>
              )}
              <button
                onClick={() => setIsLaunchModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-[#E07A8B] text-white text-xs font-semibold hover:bg-[#d66a7c] transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Lançar Nova Conta</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Outras Despesas do Casal */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F2E8E4] dark:border-[#3D2F36]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-[#2D2327] dark:text-[#FAF4F0] flex items-center gap-2">
                <span>Outras Despesas e Contas do Mês</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-sans font-semibold border border-purple-200 dark:border-purple-800/40">
                  {customExpenses.length} contas
                </span>
              </h3>
              <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF]">
                Contas extras, assinaturas de streaming, farmácia, pet e despesas com identificação de quem lançou.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
              Total: R$ {customExpensesTotal.toFixed(2)}
            </span>
            <button
              onClick={() => setIsLaunchModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100 text-xs font-semibold transition-colors border border-purple-200 dark:border-purple-800/40"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Lançar Conta</span>
            </button>
          </div>
        </div>

        {filteredCustomExpenses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredCustomExpenses.map((exp) => {
              const author = exp.addedBy === 'partner1' ? partner1 : partner2;
              const paidByPartner = exp.paidBy ? (exp.paidBy === 'partner1' ? partner1 : partner2) : null;

              return (
                <div
                  key={exp.id}
                  className="p-3.5 rounded-2xl bg-[#FAF8F5] dark:bg-[#2A2026] border border-[#F2E8E4] dark:border-[#3D2F36] flex flex-col justify-between space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-semibold inline-block">
                          {exp.category}
                        </span>
                        {exp.dueDate && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-medium">
                            📅 Vence: {exp.dueDate}
                          </span>
                        )}
                      </div>
                      <h4 className="font-semibold text-xs text-[#2D2327] dark:text-[#FAF4F0] truncate">
                        {exp.name}
                      </h4>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="font-bold text-sm text-[#2D2327] dark:text-[#FAF4F0]">
                          R$ {Number(exp.amount).toFixed(2)}
                        </span>
                        <span className="text-[10px] text-[#7D6F74] dark:text-[#B8A8AF]">
                          (R$ {(Number(exp.amount) / 2).toFixed(2)} cada)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Edit button */}
                      <button
                        type="button"
                        onClick={() =>
                          openIndividualBillEdit({
                            id: exp.id,
                            isCore: false,
                            title: exp.name,
                            amount: Number(exp.amount),
                            dueDate: exp.dueDate,
                            category: exp.category,
                            author: exp.addedBy,
                            receiptUrl: exp.receiptUrl,
                          })
                        }
                        className="p-1 rounded-lg text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#2D2327] dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                        title="Editar esta conta"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>

                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteBill(exp.id, exp.name, false)}
                        className="p-1 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Excluir esta conta"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>

                      {/* Toggle Paid */}
                      <button
                        onClick={() => toggleCustomExpensePaid(exp.id)}
                        className={`ml-1 px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 border transition-all ${
                          exp.paid
                            ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300'
                            : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300'
                        }`}
                      >
                        {exp.paid ? '✓ Pago' : '⏳ A Pagar'}
                      </button>
                    </div>
                  </div>

                  {/* Attribution tag and receipt */}
                  <div className="flex items-center justify-between pt-1 border-t border-[#F2E8E4] dark:border-[#3D2F36] text-[10px]">
                    <span className="text-[#7D6F74] dark:text-[#B8A8AF] flex items-center gap-1">
                      <PartnerAvatar avatar={author.avatar} name={author.name} size="xs" />
                      <span>Lançado por {author.nickname || author.name}</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => handleOpenReceiptModal(exp.id, exp.name, exp.receiptUrl, true)}
                      className="text-[#E07A8B] hover:underline flex items-center gap-0.5"
                    >
                      <Paperclip className="w-3 h-3" />
                      <span>{exp.receiptUrl ? 'Comprovante' : '+ Pix'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 px-4 rounded-2xl bg-[#FAF8F5] dark:bg-[#2A2026] border border-dashed border-[#F2E8E4] dark:border-[#3D2F36]">
            <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF]">
              Nenhuma outra despesa encontrada com o filtro atual.
            </p>
            <button
              onClick={() => setIsLaunchModalOpen(true)}
              className="mt-2 text-xs font-semibold text-[#E07A8B] hover:underline"
            >
              + Lançar farmácia, streaming, compras ou outra conta do mês
            </button>
          </div>
        )}
      </div>

      {/* Histórico Comparativo dos Meses */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-serif font-bold text-base sm:text-lg text-[#2D2327] dark:text-[#FAF4F0] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#E07A8B]" />
              <span>Histórico Mensal Gravado</span>
            </h3>
            <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF]">
              Cada mês tem seu próprio registro salvo. Clique em qualquer mês para abrir seus detalhes.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {availableMonthKeys.map((key) => {
            const rec = monthsRecords[key] || currentRecord;
            const rRent = Number(rec.rentSpent) || 0;
            const rElec = Number(rec.electricitySpent) || 0;
            const rWater = Number(rec.waterSpent) || 0;
            const rNet = Number(rec.internetSpent) || 0;
            const rCard = Number(rec.creditCardSpent) || 0;
            const rOther = (rec.customExpenses || []).reduce(
              (acc, c) => acc + (Number(c.amount) || 0),
              0
            );
            const mTotal = rRent + rElec + rWater + rNet + rCard + rOther;
            const isSelected = key === selectedMonthKey;

            const billsPct = mTotal > 0 ? ((rRent + rElec + rWater + rNet) / mTotal) * 100 : 50;
            const cardPct = mTotal > 0 ? (rCard / mTotal) * 100 : 30;
            const otherPct = mTotal > 0 ? (rOther / mTotal) * 100 : 20;

            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSelectMonth(key)}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                  isSelected
                    ? 'bg-[#FAF3EC] dark:bg-[#2D2228] border-[#E07A8B] ring-1 ring-[#E07A8B]/50'
                    : 'bg-[#FAF8F5] dark:bg-[#2A2026] border-[#F2E8E4] dark:border-[#3D2F36] hover:border-[#E07A8B]/50'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#2D2327] dark:text-[#FAF4F0]">
                      {getMonthLabelFromKey(key)}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E07A8B] text-white font-bold">
                        Visualizando Agora
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-sm text-[#2D2327] dark:text-[#FAF4F0]">
                      R$ {mTotal.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-[#7D6F74] dark:text-[#B8A8AF] ml-1">
                      (R$ {(mTotal / 2).toFixed(2)} cada)
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2.5 rounded-full bg-zinc-200 dark:bg-zinc-700 flex overflow-hidden mb-1.5">
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: `${billsPct}%` }}
                    title={`Moradia & Contas: R$ ${rRent + rElec + rWater + rNet}`}
                  />
                  <div
                    className="h-full bg-indigo-500"
                    style={{ width: `${cardPct}%` }}
                    title={`Cartão: R$ ${rCard}`}
                  />
                  <div
                    className="h-full bg-purple-500"
                    style={{ width: `${otherPct}%` }}
                    title={`Outros: R$ ${rOther}`}
                  />
                </div>

                <div className="flex items-center gap-2 text-[10px] text-[#7D6F74] dark:text-[#B8A8AF] flex-wrap">
                  <span className="text-emerald-600 dark:text-emerald-400">
                    🏠 Moradia: R$ {(rRent + rElec + rWater + rNet).toFixed(2)}
                  </span>
                  <span>•</span>
                  <span className="text-indigo-600 dark:text-indigo-400">
                    💳 Cartão: R$ {rCard.toFixed(2)}
                  </span>
                  {rOther > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-purple-600 dark:text-purple-400">
                        ➕ Outras Contas: R$ {rOther.toFixed(2)}
                      </span>
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Edit Values Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#241C21] rounded-3xl max-w-xl w-full p-6 border border-[#F2E8E4] dark:border-[#3D2F36] shadow-xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#F2E8E4] dark:border-[#3D2F36]">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#E07A8B]" />
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#2D2327] dark:text-[#FAF4F0]">
                    Ajustar Contas & Quem Cadastrou
                  </h3>
                  <span className="text-[11px] text-[#7D6F74] dark:text-[#B8A8AF]">
                    Defina valores, dias de vencimento e quem é responsável por cada conta em {currentRecord.monthLabel}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-xs text-[#7D6F74] hover:text-[#2D2327] dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs sm:text-sm">
              {/* Aluguel */}
              <div className="p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-[#2D2327] dark:text-[#FAF4F0] flex items-center gap-1.5">
                    <Home className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Aluguel & Condomínio (R$)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditRent('0')}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-white dark:bg-[#33272D] text-[#E07A8B]"
                  >
                    R$ 0
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editRent}
                    onChange={(e) => setEditRent(e.target.value)}
                    placeholder="0.00"
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                  />
                  <select
                    value={editBillAuthors.rent || 'partner1'}
                    onChange={(e) => setEditBillAuthors({ ...editBillAuthors, rent: e.target.value as PartnerId })}
                    className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36] text-xs text-[#2D2327] dark:text-[#FAF4F0]"
                  >
                    <option value="partner1">Lançado por {partner1.nickname || partner1.name}</option>
                    <option value="partner2">Lançado por {partner2.nickname || partner2.name}</option>
                  </select>
                  <input
                    type="text"
                    value={editBillDueDates.rent || '10'}
                    onChange={(e) => setEditBillDueDates({ ...editBillDueDates, rent: e.target.value })}
                    placeholder="Vencimento (ex: 10)"
                    className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36] text-xs text-[#2D2327] dark:text-[#FAF4F0]"
                  />
                </div>
              </div>

              {/* Luz & Água */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Luz */}
                <div className="p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-[#2D2327] dark:text-[#FAF4F0] flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <span>Luz / Energia (R$)</span>
                    </label>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editElectricity}
                    onChange={(e) => setEditElectricity(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0]"
                  />
                  <select
                    value={editBillAuthors.electricity || 'partner2'}
                    onChange={(e) => setEditBillAuthors({ ...editBillAuthors, electricity: e.target.value as PartnerId })}
                    className="w-full px-2 py-1.5 rounded-xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36] text-[11px]"
                  >
                    <option value="partner1">Lançado por {partner1.nickname || partner1.name}</option>
                    <option value="partner2">Lançado por {partner2.nickname || partner2.name}</option>
                  </select>
                </div>

                {/* Água */}
                <div className="p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-[#2D2327] dark:text-[#FAF4F0] flex items-center gap-1">
                      <Droplets className="w-3.5 h-3.5 text-sky-500" />
                      <span>Água & Gás (R$)</span>
                    </label>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editWater}
                    onChange={(e) => setEditWater(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0]"
                  />
                  <select
                    value={editBillAuthors.water || 'partner1'}
                    onChange={(e) => setEditBillAuthors({ ...editBillAuthors, water: e.target.value as PartnerId })}
                    className="w-full px-2 py-1.5 rounded-xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36] text-[11px]"
                  >
                    <option value="partner1">Lançado por {partner1.nickname || partner1.name}</option>
                    <option value="partner2">Lançado por {partner2.nickname || partner2.name}</option>
                  </select>
                </div>
              </div>

              {/* Internet & Cartão Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Internet */}
                <div className="p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] space-y-2">
                  <label className="font-semibold text-[#2D2327] dark:text-[#FAF4F0] flex items-center gap-1">
                    <Wifi className="w-3.5 h-3.5 text-teal-500" />
                    <span>Internet Fibra (R$)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editInternet}
                    onChange={(e) => setEditInternet(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0]"
                  />
                  <select
                    value={editBillAuthors.internet || 'partner2'}
                    onChange={(e) => setEditBillAuthors({ ...editBillAuthors, internet: e.target.value as PartnerId })}
                    className="w-full px-2 py-1.5 rounded-xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36] text-[11px]"
                  >
                    <option value="partner1">Lançado por {partner1.nickname || partner1.name}</option>
                    <option value="partner2">Lançado por {partner2.nickname || partner2.name}</option>
                  </select>
                </div>

                {/* Cartão */}
                <div className="p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] space-y-2">
                  <label className="font-semibold text-[#2D2327] dark:text-[#FAF4F0] flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Cartão de Crédito (R$)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editCreditCard}
                    onChange={(e) => setEditCreditCard(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0]"
                  />
                  <select
                    value={editBillAuthors.creditCard || 'partner1'}
                    onChange={(e) => setEditBillAuthors({ ...editBillAuthors, creditCard: e.target.value as PartnerId })}
                    className="w-full px-2 py-1.5 rounded-xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36] text-[11px]"
                  >
                    <option value="partner1">Lançado por {partner1.nickname || partner1.name}</option>
                    <option value="partner2">Lançado por {partner2.nickname || partner2.name}</option>
                  </select>
                </div>
              </div>

              {/* Outras Despesas Personalizadas */}
              <div className="p-3.5 rounded-2xl bg-[#FAF8F5] dark:bg-[#2A2026] border border-[#F2E8E4] dark:border-[#3D2F36] space-y-3">
                <span className="font-medium text-[#2D2327] dark:text-[#FAF4F0] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-500" />
                  <span>Outras Contas & Despesas Personalizadas</span>
                </span>

                {/* List of existing custom items */}
                {editCustomExpenses.length > 0 && (
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {editCustomExpenses.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-xs"
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <span className="font-semibold text-[#2D2327] dark:text-[#FAF4F0] block truncate">
                            {c.name}
                          </span>
                          <span className="text-[10px] text-[#7D6F74] dark:text-[#B8A8AF]">
                            {c.category} • R$ {Number(c.amount).toFixed(2)} • {getPartnerAvatar(c.addedBy)} {getPartnerName(c.addedBy)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomExpense(c.id)}
                          className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                          title="Remover"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick Add Custom Expense inside modal */}
                <div className="pt-2 border-t border-[#F2E8E4] dark:border-[#3D2F36] space-y-2">
                  <span className="text-[11px] font-medium text-[#7D6F74] dark:text-[#B8A8AF] block">
                    + Adicionar Nova Despesa
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={newExpName}
                      onChange={(e) => setNewExpName(e.target.value)}
                      placeholder="Ex: Netflix, Farmácia, Pet"
                      className="sm:col-span-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-xs text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                    />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newExpAmount}
                      onChange={(e) => setNewExpAmount(e.target.value)}
                      placeholder="R$ 0.00"
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-xs text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={newExpCategory}
                      onChange={(e) => setNewExpCategory(e.target.value)}
                      className="px-2 py-1 rounded-lg bg-white dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[11px] text-[#2D2327] dark:text-[#FAF4F0]"
                    >
                      <option value="Casa & Lazer">Casa & Lazer</option>
                      <option value="Saúde & Bem-Estar">Saúde & Bem-Estar</option>
                      <option value="Pet & Família">Pet & Família</option>
                      <option value="Educação / Cursos">Educação / Cursos</option>
                      <option value="Transporte & Combustível">Transporte & Combustível</option>
                      <option value="Outros">Outros</option>
                    </select>

                    <select
                      value={newExpAuthor}
                      onChange={(e) => setNewExpAuthor(e.target.value as PartnerId)}
                      className="px-2 py-1 rounded-lg bg-white dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[11px] text-[#2D2327] dark:text-[#FAF4F0]"
                    >
                      <option value="partner1">Lançado por {partner1.nickname || partner1.name}</option>
                      <option value="partner2">Lançado por {partner2.nickname || partner2.name}</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddCustomExpense}
                    disabled={!newExpName.trim()}
                    className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-medium text-xs transition-colors"
                  >
                    + Incluir na Lista
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F2E8E4] dark:border-[#3D2F36]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#F2E8E4] dark:border-[#3D2F36] text-[#7D6F74] dark:text-[#B8A8AF] hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E07A8B] hover:bg-[#d66a7c] text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  Salvar Alterações de {currentRecord.monthLabel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Comprovante Pix / Anexo Modal */}
      {receiptModalBill && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#241C21] rounded-3xl max-w-md w-full p-6 border border-[#F2E8E4] dark:border-[#3D2F36] shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#F2E8E4] dark:border-[#3D2F36]">
              <div className="flex items-center gap-2">
                <Paperclip className="w-5 h-5 text-[#E07A8B]" />
                <h3 className="font-serif font-bold text-base text-[#2D2327] dark:text-[#FAF4F0]">
                  Comprovante: {receiptModalBill.title}
                </h3>
              </div>
              <button
                onClick={() => setReceiptModalBill(null)}
                className="text-xs text-[#7D6F74] hover:text-[#2D2327]"
              >
                ✕
              </button>
            </div>

            {/* Current receipt preview if exists */}
            {inputReceiptUrl ? (
              <div className="space-y-3">
                <div className="rounded-2xl overflow-hidden border border-[#F2E8E4] dark:border-[#3D2F36] bg-zinc-50 dark:bg-zinc-900 max-h-72 flex items-center justify-center">
                  <img
                    src={inputReceiptUrl}
                    alt="Comprovante de pagamento"
                    className="max-h-72 w-auto object-contain"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <a
                    href={inputReceiptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-[#E07A8B] hover:underline flex items-center gap-1 font-semibold"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Abrir em tela cheia</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setInputReceiptUrl('')}
                    className="text-xs text-rose-500 hover:underline"
                  >
                    Remover comprovante
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 px-4 rounded-2xl bg-[#FAF8F5] dark:bg-[#2A2026] border border-dashed border-[#F2E8E4] dark:border-[#3D2F36] space-y-2">
                <ImageIcon className="w-8 h-8 text-[#E07A8B] mx-auto opacity-70" />
                <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF]">
                  Nenhum comprovante anexado ainda. Faça upload da foto do Pix ou cole o link/código.
                </p>
              </div>
            )}

            {/* Upload or Link Input */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Foto ou Arquivo do Comprovante (Pix / Boleto)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUploadReceipt}
                  className="w-full text-xs text-[#7D6F74] dark:text-[#B8A8AF] file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#FAF3EC] file:text-[#E07A8B] hover:file:bg-[#F2E8E4] cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Ou cole o link da imagem / código Pix
                </label>
                <input
                  type="text"
                  value={inputReceiptUrl}
                  onChange={(e) => setInputReceiptUrl(e.target.value)}
                  placeholder="https://... ou código do comprovante"
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-xs text-[#2D2327] dark:text-[#FAF4F0]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F2E8E4] dark:border-[#3D2F36]">
              <button
                type="button"
                onClick={() => setReceiptModalBill(null)}
                className="px-4 py-2 rounded-xl text-xs text-[#7D6F74]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleSaveReceipt(inputReceiptUrl)}
                className="px-5 py-2 rounded-xl bg-[#E07A8B] text-white text-xs font-semibold shadow-xs hover:bg-[#d66a7c]"
              >
                Salvar Comprovante
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Lançar Nova Conta no Mês */}
      {isLaunchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#241C21] rounded-3xl max-w-md w-full p-6 border border-[#F2E8E4] dark:border-[#3D2F36] shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#F2E8E4] dark:border-[#3D2F36]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-pink-100 dark:bg-pink-950/60 text-[#E07A8B] flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-[#2D2327] dark:text-[#FAF4F0]">
                    Lançar Nova Conta
                  </h3>
                  <p className="text-[11px] text-[#7D6F74] dark:text-[#B8A8AF]">
                    Mês: {currentRecord.monthLabel}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsLaunchModalOpen(false)}
                className="text-xs text-[#7D6F74] hover:text-[#2D2327] p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Nome da Conta / Despesa *
                </label>
                <input
                  type="text"
                  value={launchTitle}
                  onChange={(e) => setLaunchTitle(e.target.value)}
                  placeholder="Ex: Aluguel, Farmácia, Luz, Internet, Spotify, Academia"
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-xs text-[#2D2327] dark:text-[#FAF4F0] focus:ring-1 focus:ring-[#E07A8B]"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                    Valor Total (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={launchAmount}
                    onChange={(e) => setLaunchAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-xs text-[#2D2327] dark:text-[#FAF4F0] font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                    Dia / Data de Vencimento
                  </label>
                  <input
                    type="text"
                    value={launchDueDate}
                    onChange={(e) => setLaunchDueDate(e.target.value)}
                    placeholder="Ex: 10 ou 10/10"
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-xs text-[#2D2327] dark:text-[#FAF4F0]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Categoria
                </label>
                <select
                  value={launchCategory}
                  onChange={(e) => setLaunchCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-xs text-[#2D2327] dark:text-[#FAF4F0]"
                >
                  <option value="Moradia Fixa">Moradia Fixa (Aluguel, Condomínio)</option>
                  <option value="Utilidades">Utilidades (Luz, Água, Gás)</option>
                  <option value="Conectividade">Conectividade (Internet, Celular)</option>
                  <option value="Alimentação & Feira">Alimentação & Feira</option>
                  <option value="Saúde & Farmácia">Saúde & Farmácia</option>
                  <option value="Streaming & Assinaturas">Streaming & Assinaturas</option>
                  <option value="Pet & Veterinário">Pet & Veterinário</option>
                  <option value="Lazer & Passeios">Lazer & Passeios</option>
                  <option value="Transporte & Combustível">Transporte & Combustível</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Quem está lançando?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLaunchAuthor('partner1')}
                    className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                      launchAuthor === 'partner1'
                        ? 'border-[#E07A8B] bg-pink-50/50 dark:bg-pink-950/30 text-[#E07A8B] font-bold'
                        : 'border-[#F2E8E4] dark:border-[#3D2F36] text-[#7D6F74]'
                    }`}
                  >
                    <PartnerAvatar avatar={partner1.avatar} name={partner1.name} size="xs" />
                    <span>{partner1.nickname || partner1.name}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLaunchAuthor('partner2')}
                    className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                      launchAuthor === 'partner2'
                        ? 'border-[#E07A8B] bg-pink-50/50 dark:bg-pink-950/30 text-[#E07A8B] font-bold'
                        : 'border-[#F2E8E4] dark:border-[#3D2F36] text-[#7D6F74]'
                    }`}
                  >
                    <PartnerAvatar avatar={partner2.avatar} name={partner2.name} size="xs" />
                    <span>{partner2.nickname || partner2.name}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Status Inicial
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLaunchPaid(false)}
                    className={`p-2 rounded-xl border text-xs font-medium transition-all ${
                      !launchPaid
                        ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-bold'
                        : 'border-[#F2E8E4] dark:border-[#3D2F36] text-[#7D6F74]'
                    }`}
                  >
                    ⏳ A Pagar (Pendente)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLaunchPaid(true)}
                    className={`p-2 rounded-xl border text-xs font-medium transition-all ${
                      launchPaid
                        ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold'
                        : 'border-[#F2E8E4] dark:border-[#3D2F36] text-[#7D6F74]'
                    }`}
                  >
                    ✓ Já Pago
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F2E8E4] dark:border-[#3D2F36]">
              <button
                type="button"
                onClick={() => setIsLaunchModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-[#7D6F74] hover:text-[#2D2327]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleLaunchNewBill}
                disabled={!launchTitle.trim() || !launchAmount}
                className="px-5 py-2 rounded-xl bg-[#E07A8B] hover:bg-[#d66a7c] disabled:opacity-40 text-white text-xs font-bold shadow-xs transition-colors"
              >
                Lançar Conta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar / Excluir Conta Individual */}
      {editingBill && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#241C21] rounded-3xl max-w-md w-full p-6 border border-[#F2E8E4] dark:border-[#3D2F36] shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#F2E8E4] dark:border-[#3D2F36]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-[#2D2327] dark:text-[#FAF4F0]">
                    Editar Conta
                  </h3>
                  <p className="text-[11px] text-[#7D6F74] dark:text-[#B8A8AF]">
                    {editingBill.isCore ? 'Conta Principal' : 'Outra Despesa'} ({currentRecord.monthLabel})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingBill(null)}
                className="text-xs text-[#7D6F74] hover:text-[#2D2327] p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Nome da Conta
                </label>
                <input
                  type="text"
                  value={editingBill.title}
                  onChange={(e) => setEditingBill({ ...editingBill, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-xs text-[#2D2327] dark:text-[#FAF4F0] focus:ring-1 focus:ring-[#E07A8B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                    Valor Total (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingBill.amount}
                    onChange={(e) =>
                      setEditingBill({ ...editingBill, amount: Math.max(0, parseFloat(e.target.value) || 0) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-xs text-[#2D2327] dark:text-[#FAF4F0] font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                    Dia de Vencimento
                  </label>
                  <input
                    type="text"
                    value={editingBill.dueDate || ''}
                    onChange={(e) => setEditingBill({ ...editingBill, dueDate: e.target.value })}
                    placeholder="Ex: 10 ou 10/10"
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-xs text-[#2D2327] dark:text-[#FAF4F0]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Categoria
                </label>
                <input
                  type="text"
                  value={editingBill.category || ''}
                  onChange={(e) => setEditingBill({ ...editingBill, category: e.target.value })}
                  placeholder="Ex: Moradia Fixa, Utilidades, Farmácia"
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-xs text-[#2D2327] dark:text-[#FAF4F0]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Quem Lançou
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingBill({ ...editingBill, author: 'partner1' })}
                    className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                      editingBill.author === 'partner1'
                        ? 'border-[#E07A8B] bg-pink-50/50 dark:bg-pink-950/30 text-[#E07A8B] font-bold'
                        : 'border-[#F2E8E4] dark:border-[#3D2F36] text-[#7D6F74]'
                    }`}
                  >
                    <PartnerAvatar avatar={partner1.avatar} name={partner1.name} size="xs" />
                    <span>{partner1.nickname || partner1.name}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingBill({ ...editingBill, author: 'partner2' })}
                    className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                      editingBill.author === 'partner2'
                        ? 'border-[#E07A8B] bg-pink-50/50 dark:bg-pink-950/30 text-[#E07A8B] font-bold'
                        : 'border-[#F2E8E4] dark:border-[#3D2F36] text-[#7D6F74]'
                    }`}
                  >
                    <PartnerAvatar avatar={partner2.avatar} name={partner2.name} size="xs" />
                    <span>{partner2.nickname || partner2.name}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#F2E8E4] dark:border-[#3D2F36]">
              {/* Delete button */}
              <button
                type="button"
                onClick={() => {
                  const bill = editingBill;
                  setEditingBill(null);
                  handleDeleteBill(bill.id, bill.title, bill.isCore);
                }}
                className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-100 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir Conta</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingBill(null)}
                  className="px-4 py-2 rounded-xl text-xs text-[#7D6F74] hover:text-[#2D2327]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveIndividualBill}
                  className="px-5 py-2 rounded-xl bg-[#E07A8B] hover:bg-[#d66a7c] text-white text-xs font-bold shadow-xs transition-colors"
                >
                  Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Bill Confirmation Modal (Iframe-safe) */}
      {billPendingDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#241C21] rounded-3xl max-w-sm w-full p-6 border border-[#F2E8E4] dark:border-[#3D2F36] shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="font-serif font-bold text-base text-[#2D2327] dark:text-[#FAF4F0]">
                Excluir Conta?
              </h3>
              <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF] leading-relaxed">
                Tem certeza que deseja excluir a conta{' '}
                <strong className="text-[#2D2327] dark:text-white">
                  "{billPendingDelete.title}"
                </strong>{' '}
                deste mês ({currentRecord.monthLabel})?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBillPendingDelete(null)}
                className="px-4 py-2.5 rounded-2xl border border-[#F2E8E4] dark:border-[#3D2F36] text-xs font-semibold text-[#7D6F74] dark:text-[#B8A8AF] hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteBill}
                className="px-4 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Default Bills Confirmation Modal */}
      {isConfirmRestoreOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#241C21] rounded-3xl max-w-sm w-full p-6 border border-[#F2E8E4] dark:border-[#3D2F36] shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="font-serif font-bold text-base text-[#2D2327] dark:text-[#FAF4F0]">
                Restaurar Contas Padrão?
              </h3>
              <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF] leading-relaxed">
                Deseja restaurar as contas padrão (Aluguel, Luz, Água, Internet, Cartão) em{' '}
                {currentRecord.monthLabel}?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmRestoreOpen(false)}
                className="px-4 py-2.5 rounded-2xl border border-[#F2E8E4] dark:border-[#3D2F36] text-xs font-semibold text-[#7D6F74] dark:text-[#B8A8AF] hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmRestoreDefaultBills}
                className="px-4 py-2.5 rounded-2xl bg-[#E07A8B] hover:bg-[#d66a7c] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Restaurar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
