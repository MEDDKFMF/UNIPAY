import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Calendar, User, DollarSign, Percent, Send } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getInvoice, updateInvoice, getClients, updateInvoiceStatus } from '../services/invoiceService';
import { sendInvoiceNotification } from '../services/messagingService';
import { useNotifications } from '../context/NotificationContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import InvoiceHeader from '../components/InvoiceHeader';

const EditInvoice = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [invoice, setInvoice] = useState(null);
  const [clients, setClients] = useState([]);
  const [formData, setFormData] = useState({
    client: '',
    issue_date: new Date(),
    due_date: new Date(),
    currency: 'KES',
    status: 'draft',
    tax_rate: 16,
    discount_rate: 0,
    notes: '',
    terms_conditions: '',
    items: []
  });

  useEffect(() => {
    fetchInvoice();
    fetchClients();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const data = await getInvoice(id);
      setInvoice(data);
      
      // Set form data from invoice
      setFormData({
        client: data.client?.id || '',
        issue_date: new Date(data.issue_date),
        due_date: new Date(data.due_date),
        currency: data.currency || 'KES',
        status: data.status || 'draft',
        tax_rate: data.tax_rate || 16,
        discount_rate: data.discount_rate || 0,
        notes: data.notes || '',
        terms_conditions: data.terms_conditions || '',
        items: data.items?.map(item => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          notes: item.notes || ''
        })) || []
      });
    } catch (error) {
      toast.error('Failed to fetch invoice');
      console.error('Error fetching invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const data = await getClients();
      // Ensure clients is always an array
      setClients(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setClients([]);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = {
      ...newItems[index],
      [field]: value
    };
    
    // Recalculate item total
    if (field === 'quantity' || field === 'unit_price') {
      const quantity = field === 'quantity' ? value : newItems[index].quantity;
      const unitPrice = field === 'unit_price' ? value : newItems[index].unit_price;
      newItems[index].total_price = quantity * unitPrice;
    }
    
    setFormData(prev => ({
      ...prev,
      items: newItems
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: null,
          description: '',
          quantity: 1,
          unit_price: 0,
          total_price: 0,
          notes: ''
        }
      ]
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.total_price || 0), 0);
    const taxAmount = (subtotal * formData.tax_rate) / 100;
    const discountAmount = (subtotal * formData.discount_rate) / 100;
    const total = subtotal + taxAmount - discountAmount;
    
    return { subtotal, taxAmount, discountAmount, total };
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Validate form
      if (!formData.client) {
        toast.error('Please select a client');
        return;
      }
      
      if (formData.items.length === 0) {
        toast.error('Please add at least one item');
        return;
      }
      
      if (formData.items.some(item => !item.description || item.quantity <= 0 || item.unit_price <= 0)) {
        toast.error('Please fill in all item details correctly');
        return;
      }
      
      const { subtotal, taxAmount, discountAmount, total } = calculateTotals();
      
      const updateData = {
        client: formData.client,
        issue_date: formData.issue_date.toISOString().split('T')[0],
        due_date: formData.due_date.toISOString().split('T')[0],
        currency: formData.currency,
        status: formData.status,
        tax_rate: formData.tax_rate,
        discount_rate: formData.discount_rate,
        subtotal: subtotal,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        total_amount: total,
        notes: formData.notes,
        terms_conditions: formData.terms_conditions,
        items: formData.items
      };
      
      await updateInvoice(id, updateData);
      
      // Check if status changed and add appropriate notification (excluding paid status)
      if (invoice && invoice.status !== formData.status && formData.status !== 'paid') {
        const selectedClient = clients.find(client => client.id === formData.client);
        let notificationType = '';
        let notificationMessage = '';
        
        switch (formData.status) {
          case 'overdue':
            notificationType = 'invoice_overdue';
            notificationMessage = `Invoice #${invoice.invoice_number} is now overdue`;
            break;
          case 'sent':
            notificationType = 'invoice_created';
            notificationMessage = `Invoice #${invoice.invoice_number} has been sent`;
            break;
          default:
            notificationType = 'system_update';
            notificationMessage = `Invoice #${invoice.invoice_number} status updated to ${formData.status}`;
        }
        
        addNotification({
          id: Date.now(),
          type: notificationType,
          message: notificationMessage,
          data: {
            invoice_number: invoice.invoice_number,
            client_name: selectedClient?.name || 'Unknown Client',
            old_status: invoice.status,
            new_status: formData.status
          },
          is_read: false,
          created_at: new Date().toISOString()
        });
      }
      
      toast.success('Invoice updated successfully');
      navigate(`/app/invoices/${id}`);
    } catch (error) {
      toast.error('Failed to update invoice');
      console.error('Error updating invoice:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSendToClient = async () => {
    if (!invoice) return;
    
    // Check if client has email
    const selectedClient = clients.find(client => client.id === parseInt(formData.client));
    if (!selectedClient?.email) {
      toast.error('Client email is required to send invoice');
      return;
    }
    
    // Confirm before sending
    const confirmed = window.confirm(
      `Send invoice #${invoice.invoice_number} to ${selectedClient.name} (${selectedClient.email})?`
    );
    
    if (!confirmed) return;
    
    try {
      setSaving(true);
      
      // Update invoice status to 'sent' if it's currently 'draft'
      if (invoice.status === 'draft') {
        await updateInvoiceStatus(id, 'sent');
        setInvoice(prev => ({ ...prev, status: 'sent' }));
        setFormData(prev => ({ ...prev, status: 'sent' }));
      }
      
      // Send email notification
      await sendInvoiceNotification({
        invoice_id: id,
        notification_type: 'invoice_sent'
      });
      
      toast.success('Invoice sent to client successfully');
    } catch (error) {
      toast.error('Failed to send invoice');
      console.error('Error sending invoice:', error);
    } finally {
      setSaving(false);
    }
  };

  const { subtotal, taxAmount, discountAmount, total } = calculateTotals();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(`/app/invoices/${id}`)}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Invoice
          </button>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Invoice</h1>
            <p className="text-gray-600 mt-1">Update invoice details and items</p>
        </div>
        <div className="flex items-center space-x-3">
          {invoice?.status === 'draft' && (
            <button
              onClick={handleSendToClient}
              disabled={saving}
              className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              <Send className="w-4 h-4 mr-2" />
              {saving ? 'Sending...' : 'Send to Client'}
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Invoice Header */}
      <InvoiceHeader isEditable={true} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client and Dates */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Client & Dates
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Client</label>
                <select
                  value={formData.client}
                  onChange={(e) => handleInputChange('client', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a client</option>
                  {(clients || []).map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name} - {client.email}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                <select
                  value={formData.currency}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="KES">KES - Kenyan Shilling</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Issue Date</label>
                <DatePicker
                  selected={formData.issue_date}
                  onChange={(date) => handleInputChange('issue_date', date)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  dateFormat="yyyy-MM-dd"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                <DatePicker
                  selected={formData.due_date}
                  onChange={(date) => handleInputChange('due_date', date)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  dateFormat="yyyy-MM-dd"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={formData.status === 'paid'}
                >
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  {formData.status === 'paid' && <option value="paid">Paid</option>}
                  <option value="overdue">Overdue</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <p className="text-gray-500 text-xs mt-1">
                  {formData.status === 'paid' 
                    ? 'Invoice is marked as paid. Use the "Record Payment" button to manage payments.'
                    : 'Draft → Sent → Paid (via payment recording) or Overdue if past due date'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Invoice Items</h2>
              <button
                onClick={addItem}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </button>
            </div>
            
            {formData.items.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Item description"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0.01"
                      step="0.01"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Unit Price</label>
                    <input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                    <input
                      type="text"
                      value={item.notes}
                      onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Item notes"
                    />
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Total</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {formData.currency} {(item.total_price || 0).toLocaleString()}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => removeItem(index)}
                    className="ml-4 p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            
            {formData.items.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No items added yet. Click "Add Item" to get started.</p>
              </div>
            )}
          </div>

          {/* Notes and Terms */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Notes & Terms</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Additional notes for the client"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Terms & Conditions</label>
                <textarea
                  value={formData.terms_conditions}
                  onChange={(e) => handleInputChange('terms_conditions', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Payment terms and conditions"
                />
              </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Tax, Discount, Totals */}
        <div className="space-y-6">
          {/* Tax and Discount */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Percent className="w-5 h-5 mr-2" />
              Tax & Discount
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tax Rate (%)</label>
                <input
                  type="number"
                  value={formData.tax_rate}
                  onChange={(e) => handleInputChange('tax_rate', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  max="100"
                  step="0.01"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Discount Rate (%)</label>
                <input
                  type="number"
                  value={formData.discount_rate}
                  onChange={(e) => handleInputChange('discount_rate', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  max="100"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          {/* Totals */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Invoice Summary
            </h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{formData.currency} {subtotal.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Tax ({formData.tax_rate}%):</span>
                <span className="font-medium">{formData.currency} {taxAmount.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Discount ({formData.discount_rate}%):</span>
                <span className="font-medium text-red-600">-{formData.currency} {discountAmount.toLocaleString()}</span>
              </div>
              
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold text-gray-900">Total:</span>
                  <span className="text-lg font-semibold text-gray-900">{formData.currency} {total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditInvoice; 