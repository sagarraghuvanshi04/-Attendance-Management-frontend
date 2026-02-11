import React, { useState, useEffect } from "react";
import { CreditCard, Download, CheckCircle2, AlertCircle, History, ReceiptIndianRupee, X, Copy, Check } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import api from "../../services/api";
import toast from "react-hot-toast";
import Loader from "../../components/Loader"; 

const Payments = () => {
  const [showPricing, setShowPricing] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showQRPayment, setShowQRPayment] = useState(false);
  const [copied, setCopied] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [paymentProof, setPaymentProof] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Library owner UPI details
  const upiDetails = {
    upiId: "successpoint@paytm",
    name: "Success Point Digital Lab",
    qrData: "upi://pay?pa=successpoint@paytm&pn=Success Point&cu=INR"
  };

  const pricingPlans = [
    { 
      name: "Non-AC", 
      price: "600", 
      duration: "Monthly", 
      features: [
        "Full Day Access (8 AM - 8 PM)", 
        "Comfortable Seating", 
        "High Speed Wi-Fi", 
        "Locker Facility",
        "Drinking Water"
      ] 
    },
    { 
      name: "AC", 
      price: "800", 
      duration: "Monthly", 
      features: [
        "Full Day Access (8 AM - 8 PM)", 
        "AC Environment", 
        "Premium Seating", 
        "High Speed Wi-Fi", 
        "Locker Facility",
        "Free Coffee/Tea"
      ],
      popular: true
    },
  ];

  // ------------------- Fetch Student Profile & Transactions -------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch student profile for expiry date
        const profileRes = await api.get("/students/profile");
        if (profileRes.data.success || profileRes.data.student) {
          setStudentInfo(profileRes.data.student || profileRes.data);
        }
        
        // Fetch payment transactions
        const paymentsRes = await api.get("/payments/student");
        setTransactions(paymentsRes.data.payments || []);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Calculate next billing date from expiry
  const getNextBillingDate = () => {
    if (!studentInfo?.expiry && !studentInfo?.expiryDate) return "N/A";
    const expiryDate = new Date(studentInfo.expiry || studentInfo.expiryDate);
    return expiryDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Get current plan name based on last payment or default
  const getCurrentPlan = () => {
    if (transactions.length > 0) {
      const lastPayment = transactions[0];
      const amount = parseInt(lastPayment.amount);
      // Match with new pricing
      if (amount >= 800) return "AC";
      if (amount >= 600) return "Non-AC";
    }
    return "Non-AC"; // Default
  };

  const getCurrentPlanPrice = () => {
    if (transactions.length > 0) {
      return transactions[0].amount;
    }
    return "600"; // Default Non-AC price
  };

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    setShowPricing(false);
    setShowQRPayment(true);
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText(upiDetails.upiId);
    setCopied(true);
    toast.success("UPI ID copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePaymentProofUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentProof(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!transactionId.trim()) {
      toast.error("Please enter transaction ID");
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post("/payments/submit-payment", {
        plan: selectedPlan.name,
        amount: selectedPlan.price,
        transactionId,
        paymentProof
      });

      if (res.data.success) {
        toast.success("Payment submitted! Waiting for admin approval.");
        setShowQRPayment(false);
        setTransactionId("");
        setPaymentProof(null);
        // Refresh transactions
        const paymentsRes = await api.get("/payments/student");
        setTransactions(paymentsRes.data.payments || []);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit payment");
    } finally {
      setSubmitting(false);
    }
  };

  // ------------------- Function to Generate PDF Receipt -------------------
  const downloadReceipt = (tx) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Watermark FIRST (background)
    doc.setFontSize(70);
    doc.setTextColor(250, 250, 250);
    doc.setFont(undefined, 'bold');
    doc.text("PAID", pageWidth / 2, pageHeight / 2, { 
      align: "center",
      angle: 45
    });

    // Header with gradient effect (using rectangles)
    doc.setFillColor(79, 70, 229); // Indigo
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    // Library Logo/Name
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.text("SUCCESS POINT", pageWidth / 2, 15, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text("Digital Library & Study Zone", pageWidth / 2, 22, { align: "center" });
    doc.text("Near Main Gate, Digital Zone Path, Lucknow - 226001", pageWidth / 2, 28, { align: "center" });
    doc.text("Phone: +91 9876543210 | Email: info@successpoint.com", pageWidth / 2, 34, { align: "center" });

    // Receipt Title
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 45, pageWidth, 15, 'F');
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.setFont(undefined, 'bold');
    doc.text("PAYMENT RECEIPT", pageWidth / 2, 54, { align: "center" });

    // Receipt Number and Date
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.setFont(undefined, 'normal');
    doc.text(`Receipt No: ${tx.transactionId || tx.id}`, 15, 70);
    doc.text(`Date: ${new Date(tx.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, pageWidth - 15, 70, { align: "right" });

    // Student Details Section
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(15, 78, pageWidth - 30, 25, 3, 3, 'F');
    
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.setFont(undefined, 'bold');
    doc.text("Student Details:", 20, 86);
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    doc.text(`Name: ${studentInfo?.name || 'N/A'}`, 20, 93);
    doc.text(`Student ID: ${studentInfo?.studentId || 'N/A'}`, 20, 99);
    doc.text(`Course: ${studentInfo?.course || 'N/A'}`, pageWidth / 2 + 10, 93);
    doc.text(`Seat: ${studentInfo?.seat || 'N/A'}`, pageWidth / 2 + 10, 99);

    // Payment Details Table (Manual)
    let tableY = 115;
    
    // Table Header
    doc.setFillColor(79, 70, 229);
    doc.rect(15, tableY, pageWidth - 30, 10, 'F');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.text("Description", 20, tableY + 7);
    doc.text("Details", pageWidth / 2, tableY + 7);
    doc.text("Amount", pageWidth - 20, tableY + 7, { align: "right" });
    
    // Table Rows
    tableY += 10;
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(255, 255, 255);
    
    // Calculate fee details
    const amount = parseInt(tx.amount);
    const feeType = amount >= 800 ? "AC" : "Non-AC";
    const monthlyFee = amount >= 800 ? 800 : 600;
    const monthsPaid = Math.round(amount / monthlyFee);
    
    // Row 1 - Fee Type
    doc.setFillColor(255, 255, 255);
    doc.rect(15, tableY, pageWidth - 30, 10, 'FD');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.setFont(undefined, 'bold');
    doc.text("Fee Type", 20, tableY + 7);
    doc.setFont(undefined, 'normal');
    doc.text(feeType, pageWidth / 2, tableY + 7);
    doc.text("-", pageWidth - 20, tableY + 7, { align: "right" });
    
    // Row 2 - Monthly Fee
    tableY += 10;
    doc.setFillColor(255, 255, 255);
    doc.rect(15, tableY, pageWidth - 30, 10, 'FD');
    doc.setFont(undefined, 'bold');
    doc.text("Monthly Fee", 20, tableY + 7);
    doc.setFont(undefined, 'normal');
    doc.text(`Rs. ${monthlyFee}/month`, pageWidth / 2, tableY + 7);
    doc.text("-", pageWidth - 20, tableY + 7, { align: "right" });
    
    // Row 3 - Months Paid
    tableY += 10;
    doc.setFillColor(255, 255, 255);
    doc.rect(15, tableY, pageWidth - 30, 10, 'FD');
    doc.setFont(undefined, 'bold');
    doc.text("Months Paid", 20, tableY + 7);
    doc.setFont(undefined, 'normal');
    doc.text(`${monthsPaid} Month${monthsPaid > 1 ? 's' : ''}`, pageWidth / 2, tableY + 7);
    doc.setFont(undefined, 'bold');
    doc.text(`Rs. ${tx.amount}`, pageWidth - 20, tableY + 7, { align: "right" });
    
    // Row 4 - Period
    tableY += 10;
    doc.setFillColor(255, 255, 255);
    doc.rect(15, tableY, pageWidth - 30, 10, 'FD');
    doc.setFont(undefined, 'bold');
    doc.text("Period", 20, tableY + 7);
    doc.setFont(undefined, 'normal');
    doc.text(tx.month, pageWidth / 2, tableY + 7);
    doc.text("-", pageWidth - 20, tableY + 7, { align: "right" });
    
    // Row 5 - Payment Method
    tableY += 10;
    doc.setFillColor(255, 255, 255);
    doc.rect(15, tableY, pageWidth - 30, 10, 'FD');
    doc.setFont(undefined, 'bold');
    doc.text("Payment Method", 20, tableY + 7);
    doc.setFont(undefined, 'normal');
    doc.text(tx.method, pageWidth / 2, tableY + 7);
    doc.text("-", pageWidth - 20, tableY + 7, { align: "right" });
    
    // Row 6 - Transaction ID
    tableY += 10;
    doc.setFillColor(255, 255, 255);
    doc.rect(15, tableY, pageWidth - 30, 10, 'FD');
    doc.setFont(undefined, 'bold');
    doc.text("Transaction ID", 20, tableY + 7);
    doc.setFont(undefined, 'normal');
    doc.text(tx.transactionId || tx.id, pageWidth / 2, tableY + 7);
    doc.text("-", pageWidth - 20, tableY + 7, { align: "right" });

    // Total Amount Box
    const finalY = tableY + 20;
    doc.setFillColor(79, 70, 229);
    doc.roundedRect(pageWidth - 80, finalY, 65, 20, 3, 3, 'F');
    
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text("Total Amount Paid", pageWidth - 47.5, finalY + 8, { align: "center" });
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text(`Rs. ${tx.amount}`, pageWidth - 47.5, finalY + 16, { align: "center" });

    // Status Badge
    doc.setFont(undefined, 'bold');
    doc.setFontSize(10);
    if (tx.status === "Paid") {
      doc.setFillColor(16, 185, 129);
      doc.setTextColor(255, 255, 255);
    } else {
      doc.setFillColor(239, 68, 68);
      doc.setTextColor(255, 255, 255);
    }
    doc.roundedRect(15, finalY, 40, 10, 2, 2, 'F');
    doc.text(tx.status.toUpperCase(), 35, finalY + 7, { align: "center" });

    // Footer Section
    const footerY = pageHeight - 40;
    doc.setDrawColor(226, 232, 240);
    doc.line(15, footerY, pageWidth - 15, footerY);
    
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.setFont(undefined, 'italic');
    doc.text("Thank you for choosing Success Point Digital Library!", pageWidth / 2, footerY + 8, { align: "center" });
    doc.text("This is a computer-generated receipt and does not require a signature.", pageWidth / 2, footerY + 14, { align: "center" });
    
    doc.setFontSize(8);
    doc.text("For any queries, please contact us at info@successpoint.com or call +91 9876543210", pageWidth / 2, footerY + 22, { align: "center" });

    doc.save(`Receipt_${tx.transactionId || tx.id}.pdf`);
  };

  if (loading) return <Loader message="Loading Payments..." />;

  return (
    <div className="p-4 md:p-6 mx-auto space-y-4 md:space-y-6 max-w-7xl">
      
      {/* --- Top Cards --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-slate-900 rounded-2xl md:rounded-[2.5rem] p-6 md:p-8 text-white relative overflow-hidden shadow-xl">
          <div className="relative z-10">
            <p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-widest">Current Plan</p>
            <h3 className="text-xl md:text-2xl font-black mt-1">{getCurrentPlan()}</h3>
            <div className="mt-6 md:mt-8">
              <p className="text-2xl md:text-3xl font-black">₹{getCurrentPlanPrice()} <span className="text-xs md:text-sm font-normal text-slate-400">/ month</span></p>
              <p className="text-emerald-400 text-[10px] md:text-xs font-bold mt-2 flex items-center gap-1">
                <CheckCircle2 size={14} /> Next billing on {getNextBillingDate()}
              </p>
            </div>
          </div>
          <div className="absolute -bottom-10 -right-10 w-32 h-32 md:w-40 md:h-40 bg-indigo-500/20 rounded-full blur-3xl"></div>
        </div>

        <div className="bg-white rounded-2xl md:rounded-[2.5rem] p-6 md:p-8 border border-slate-100 shadow-sm flex flex-col justify-center">
            <h4 className="font-bold text-slate-800 text-base md:text-lg">Account Status</h4>
            <p className="text-xs text-slate-500 mb-4">No pending dues found</p>
            <button 
              onClick={() => setShowPricing(true)}
              className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl md:rounded-2xl hover:bg-indigo-700 transition-all text-sm shadow-lg shadow-indigo-100"
            >
                View Pricing Plans
            </button>
        </div>
      </div>

      {/* --- Transaction History Table --- */}
      <div className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 md:p-8 flex items-center gap-3 border-b border-slate-50">
            <History className="text-indigo-600" size={20} />
            <h3 className="text-lg md:text-xl font-black text-slate-800">Payment History</h3>
        </div>
        
        {/* Mobile View - Cards */}
        <div className="md:hidden divide-y divide-slate-100">
          {transactions.length > 0 ? transactions.map((tx, idx) => (
            <div key={idx} className="p-4 hover:bg-slate-50 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm font-bold text-slate-700">{tx.month}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{new Date(tx.date).toLocaleDateString()}</p>
                </div>
                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                  tx.status === "Paid" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                }`}>
                  {tx.status}
                </span>
              </div>
              <div className="flex justify-between items-center mt-3">
                <p className="text-lg font-black text-slate-800">₹{tx.amount}</p>
                <button 
                  onClick={() => downloadReceipt(tx)}
                  className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                >
                  <Download size={18} />
                </button>
              </div>
              <p className="text-[9px] text-slate-400 mt-2">{tx.transactionId || tx.id}</p>
            </div>
          )) : (
            <div className="p-8 text-center text-slate-400">
              <AlertCircle size={40} className="mx-auto mb-3 opacity-50" />
              <p className="font-bold">No payment history found</p>
            </div>
          )}
        </div>

        {/* Desktop View - Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                <th className="px-8 py-4">Transaction</th>
                <th className="px-8 py-4">Amount</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {transactions.length > 0 ? transactions.map((tx, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-5">
                    <p className="text-sm font-bold text-slate-700">{tx.month}</p>
                    <p className="text-[10px] text-slate-400">{tx.transactionId || tx.id} • {new Date(tx.date).toLocaleDateString()}</p>
                  </td>
                  <td className="px-8 py-5 font-black text-slate-800">₹{tx.amount}</td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                      tx.status === "Paid" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button 
                      onClick={() => downloadReceipt(tx)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                    >
                      <Download size={20} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" className="px-8 py-12 text-center text-slate-400">
                    <AlertCircle size={40} className="mx-auto mb-3 opacity-50" />
                    <p className="font-bold">No payment history found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- PRICING MODAL --- */}
      <AnimatePresence>
        {showPricing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowPricing(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-slate-50 w-full max-w-5xl rounded-2xl md:rounded-[3rem] p-6 md:p-12 overflow-y-auto max-h-[90vh] shadow-2xl"
            >
              <button onClick={() => setShowPricing(false)} className="absolute top-6 right-6 p-2 hover:bg-slate-200 rounded-full transition-all">
                <X size={24} />
              </button>
              
              <div className="text-center mb-8 md:mb-10">
                <h2 className="text-2xl md:text-3xl font-black text-slate-800">Select Your Plan</h2>
                <p className="text-sm md:text-base text-slate-500 mt-2 font-medium">Choose the space that fits your study routine.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 max-w-4xl mx-auto">
                {pricingPlans.map((plan, i) => (
                  <div key={i} className={`p-6 md:p-8 rounded-2xl border-2 transition-all relative ${
                    plan.popular ? 'bg-white border-indigo-600 shadow-xl scale-105' : 'bg-slate-100 border-slate-200'
                  }`}>
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase">
                        Popular
                      </div>
                    )}
                    <h4 className="text-base md:text-lg font-bold text-slate-800">{plan.name}</h4>
                    <p className="text-2xl md:text-3xl font-black mt-3 md:mt-4 mb-4 md:mb-6">₹{plan.price} <span className="text-xs font-normal text-slate-500">/mo</span></p>
                    <ul className="space-y-2 md:space-y-3 mb-6 md:mb-8">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="text-[11px] md:text-xs font-medium text-slate-600 flex items-start gap-2">
                          <CheckCircle2 size={14} className="text-indigo-500 flex-shrink-0 mt-0.5" /> 
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                    <button 
                      onClick={() => handlePlanSelect(plan)}
                      className={`w-full py-2.5 md:py-3 rounded-xl font-bold text-sm transition-all ${
                      plan.popular ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-700 text-white hover:bg-slate-800'
                    }`}>
                      Select {plan.name} Plan
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QR Payment Modal */}
      <AnimatePresence>
        {showQRPayment && selectedPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowQRPayment(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-2xl md:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white z-10 p-4 md:p-6 border-b border-slate-100">
                <button onClick={() => setShowQRPayment(false)} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full transition-all">
                  <X size={20} />
                </button>
                <h2 className="text-2xl md:text-3xl font-black text-slate-800">Complete Payment</h2>
                <p className="text-sm text-slate-500 mt-1">Pay via UPI and submit transaction details</p>
              </div>
              
              <div className="p-4 md:p-6">
                {/* Plan Details */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-4 md:p-6 mb-4">
                  <p className="text-xs md:text-sm font-bold text-slate-600 mb-2">Selected Plan</p>
                  <h3 className="text-2xl md:text-3xl font-black text-indigo-600 mb-1">{selectedPlan.name}</h3>
                  <p className="text-3xl md:text-4xl font-black text-slate-800">₹{selectedPlan.price}</p>
                  <p className="text-xs text-slate-500 mt-1">per month</p>
                </div>

                {/* UPI QR Code */}
                <div className="bg-white p-4 md:p-6 rounded-2xl border-2 border-indigo-200 mb-4">
                  <p className="text-xs font-bold text-slate-600 mb-3">Scan QR with any UPI App</p>
                  <QRCodeSVG 
                    value={`${upiDetails.qrData}&am=${selectedPlan.price}`}
                    size={180}
                    level="H"
                    className="mx-auto"
                  />
                  <p className="text-[10px] text-slate-400 mt-3">PhonePe • GPay • Paytm • Any UPI App</p>
                </div>

                {/* UPI ID */}
                <div className="bg-slate-50 rounded-xl p-4 mb-4">
                  <p className="text-xs font-bold text-slate-600 mb-2">Or Pay using UPI ID</p>
                  <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-3">
                    <span className="text-sm font-bold text-slate-800">{upiDetails.upiId}</span>
                    <button 
                      onClick={copyUpiId}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} className="text-slate-600" />}
                    </button>
                  </div>
                </div>

                {/* Transaction Details Form */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                  <p className="text-xs font-bold text-amber-800 mb-3">📝 After Payment:</p>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Transaction ID *</label>
                      <input
                        type="text"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="Enter UPI transaction ID"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Payment Screenshot (Optional)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePaymentProofUpload}
                        className="w-full text-xs file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handlePaymentSubmit}
                  disabled={submitting}
                  className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-3"
                >
                  {submitting ? "Submitting..." : "I Have Paid - Submit"}
                </button>

                <button
                  onClick={() => setShowQRPayment(false)}
                  className="w-full bg-slate-100 text-slate-600 py-2 rounded-xl font-bold hover:bg-slate-200 transition-all text-sm"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Payments;
