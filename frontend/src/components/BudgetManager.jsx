import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';
import Chart from 'chart.js/auto';
import api from '../services/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const BudgetManager = ({ itineraryId, budget, onUpdate, isEditorRole = false }) => {
  const { token } = useSelector(state => state.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [totalBudget, setTotalBudget] = useState(budget?.total || 0);
  const [currency, setCurrency] = useState(budget?.currency || 'USD');
  const [showSplitwise, setShowSplitwise] = useState(false);
  const [expenseData, setExpenseData] = useState(null);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({
    title: '',
    amount: '',
    category: 'other',
    notes: ''
  });
  
  // Chart refs
  const categoryChartRef = useRef(null);
  const balanceChartRef = useRef(null);
  const categoryChartInstance = useRef(null);
  const balanceChartInstance = useRef(null);
  
  useEffect(() => {
    if (budget) {
      setTotalBudget(budget.total);
      setCurrency(budget.currency);
    }
  }, [budget]);
  
  // Make sure to fetch expense data initially if splitwise is enabled
  useEffect(() => {
    if (budget && budget.isSplitwiseEnabled) {
      setShowSplitwise(true);
      fetchExpenseData();
    }
  }, [budget]);
  
  // Create or update charts when expense data changes
  useEffect(() => {
    if (expenseData && showSplitwise) {
      updateCategoryChart();
      updateBalanceChart();
    }
    
    return () => {
      // Cleanup charts on component unmount
      if (categoryChartInstance.current) {
        categoryChartInstance.current.destroy();
      }
      if (balanceChartInstance.current) {
        balanceChartInstance.current.destroy();
      }
    };
  }, [expenseData, showSplitwise]);
  
  const handleUpdateBudget = async () => {
    try {
      setIsLoading(true);
      const response = await api.put(
        `/budget/itineraries/${itineraryId}`,
        { total: totalBudget, currency }
      );
      
      if (response.data.status === 'success') {
        toast.success('Budget updated successfully');
        setIsEditing(false);
        if (onUpdate) onUpdate(response.data.data.budget);
      }
    } catch (error) {
      console.error('Error updating budget:', error);
      toast.error('Failed to update budget');
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleSplitwiseMode = async () => {
    try {
      setIsLoading(true);
      const response = await api.put(
        `/budget/itineraries/${itineraryId}/splitwise`,
        { isEnabled: !showSplitwise }
      );
      
      if (response.data.status === 'success') {
        setShowSplitwise(!showSplitwise);
        if (!showSplitwise) {
          fetchExpenseData();
        }
        toast.success(`Splitwise mode ${!showSplitwise ? 'enabled' : 'disabled'}`);
        
        // Update the budget object if onUpdate is provided
        if (onUpdate && response.data.data && response.data.data.budget) {
          onUpdate(response.data.data.budget);
        }
      }
    } catch (error) {
      console.error('Error toggling splitwise mode:', error);
      toast.error('Failed to toggle splitwise mode');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchExpenseData = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(
        `/budget/itineraries/${itineraryId}/breakdown`
      );
      
      if (response.data.status === 'success') {
        setExpenseData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching expense data:', error);
      toast.error('Failed to fetch expense data');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleExpenseInputChange = (e) => {
    const { name, value } = e.target;
    setNewExpense(prev => ({
      ...prev,
      [name]: name === 'amount' ? value : value
    }));
  };
  
  const addExpense = async (e) => {
    e.preventDefault();
    
    if (!newExpense.title || !newExpense.amount) {
      toast.error('Title and amount are required');
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await api.post(
        `/budget/itineraries/${itineraryId}/expenses`,
        newExpense
      );
      
      if (response.data.status === 'success') {
        toast.success('Expense added successfully');
        setNewExpense({
          title: '',
          amount: '',
          category: 'other',
          notes: ''
        });
        setIsAddingExpense(false);
        fetchExpenseData();
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('Failed to add expense');
    } finally {
      setIsLoading(false);
    }
  };
  
  const settleExpense = async (memberId, amount) => {
    try {
      setIsLoading(true);
      const response = await api.post(
        `/budget/itineraries/${itineraryId}/settle`,
        { memberId, amount }
      );
      
      if (response.data.status === 'success') {
        toast.success('Expense settled successfully');
        fetchExpenseData();
      }
    } catch (error) {
      console.error('Error settling expense:', error);
      toast.error('Failed to settle expense');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Create category pie chart
  const updateCategoryChart = () => {
    if (!categoryChartRef.current || !expenseData || !expenseData.categoryBreakdown) return;
    
    // Prepare data
    const categories = Object.keys(expenseData.categoryBreakdown || {});
    const values = Object.values(expenseData.categoryBreakdown || {});
    
    // Capitalize category names and filter out zero values
    const nonZeroData = categories.map((cat, index) => ({
      category: cat.charAt(0).toUpperCase() + cat.slice(1),
      value: values[index]
    })).filter(item => item.value > 0);
    
    const labels = nonZeroData.map(item => item.category);
    const dataValues = nonZeroData.map(item => item.value);
    
    // Clean up previous chart if it exists
    if (categoryChartInstance.current) {
      categoryChartInstance.current.destroy();
    }
    
    // Create new chart
    categoryChartInstance.current = new Chart(categoryChartRef.current, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: dataValues,
          backgroundColor: COLORS,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.raw || 0;
                return `${label}: ${currency} ${value.toFixed(2)}`;
              }
            }
          }
        }
      }
    });
  };
  
  // Create balance bar chart
  const updateBalanceChart = () => {
    if (!balanceChartRef.current || !expenseData || !expenseData.balances) return;
    
    // Prepare data
    const names = expenseData.balances.map(b => b.name);
    const balances = expenseData.balances.map(b => b.net);
    
    // Generate colors based on positive/negative values
    const bgColors = balances.map(val => val >= 0 ? '#00C49F' : '#FF8042');
    
    // Clean up previous chart if it exists
    if (balanceChartInstance.current) {
      balanceChartInstance.current.destroy();
    }
    
    // Create new chart
    balanceChartInstance.current = new Chart(balanceChartRef.current, {
      type: 'bar',
      data: {
        labels: names,
        datasets: [{
          label: 'Balance',
          data: balances,
          backgroundColor: bgColors,
          borderColor: bgColors,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return `${currency} ${value.toFixed(2)}`;
              }
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw;
                return `Balance: ${currency} ${value.toFixed(2)}`;
              }
            }
          },
          legend: {
            display: false
          }
        }
      }
    });
  };
  
  const canEdit = isEditorRole;
  
  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        {!isEditing ? (
          canEdit && (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-[#56288A] text-white px-4 py-2 rounded-lg hover:bg-[#864BD8] transition-colors flex items-center gap-2"
              disabled={isLoading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Budget
            </button>
          )
        ) : (
          <div className="flex space-x-2">
            <button
              onClick={handleUpdateBudget}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-green-300 transition-colors flex items-center gap-2"
              disabled={isLoading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 disabled:bg-gray-200 transition-colors flex items-center gap-2"
              disabled={isLoading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </button>
          </div>
        )}
      </div>
      
      {/* Budget info */}
      <div className="mb-6">
        {isEditing ? (
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <label className="block text-gray-700 mb-2 font-medium">Budget Amount</label>
              <input
                type="number"
                value={totalBudget}
                onChange={(e) => setTotalBudget(parseFloat(e.target.value))}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#56288A] focus:border-transparent"
                disabled={isLoading}
              />
            </div>
            <div className="flex-1">
              <label className="block text-gray-700 mb-2 font-medium">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#56288A] focus:border-transparent"
                disabled={isLoading}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="INR">INR</option>
                <option value="JPY">JPY</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-100">
              <h3 className="text-gray-600 text-sm font-medium mb-1">Total Budget</h3>
              <p className="text-2xl font-bold text-[#56288A]">{currency} {budget?.total?.toLocaleString() || 0}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
              <h3 className="text-gray-600 text-sm font-medium mb-1">Per Person</h3>
              <p className="text-2xl font-bold text-blue-600">{currency} {budget?.perPerson?.toLocaleString() || 0}</p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-lg border border-amber-100">
              <h3 className="text-gray-600 text-sm font-medium mb-1">Spent</h3>
              <p className="text-2xl font-bold text-amber-600">{currency} {budget?.spent?.toLocaleString() || 0}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-100">
              <h3 className="text-gray-600 text-sm font-medium mb-1">Remaining</h3>
              <p className="text-2xl font-bold text-green-600">
                {currency} {((budget?.total || 0) - (budget?.spent || 0)).toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Splitwise toggle */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-gray-700 font-medium">Enable Expense Splitting</span>
          {canEdit ? (
            <button
              onClick={toggleSplitwiseMode}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                showSplitwise 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-[#56288A] text-white hover:bg-[#864BD8]'
              }`}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : (showSplitwise ? 'Disable Splitting' : 'Enable Splitting')}
            </button>
          ) : (
            <span className={`px-3 py-1 text-sm rounded-full ${
              showSplitwise 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {showSplitwise ? 'Enabled' : 'Disabled'}
            </span>
          )}
        </div>
      </div>
      
      {showSplitwise && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-[#56288A]">Expense Tracking</h3>
            <button
              onClick={() => setIsAddingExpense(!isAddingExpense)}
              className={`text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                isAddingExpense 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-[#56288A] hover:bg-[#864BD8]'
              }`}
            >
              {isAddingExpense ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Expense
                </>
              )}
            </button>
          </div>
          
          {isAddingExpense && (
            <div className="bg-gradient-to-br from-[#56288A]/5 to-[#864BD8]/5 p-6 rounded-lg mb-6 border border-purple-100">
              <h4 className="text-md font-semibold text-[#56288A] mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                New Expense
              </h4>
              <form onSubmit={addExpense}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Title*
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={newExpense.title}
                      onChange={handleExpenseInputChange}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#56288A] focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Amount* ({currency})
                    </label>
                    <input
                      type="number"
                      name="amount"
                      value={newExpense.amount}
                      onChange={handleExpenseInputChange}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#56288A] focus:border-transparent"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Category
                    </label>
                    <select
                      name="category"
                      value={newExpense.category}
                      onChange={handleExpenseInputChange}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#56288A] focus:border-transparent"
                    >
                      <option value="accommodation">Accommodation</option>
                      <option value="food">Food</option>
                      <option value="transport">Transportation</option>
                      <option value="attraction">Attraction</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Notes
                    </label>
                    <input
                      type="text"
                      name="notes"
                      value={newExpense.notes}
                      onChange={handleExpenseInputChange}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#56288A] focus:border-transparent"
                      placeholder="Optional notes"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-[#56288A] text-white px-6 py-2 rounded-lg hover:bg-[#864BD8] transition-colors flex items-center"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      'Saving...'
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Expense
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {expenseData && (
            <div className="space-y-6">
              {expenseData.categoryBreakdown && Object.keys(expenseData.categoryBreakdown).length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                    <h4 className="text-md font-medium mb-4 text-gray-700">Expense Categories</h4>
                    <div className="h-60">
                      <canvas ref={categoryChartRef}></canvas>
                    </div>
                  </div>
                  {expenseData.balances && expenseData.balances.length > 0 && (
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                      <h4 className="text-md font-medium mb-4 text-gray-700">Member Balances</h4>
                      <div className="h-60">
                        <canvas ref={balanceChartRef}></canvas>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {expenseData.balances && expenseData.balances.length > 0 && 
               (!expenseData.categoryBreakdown || Object.keys(expenseData.categoryBreakdown).length === 0) && (
                <div className="grid grid-cols-1 gap-6 mb-8">
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                    <h4 className="text-md font-medium mb-4 text-gray-700">Member Balances</h4>
                    <div className="h-60">
                      <canvas ref={balanceChartRef}></canvas>
                    </div>
                  </div>
                </div>
              )}
              
              <div>
                <h4 className="text-md font-medium mb-3 text-gray-700 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#56288A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Recent Expenses
                </h4>
                <div className="bg-white rounded-lg overflow-hidden border border-gray-100">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid By</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {expenseData?.recentExpenses?.length > 0 ? (
                          expenseData.recentExpenses.map(expense => (
                            <tr key={expense.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="font-medium text-gray-900">{expense.title}</div>
                                {expense.notes && <div className="text-sm text-gray-500">{expense.notes}</div>}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-gray-900 font-medium">{currency} {expense.amount.toFixed(2)}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                  ${expense.category === 'food' ? 'bg-green-100 text-green-800' : 
                                    expense.category === 'accommodation' ? 'bg-indigo-100 text-indigo-800' :
                                    expense.category === 'transport' ? 'bg-blue-100 text-blue-800' :
                                    expense.category === 'attraction' ? 'bg-purple-100 text-purple-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                  {expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {expense.paidBy.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(expense.createdAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                              No expenses recorded yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-md font-medium mb-3 text-gray-700 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#56288A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                  Settlements
                </h4>
                {expenseData?.settlements?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {expenseData.settlements.map((settlement, index) => (
                      <div key={index} className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="text-sm font-medium text-gray-600">
                              {settlement.from.name} owes {settlement.to.name}
                            </p>
                            <p className="text-lg font-bold text-gray-900">
                              {currency} {settlement.amount.toFixed(2)}
                            </p>
                          </div>
                          {canEdit && (
                            <button
                              onClick={() => settleExpense(settlement.from.id, settlement.amount)}
                              className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                              disabled={isLoading}
                            >
                              Mark as Settled
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-green-50 p-4 rounded-lg text-green-700 text-center border border-green-100">
                    All balances are settled! 👍
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BudgetManager; 