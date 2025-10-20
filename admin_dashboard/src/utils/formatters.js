import { format, formatDistanceToNow } from 'date-fns';

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount) + ' UZS';
};

export const formatDate = (date, formatStr = 'PPP') => {
  if (!date) return 'N/A';
  return format(new Date(date), formatStr);
};

export const formatDateTime = (date) => {
  if (!date) return 'N/A';
  return format(new Date(date), 'PPP p');
};

export const formatTimeAgo = (date) => {
  if (!date) return 'N/A';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const getOrderStatusColor = (status) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-blue-100 text-blue-800',
    confirmed: 'bg-purple-100 text-purple-800',
    preparing: 'bg-orange-100 text-orange-800',
    ready: 'bg-cyan-100 text-cyan-800',
    out_for_delivery: 'bg-indigo-100 text-indigo-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const getOrderStatusLabel = (status) => {
  const labels = {
    pending: 'Pending',
    paid: 'Paid',
    confirmed: 'Confirmed',
    preparing: 'Preparing',
    ready: 'Ready',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled'
  };
  return labels[status] || status;
};

export const getPaymentStatusColor = (status) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};