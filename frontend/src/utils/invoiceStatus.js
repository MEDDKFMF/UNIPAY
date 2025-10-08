/**
 * Invoice Status Management Utilities
 * Handles automatic status updates based on business logic
 */

export const INVOICE_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent', 
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled'
};

export const STATUS_COLORS = {
  [INVOICE_STATUS.DRAFT]: 'bg-yellow-100 text-yellow-800',
  [INVOICE_STATUS.SENT]: 'bg-blue-100 text-blue-800',
  [INVOICE_STATUS.PAID]: 'bg-green-100 text-green-800',
  [INVOICE_STATUS.OVERDUE]: 'bg-red-100 text-red-800',
  [INVOICE_STATUS.CANCELLED]: 'bg-gray-100 text-gray-800'
};

export const STATUS_LABELS = {
  [INVOICE_STATUS.DRAFT]: 'Draft',
  [INVOICE_STATUS.SENT]: 'Sent',
  [INVOICE_STATUS.PAID]: 'Paid',
  [INVOICE_STATUS.OVERDUE]: 'Overdue',
  [INVOICE_STATUS.CANCELLED]: 'Cancelled'
};

/**
 * Automatically determine invoice status based on business logic
 * @param {Object} invoice - Invoice object
 * @returns {string} - Updated status
 */
export const getAutoStatus = (invoice) => {
  const { status, due_date } = invoice;
  const today = new Date();
  const dueDate = new Date(due_date);
  
  // If already paid or cancelled, don't change
  if (status === INVOICE_STATUS.PAID || status === INVOICE_STATUS.CANCELLED) {
    return status;
  }
  
  // If sent and past due date, mark as overdue
  if (status === INVOICE_STATUS.SENT && today > dueDate) {
    return INVOICE_STATUS.OVERDUE;
  }
  
  // If draft and past due date, mark as overdue
  if (status === INVOICE_STATUS.DRAFT && today > dueDate) {
    return INVOICE_STATUS.OVERDUE;
  }
  
  return status;
};

/**
 * Check if status transition is valid
 * @param {string} fromStatus - Current status
 * @param {string} toStatus - Target status
 * @returns {boolean} - Whether transition is valid
 */
export const isValidStatusTransition = (fromStatus, toStatus) => {
  const validTransitions = {
    [INVOICE_STATUS.DRAFT]: [INVOICE_STATUS.SENT, INVOICE_STATUS.CANCELLED],
    [INVOICE_STATUS.SENT]: [INVOICE_STATUS.PAID, INVOICE_STATUS.OVERDUE, INVOICE_STATUS.CANCELLED],
    [INVOICE_STATUS.OVERDUE]: [INVOICE_STATUS.PAID, INVOICE_STATUS.CANCELLED],
    [INVOICE_STATUS.PAID]: [], // Paid is final
    [INVOICE_STATUS.CANCELLED]: [] // Cancelled is final
  };
  
  return validTransitions[fromStatus]?.includes(toStatus) || false;
};

/**
 * Get next logical status in the workflow
 * @param {string} currentStatus - Current status
 * @returns {string|null} - Next status or null if no next step
 */
export const getNextStatus = (currentStatus) => {
  const nextStatuses = {
    [INVOICE_STATUS.DRAFT]: INVOICE_STATUS.SENT,
    [INVOICE_STATUS.SENT]: INVOICE_STATUS.PAID,
    [INVOICE_STATUS.OVERDUE]: INVOICE_STATUS.PAID,
    [INVOICE_STATUS.PAID]: null,
    [INVOICE_STATUS.CANCELLED]: null
  };
  
  return nextStatuses[currentStatus] || null;
};

/**
 * Get status badge component props
 * @param {string} status - Invoice status
 * @returns {Object} - Props for status badge
 */
export const getStatusBadgeProps = (status) => {
  return {
    className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] || STATUS_COLORS[INVOICE_STATUS.DRAFT]}`,
    children: STATUS_LABELS[status] || STATUS_LABELS[INVOICE_STATUS.DRAFT]
  };
};

