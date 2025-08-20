import React, { useState, useEffect, useRef } from "react";
// import Card from "../components/card/Card";
import GirlImg from "./assets/welcomegirl.svg";
import SilkDesign from "./assets/silkdesign.svg";
import SilkDesign2 from "./assets/silkdesign2.svg";

import { createRoot } from "react-dom/client";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithCustomToken,
  onAuthStateChanged,
  signInAnonymously,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  query,
  where,
  updateDoc,
  getDocs,
} from "firebase/firestore";
import {
  Briefcase,
  LayoutGrid,
  Package, // Used for Inventory icon
  Truck,
  DollarSign,
  UserPlus,
  Pencil,
  Trash2,
  X,
  BellRing,
  PlusCircle,
  MinusCircle,
  AlertTriangle,
  IndianRupee,
  Filter, // Added for filter icon
  Receipt,
  Search,
  Download,
  FileText,
  Users,
  Star,
  Plus,
  Minus,
  AlertCircle,
  RefreshCcw,
  ChartNoAxesCombined,
  Upload, // Added for Import Invoices
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart as RechartsBarChart,
  Bar,
} from "recharts";

// Cloudinary configuration (Replace with your actual details)
const CLOUDINARY_CLOUD_NAME = "dp1kcggnm"; // <<< REPLACE WITH YOUR CLOUDINARY CLOUD NAME
const CLOUDINARY_UPLOAD_PRESET = "stock_Image"; // <<< REPLACE WITH YOUR CLOUDINARY UPLOAD PRESET
// --- Firebase Initialization and Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyAbW4zaVbOC1TsBiO5iiHZw45Zcz_UE-Rk",
  authDomain: "jeyvanth-silks-crm.firebaseapp.com",
  projectId: "jeyvanth-silks-crm",
  storageBucket: "jeyvanth-silks-crm.firebasestorage.app",
  messagingSenderId: "24481233222",
  appId: "1:24481233222:web:8333460114645e29ad4d47",
};

const appId = firebaseConfig.appId;
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// Function to upload image to Cloudinary
const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("Cloudinary upload failed");
  }

  const data = await response.json();
  return data.secure_url;
};
// Helper function to convert base64 to Blob, needed for uploading images
const base64ToBlob = (base64) => {
  const parts = base64.split(";base64,");
  const contentType = parts[0].split(":")[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);
  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }
  return new Blob([uInt8Array], { type: contentType });
};

// Helper function to generate a barcode
const generateBarcode = () => {
  return `BC-${Date.now()}-${Math.random()
    .toString(36)
    .substr(2, 5)
    .toUpperCase()}`;
};

// Sign in with custom token or anonymously
const initializeAuth = async () => {
  try {
    // Check if __initial_auth_token exists and is not undefined before using it
    if (
      typeof window !== "undefined" &&
      typeof window.__initial_auth_token !== "undefined"
    ) {
      await signInWithCustomToken(auth, window.__initial_auth_token);
    } else {
      await signInAnonymously(auth);
    }
  } catch (error) {
    console.error("Error signing in:", error);
  }
};

// --- Reusable Components (Modals and Forms) ---

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-[#b37a4e] rounded-3xl p-8 shadow-2xl w-lg  relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-[#f5d7a9] transition-colors"
        >
          <X size={24} />
        </button>
        <h3 className="text-2xl font-bold mb-4 text-[#f5d7a9]">{title}</h3>
        {children}
      </div>
    </div>
  );
};

const AddEmployeeTargetForm = ({ employees, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    employeeId: "",
    targetAmount: 0,
    dueDate: "",
  });
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "targetAmount" ? parseFloat(value) || 0 : value,
    }));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.employeeId || !formData.dueDate) {
      alert("Please select an employee and due date");
      return;
    }
    onSave(formData);
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-white/80 mb-1">
          Select Employee
        </label>
        <select
          name="employeeId"
          value={formData.employeeId}
          onChange={handleChange}
          required
          className="w-full p-3 rounded-lg bg-[#7b4c2b] text-white focus:outline-none focus:ring-2 focus:ring-[#f5d7a9]"
        >
          <option value="">Select an employee</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-white/80 mb-1">
          Target Amount (₹)
        </label>
        <input
          type="number"
          name="targetAmount"
          value={formData.targetAmount}
          onChange={handleChange}
          required
          min="0"
          step="0.01"
          className="w-full p-3 rounded-lg bg-[#7b4c2b] text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-[#f5d7a9]"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-white/80 mb-1">
          Due Date
        </label>
        <input
          type="date"
          name="dueDate"
          value={formData.dueDate}
          onChange={handleChange}
          required
          className="w-full p-3 rounded-lg bg-[#7b4c2b] text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-[#f5d7a9]"
        />
      </div>
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onClose}
          className="bg-gray-400 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-[#f5d7a9] text-[#7b4c2b] font-bold py-2 px-4 rounded-lg hover:bg-[#ffe39c] transition-colors"
        >
          Set Target
        </button>
      </div>
    </form>
  );
};

const ConfirmationModal = ({ isOpen, onClose, onConfirm, message }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Confirm Action">
    <p className="text-white mb-4">{message}</p>
    <div className="flex justify-end space-x-4">
      <button
        onClick={onClose}
        className="bg-gray-400 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors"
      >
        Cancel
      </button>
      <button
        onClick={onConfirm}
        className="bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
      >
        Confirm
      </button>
    </div>
  </Modal>
);

const InvoiceModal = ({ isOpen, onClose, invoiceData }) => {
  const invoiceRef = useRef(null); // Moved useRef here

  if (!isOpen || !invoiceData) return null;

  const { customer, courier, items, totalAmount, date } = invoiceData;

  const handleDownload = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write("<html><head><title>Invoice</title>");
    printWindow.document.write("<style>");
    printWindow.document.write(`
      @media print {
        body { font-family: 'Inter', sans-serif; margin: 0; padding: 2rem; color: #000; }
        .invoice-container { max-width: 800px; margin: auto; padding: 2rem; border: 1px solid #ddd; border-radius: 12px; }
        h1, h2, h3 { color: #333; }
        table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
        th, td { border: 1px solid #ddd; padding: 0.5rem; text-align: left; }
        .total-amount { text-align: right; font-weight: bold; font-size: 1.25rem; margin-top: 1rem; }
      }
    `);
    printWindow.document.write("</style></head><body>");
    printWindow.document.write('<div class="invoice-container">');
    printWindow.document.write('<h1 style="text-align: center;">Invoice</h1>');
    printWindow.document.write(`<h3>Customer: ${customer?.name || "N/A"}</h3>`);
    printWindow.document.write(`<h3>Courier: ${courier?.name || "N/A"}</h3>`);
    printWindow.document.write(`<p>Date: ${date}</p>`);
    printWindow.document.write("<table>");
    printWindow.document.write(
      "<thead><tr><th>Product</th><th>Price</th><th>Quantity</th><th>Total</th></tr></thead>"
    );
    printWindow.document.write("<tbody>");
    items.forEach((item) => {
      printWindow.document.write(
        `<tr><td>${item.brand} (${item.barcode})</td><td>₹${(
          item.price || 0
        ).toFixed(2)}</td><td>${item.quantity}</td><td>₹${(
          item.total || 0
        ).toFixed(2)}</td></tr>`
      );
    });
    printWindow.document.write("</tbody>");
    printWindow.document.write(
      `<div class="total-amount">Grand Total: ₹${totalAmount.toFixed(2)}</div>`
    );
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Generated Invoice">
      <div className="bg-white text-gray-800 p-6 rounded-lg shadow-inner w-fit max-h-[50vh] ">
        <div ref={invoiceRef}>
          <h1 className="text-3xl font-bold mb-4 text-center text-[#7b4c2b]">
            INVOICE
          </h1>
          <div className="mb-4">
            <h3 className="text-xl font-semibold">
              Customer: {customer?.name || "N/A"}
            </h3>
            <p>Mobile: {customer?.mobile || "N/A"}</p>
            <h3 className="text-xl font-semibold mt-2">
              Courier Partner: {courier?.name || "N/A"}
            </h3>
            <p>Date: {date}</p>
          </div>
          <table className="w-100% divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {item.brand} ({item.barcode})
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    ₹{item.price?.toFixed(2) || "0.00"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    ₹{item.total?.toFixed(2) || "0.00"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-6 text-right text-2xl font-bold text-[#7b4c2b]">
            Grand Total: ₹{totalAmount?.toFixed(2) || "0.00"}
          </div>
        </div>
      </div>
      <div className="flex justify-end mt-4">
        <button
          onClick={handleDownload}
          className="bg-[#f5d7a9] text-[#7b4c2b] font-bold py-2 px-4 rounded-lg flex items-center hover:bg-[#ffe39c] transition-colors"
        >
          <Download size={20} className="mr-2" /> Download Invoice
        </button>
      </div>
    </Modal>
  );
};

const CourierLogsModal = ({
  isOpen,
  onClose,
  courier,
  logs,
  products,
  customers,
}) => {
  if (!isOpen || !courier) return null;
  // const getProductDetails = (id) => products.find(p => p.id === id); // Unused
  const getCustomerDetails = (id) => customers.find((c) => c.id === id);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${courier.name}'s Billing Logs`}
    >
      <div className="bg-white text-gray-800 p-6 rounded-lg shadow-inner overflow-auto max-h-[70vh]">
        <h3 className="text-xl font-bold mb-4">Transaction History</h3>
        {logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sale ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer Mobile
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => {
                  const customer = getCustomerDetails(log.customerId);
                  return (
                    <tr key={log.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {log.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {log.saleId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {customer?.name || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {customer?.mobile || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        ${log.totalAmount.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">
            No billing logs found for this courier.
          </p>
        )}
      </div>
    </Modal>
  );
};

// Add/Edit Product Form Component
const AddProductForm = ({ onSave, onClose, initialData, isSaving }) => {
  const [formData, setFormData] = useState(
    initialData || {
      barcode: "",
      brand: "",
      price: 0,
      stock: 0,
      color: "",
      size: "",
      picture: null, // Keep this as null initially
      pictureUrl: "", // Add a state for the Cloudinary URL
    }
  );
  const [autoGenerateBarcode, setAutoGenerateBarcode] = useState(
    !initialData?.barcode
  );
  const fileInputRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(
    initialData?.pictureUrl || null
  ); // State for image preview

  useEffect(() => {
    // Reset form data if initialData changes (e.g., when editing a new product)
    setFormData(
      initialData || {
        barcode: "",
        brand: "",
        price: 0,
        stock: 0,
        color: "",
        size: "",
        picture: null,
        pictureUrl: "",
      }
    );
    setAutoGenerateBarcode(!initialData?.barcode);
    setImagePreview(initialData?.pictureUrl || null); // Set initial preview
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file") {
      const file = files[0];
      setFormData((prev) => ({
        ...prev,
        [name]: file, // Store the file object
      }));
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result); // Set image preview
        };
        reader.readAsDataURL(file);
      } else {
        setImagePreview(null);
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]:
          name === "price" || name === "stock" ? parseFloat(value) || 0 : value,
      }));
    }
  };

  const handleBarcodeToggle = () => {
    setAutoGenerateBarcode(!autoGenerateBarcode);
    setFormData((prev) => ({ ...prev, barcode: "" }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let finalFormData = { ...formData };
    if (autoGenerateBarcode && !finalFormData.barcode) {
      finalFormData.barcode = generateBarcode();
    }
    onSave(finalFormData); // Pass the formData including the file
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-lg"
    >
      {/* First column with input fields */}
      <div className="space-y-4 ">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="autoGenerateBarcode"
            checked={autoGenerateBarcode}
            onChange={handleBarcodeToggle}
            className="h-4 w-4 text-[#f5d7a9] bg-gray-600 border-gray-500 rounded focus:ring-[#f5d7a9]"
          />
          <label
            htmlFor="autoGenerateBarcode"
            className="text-white text-sm cursor-pointer"
          >
            Generate Barcode Automatically
          </label>
        </div>

        {!autoGenerateBarcode && (
          <input
            type="text"
            name="barcode"
            placeholder="Barcode"
            value={formData.barcode}
            onChange={handleChange}
            required
            className="w-full p-3 rounded-lg bg-[#7b4c2b] text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-[#f5d7a9]"
          />
        )}

        <input
          type="text"
          name="brand"
          placeholder="Saree Brand"
          value={formData.brand}
          onChange={handleChange}
          required
          className="w-full p-3 rounded-lg bg-[#7b4c2b] text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-[#f5d7a9]"
        />
        <label>
          Price
          <input
            type="number"
            name="price"
            placeholder="Price"
            value={formData.price}
            onChange={handleChange}
            required
            className="w-full p-3 rounded-lg bg-[#7b4c2b] text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-[#f5d7a9]"
            min="0"
            step="0.01"
          />
        </label>

        <label>
          Quantity
          <input
            type="number"
            name="stock"
            placeholder="Initial Stock"
            value={formData.stock}
            onChange={handleChange}
            required
            className="w-full p-3 rounded-lg bg-[#7b4c2b] text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-[#f5d7a9]"
            min="0"
          />
        </label>

        <input
          type="text"
          name="color"
          placeholder="Color"
          value={formData.color}
          onChange={handleChange}
          className="w-full p-3 rounded-lg bg-[#7b4c2b] text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-[#f5d7a9]"
        />

        <input
          type="text"
          name="size"
          placeholder="Size (e.g., M, L, XL)"
          value={formData.size}
          onChange={handleChange}
          className="w-full p-3 rounded-lg bg-[#7b4c2b] text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-[#f5d7a9]"
        />
      </div>

      {/* Second column with image upload */}
      <div className="flex flex-col items-center justify-center">
        <label className="block text-white mb-2">Product Picture</label>
        <input
          type="file"
          name="picture"
          onChange={handleChange}
          ref={fileInputRef}
          className="w-full text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#f5d7a9] file:text-[#7b4c2b] hover:file:bg-[#ffe39c]"
        />
        {imagePreview && (
          <div className="mt-4">
            <img
              src={imagePreview}
              alt="Product Preview"
              className="w-70 h-70z object-cover rounded-md"
            />
          </div>
        )}
        {initialData?.pictureUrl &&
          !imagePreview && ( // Show existing image if no new one is selected
            <div className="mt-4">
              <img
                src={initialData.pictureUrl}
                alt="Existing Product"
                className="max-w-full h-auto rounded-lg"
              />
            </div>
          )}
      </div>

      {/* Action buttons */}
      <div className="flex justify-end space-x-4 col-span-2">
        <button
          type="button"
          onClick={onClose}
          className="bg-gray-400 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-[#f5d7a9] text-[#7b4c2b] font-bold py-2 px-4 rounded-lg hover:bg-[#ffe39c] transition-colors flex items-center justify-center"
          disabled={isSaving}
        >
          {isSaving ? (
            <svg
              className="animate-spin h-5 w-5 text-[#7b4c2b]"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          ) : (
            <span>{initialData?.id ? "Update Product" : "Add Product"}</span>
          )}
        </button>
      </div>
    </form>
  );
};

const StockLogForm = ({ products, actionType, onSave, onClose }) => {
  const [selectedProductId, setSelectedProductId] = useState(
    products[0]?.id || ""
  );
  const [quantity, setQuantity] = useState(1);
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedProductId || quantity <= 0) return;
    onSave(selectedProductId, actionType, quantity);
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block text-white">Select Product</label>
      <select
        value={selectedProductId}
        onChange={(e) => setSelectedProductId(e.target.value)}
        required
        className="w-full p-3 rounded-lg bg-[#7b4c2b] text-white focus:outline-none focus:ring-2 focus:ring-[#f5d7a9]"
      >
        {products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.brand} - {p.barcode}
          </option>
        ))}
      </select>
      <label className="block text-white">Quantity</label>
      <input
        type="number"
        value={quantity}
        onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
        required
        min="1"
        className="w-full p-3 rounded-lg bg-[#7b4c2b] text-white focus:outline-none focus:ring-2 focus:ring-[#f5d7a9]"
      />
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onClose}
          className="bg-gray-400 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-[#f5d7a9] text-[#7b4c2b] font-bold py-2 px-4 rounded-lg hover:bg-[#ffe39c] transition-colors"
        >
          Log {actionType}
        </button>
      </div>
    </form>
  );
};

const AddCourierForm = ({ onSave, onClose }) => {
  const [formData, setFormData] = useState({ name: "", contact: "" });
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        name="name"
        placeholder="Partner Name"
        value={formData.name}
        onChange={handleChange}
        required
        className="w-full p-3 rounded-lg bg-[#7b4c2b] text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-[#f5d7a9]"
      />
      <input
        type="text"
        name="contact"
        placeholder="Contact Information"
        value={formData.contact}
        onChange={handleChange}
        required
        className="w-full p-3 rounded-lg bg-[#7b4c2b] text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-[#f5d7a9]"
      />
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onClose}
          className="bg-gray-400 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-[#f5d7a9] text-[#7b4c2b] font-bold py-2 px-4 rounded-lg hover:bg-[#ffe39c] transition-colors"
        >
          Add Partner
        </button>
      </div>
    </form>
  );
};

const AddCustomerForm = ({ onSave, onClose, initialData }) => {
  // Ensure formData is always an object, even if initialData is null/undefined
  const [formData, setFormData] = useState(
    initialData || { name: "", mobile: "", type: "permanent", loyaltyPoints: 0 }
  );
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        name="name"
        placeholder="Customer Name"
        value={formData.name}
        onChange={handleChange}
        required
        className="w-full p-3 rounded-lg bg-[#7b4c2b] text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-[#f5d7a9]"
      />
      <input
        type="tel"
        name="mobile"
        placeholder="Mobile Number"
        value={formData.mobile}
        onChange={handleChange}
        required
        className="w-full p-3 rounded-lg bg-[#7b4c2b] text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-[#f5d7a9]"
      />
      <select
        name="type"
        value={formData.type}
        onChange={handleChange}
        className="w-full p-3 rounded-lg bg-[#7b4c2b] text-white focus:outline-none focus:ring-2 focus:ring-[#f5d7a9]"
      >
        <option value="permanent">Permanent</option>
        <option value="temporary">Temporary</option>
      </select>
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onClose}
          className="bg-gray-400 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-[#f5d7a9] text-[#7b4c2b] font-bold py-2 px-4 rounded-lg hover:bg-[#ffe39c] transition-colors"
        >
          {initialData?.id ? "Update Customer" : "Add Customer"}
        </button>
      </div>
    </form>
  );
};

const AddEmployeeForm = ({ onSave, onClose, initialData }) => {
  // Ensure formData is always an object, even if initialData is null/undefined
  const [formData, setFormData] = useState(
    initialData || { name: "", dob: "", target: 0 }
  );
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "target" ? parseFloat(value) || 0 : value,
    }));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        name="name"
        placeholder="Employee Name"
        value={formData.name}
        onChange={handleChange}
        required
        className="w-full p-3 rounded-lg bg-[#7b4c2b] text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-[#f5d7a9]"
      />
      <div>
        <label className="block text-sm font-medium text-white/80 mb-1">
          Date of Birth
        </label>
        <input
          type="date"
          name="dob"
          value={formData.dob}
          onChange={handleChange}
          required
          className="w-full p-3 rounded-lg bg-[#7b4c2b] text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-[#f5d7a9]"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-white/80 mb-1">
          Sales Target (₹)
        </label>
        <input
          type="number"
          name="target"
          placeholder="Sales Target"
          value={formData.target}
          onChange={handleChange}
          required
          min="0"
          step="0.01"
          className="w-full p-3 rounded-lg bg-[#7b4c2b] text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-[#f5d7a9]"
        />
      </div>
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onClose}
          className="bg-gray-400 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-[#f5d7a9] text-[#7b4c2b] font-bold py-2 px-4 rounded-lg hover:bg-[#ffe39c] transition-colors"
        >
          {initialData?.id ? "Update Employee" : "Add Employee"}
        </button>
      </div>
    </form>
  );
};

const BirthdayBalloons = () => (
  <>
    {/* Balloon 1 */}
    <div
      className="absolute -top-12 -right-5 animate-float"
      style={{ animationDuration: "3s" }}
    >
      <svg
        width="45"
        height="60"
        viewBox="0 0 100 125"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M50 5C25.14 5 5 25.14 5 50C5 74.86 25.14 95 50 95C74.86 95 95 74.86 95 50C95 25.14 74.86 5 50 5Z"
          fill="#3B82F6"
        />
        <path d="M50 95L45 120L55 120L50 95Z" fill="#3B82F6" />
        <path
          d="M84.92 22.5C82.41 20.21 79.43 18.36 76.17 17.09C79.52 20.71 81.74 25.23 82.42 30.12C84.47 27.74 85.56 25.01 84.92 22.5Z"
          fill="white"
          fillOpacity="0.5"
        />
      </svg>
    </div>
    {/* Balloon 2 */}
    <div
      className="absolute -top-16 -left-2 animate-float"
      style={{ animationDuration: "4s", animationDelay: "0.5s" }}
    >
      <svg
        width="50"
        height="65"
        viewBox="0 0 100 125"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M50 7.5C26.52 7.5 7.5 26.52 7.5 50C7.5 73.48 26.52 92.5 50 92.5C73.48 92.5 92.5 73.48 92.5 50C92.5 26.52 73.48 7.5 50 7.5Z"
          fill="#EF4444"
        />
        <path d="M50 92.5L45 117.5L55 117.5L50 92.5Z" fill="#EF4444" />
        <path
          d="M82.92 24.5C80.41 22.21 77.43 20.36 74.17 19.09C77.52 22.71 79.74 27.23 80.42 32.12C82.47 29.74 83.56 27.01 82.92 24.5Z"
          fill="white"
          fillOpacity="0.5"
        />
      </svg>
    </div>
    {/* Balloon 3 */}
    <div
      className="absolute -top-10 left-0 animate-float"
      style={{ animationDuration: "3.5s", animationDelay: "1s" }}
    >
      <svg
        width="40"
        height="55"
        viewBox="0 0 100 125"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M50 5C25.14 5 5 25.14 5 50C5 74.86 25.14 95 50 95C74.86 95 95 74.86 95 50C95 25.14 74.86 5 50 5Z"
          fill="#FBBF24"
        />
        <path d="M50 95L45 120L55 120L50 95Z" fill="#FBBF24" />
        <path
          d="M84.92 22.5C82.41 20.21 79.43 18.36 76.17 17.09C79.52 20.71 79.74 27.23 80.42 32.12C82.47 29.74 83.56 27.01 82.92 24.5Z"
          fill="white"
          fillOpacity="0.5"
        />
      </svg>
    </div>
  </>
);

const NotificationPanel = ({
  isOpen,
  onClose,
  birthdayEmployees,
  damageLogs,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute bottom-24 right-0 w-80 bg-[#5b361a] rounded-2xl shadow-2xl p-4 border border-[#b37a4e] transition-all duration-300 ease-in-out transform-gpu animate-fade-in-up">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-bold text-[#f5d7a9]">Notifications</h4>
        <button onClick={onClose} className="text-white/70 hover:text-white">
          <X size={20} />
        </button>
      </div>
      <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
        {birthdayEmployees.length === 0 && damageLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-8 text-center text-white/60">
            <BellRing size={32} className="mb-2" />
            <p>No new notifications.</p>
          </div>
        ) : (
          <>
            {birthdayEmployees.map((emp) => (
              <div
                key={emp.id}
                className="bg-[#7b4c2b] p-3 rounded-lg flex items-center space-x-3"
              >
                <span className="text-yellow-400 text-xl">🎉</span>
                <p className="text-sm">
                  Happy Birthday to <strong>{emp.name}</strong>!
                </p>
              </div>
            ))}
            {damageLogs.map((log) => (
              <div
                key={log.id}
                className="bg-[#7b4c2b] p-3 rounded-lg flex items-center space-x-3"
              >
                <AlertTriangle
                  size={18}
                  className="text-yellow-500 flex-shrink-0"
                />
                <p className="text-sm">Damage reported. Qty: {log.quantity}.</p>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

const NotificationBell = ({ notifications, onClick }) => {
  const { hasBirthday, damageCount } = notifications;

  return (
    <button
      onClick={onClick}
      className="relative mt-4 w-16 h-16 bg-[#5b361a] rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-110"
    >
      {hasBirthday && <BirthdayBalloons />}
      {damageCount > 0 && (
        <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 border-2 border-white rounded-full flex items-center justify-center text-xs font-bold animate-pulse">
          {damageCount}
        </span>
      )}
      <BellRing size={32} />
    </button>
  );
};

// --- Dashboard Helper Components ---
// DoughnutChart is currently unused, but kept for potential future use or if user requests it.
/*
const DoughnutChart = ({ title, data }) => (
  <div className="flex flex-col items-center justify-center">
    <h4 className="text-md font-semibold mb-2 text-white/80">{title}</h4>
    <ResponsiveContainer width="100%" height={150}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={40}
          outerRadius={60}
          fill="#8884d8"
          paddingAngle={3}
          dataKey="value"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ backgroundColor: '#5b361a', border: 'none', borderRadius: '8px' }}
          labelStyle={{ color: '#f5d7a9' }}
          itemStyle={{ color: '#f5d7a9' }}
          formatter={(value) => `${value} units`}
        />
        <Legend wrapperStyle={{ color: '#f5d7a9', fontSize: '12px' }} />
      </PieChart>
    </ResponsiveContainer>
  </div>
);
*/

const ProductListItem = ({ product, type }) => (
  <div className="bg-[#5b361a] p-3 rounded-xl flex items-center justify-between shadow-md">
    <div className="flex items-center">
      {product.pictureUrl && ( // Conditionally render image if pictureUrl exists
        <img
          src={product.pictureUrl}
          alt={product.brand}
          className="w-12 h-12 object-cover rounded-md mr-3" // Added styling for the image
        />
      )}
      <p className="font-semibold text-lg">{product.brand}</p>
    </div>
    <span
      className={`font-bold text-xl ${
        type === "fast" ? "text-yellow-300" : "text-red-300"
      }`}
    >
      {product.salesCount} units sold
    </span>
  </div>
);

// --- Section Components ---

const CourierSection = ({ userId }) => {
  const [courierPartners, setCourierPartners] = useState([]);
  const [isAddCourierModalOpen, setIsAddCourierModal] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [courierToDelete, setCourierToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCourierLogsModalOpen, setIsCourierLogsModalOpen] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState(null);
  const [courierBillLogs, setCourierBillLogs] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]); // Added customers state

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const courierCollectionPath = `/artifacts/${appId}/users/${userId}/courier_partners`;
    const productsCollectionPath = `/artifacts/${appId}/users/${userId}/products`;
    const customersCollectionPath = `/artifacts/${appId}/users/${userId}/customers`; // Path for customers

    const unsubscribeCouriers = onSnapshot(
      collection(db, courierCollectionPath),
      (querySnapshot) => {
        const couriersData = [];
        querySnapshot.forEach((doc) =>
          couriersData.push({ id: doc.id, ...doc.data() })
        );
        setCourierPartners(couriersData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching courier partners:", error);
        setLoading(false);
      }
    );

    const unsubscribeProducts = onSnapshot(
      collection(db, productsCollectionPath),
      (querySnapshot) => {
        const productsData = [];
        querySnapshot.forEach((doc) =>
          productsData.push({ id: doc.id, ...doc.data() })
        );
        setProducts(productsData);
      }
    );

    const unsubscribeCustomers = onSnapshot(
      collection(db, customersCollectionPath),
      (querySnapshot) => {
        const customersData = [];
        querySnapshot.forEach((doc) =>
          customersData.push({ id: doc.id, ...doc.data() })
        );
        setCustomers(customersData);
      }
    );

    return () => {
      unsubscribeCouriers();
      unsubscribeProducts();
      unsubscribeCustomers(); // Cleanup customer listener
    };
  }, [userId]);

  const handleAddCourier = async (newCourier) => {
    if (!userId) return;
    try {
      const courierCollectionPath = `/artifacts/${appId}/users/${userId}/courier_partners`;
      await addDoc(collection(db, courierCollectionPath), newCourier);
      setIsAddCourierModal(false);
    } catch (e) {
      console.error("Error adding courier partner:", e);
    }
  };

  const handleDeleteCourier = async (courierId) => {
    if (!userId) return;
    try {
      const courierCollectionPath = `/artifacts/${appId}/users/${userId}/courier_partners`;
      await deleteDoc(doc(db, courierCollectionPath, courierId));
      setIsConfirmationModalOpen(false);
      setCourierToDelete(null);
    } catch (e) {
      console.error("Error deleting courier partner:", e);
    }
  };

  const handleViewLogs = async (courier) => {
    if (!userId) return;
    setSelectedCourier(courier);
    const logsCollectionPath = `/artifacts/${appId}/users/${userId}/courier_logs`;

    // Fetch and listen for logs in real-time
    const unsubscribe = onSnapshot(
      query(
        collection(db, logsCollectionPath),
        where("courierId", "==", courier.id)
      ),
      (querySnapshot) => {
        const logsData = [];
        querySnapshot.forEach((doc) => {
          logsData.push({ id: doc.id, ...doc.data() });
        });
        setCourierBillLogs(logsData);
      },
      (error) => {
        console.error("Error fetching courier logs:", error);
      }
    );

    setIsCourierLogsModalOpen(true);
    // Return unsubscribe function for cleanup
    return unsubscribe;
  };

  const closeCourierLogsModal = () => {
    setIsCourierLogsModalOpen(false);
    setSelectedCourier(null);
    setCourierBillLogs([]);
  };

  if (loading) {
    return (
      <p className="text-white/70 text-center py-8">Loading courier data...</p>
    );
  }

  return (
    <>
      <h2 className="text-3xl font-bold mb-6 text-[#f5d7a9]">
        Courier & Logistics
      </h2>
      <div className="bg-[#7b4c2b] p-6 rounded-3xl shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Manage Courier Partners</h3>
          <button
            onClick={() => setIsAddCourierModal(true)}
            className="bg-[#f5d7a9] text-[#7b4c2b] font-bold py-2 px-4 rounded-lg flex items-center hover:bg-[#ffe39c] transition-colors"
          >
            <PlusCircle size={20} className="mr-2" /> Add Partner
          </button>
        </div>
        <div className="overflow-x-auto rounded-xl">
          <table className="min-w-full divide-y divide-[#b37a4e]">
            <thead className="bg-[#5b361a]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#f5d7a9] uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#f5d7a9] uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-[#f5d7a9] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-[#7b4c2b] divide-y divide-[#b37a4e]">
              {courierPartners.length > 0 ? (
                courierPartners.map((courier) => (
                  <tr key={courier.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {courier.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {courier.contact}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewLogs(courier)}
                        className="text-blue-400 hover:text-blue-300"
                        title="View Logs"
                      >
                        <FileText size={18} />
                      </button>
                      <button
                        onClick={() => {
                          setCourierToDelete(courier.id);
                          setIsConfirmationModalOpen(true);
                        }}
                        className="text-red-400 hover:text-red-300 ml-4"
                        title="Delete Partner"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="3"
                    className="px-6 py-4 whitespace-nowrap text-center text-sm text-white/70"
                  >
                    No courier partners found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="bg-[#7b4c2b] p-6 rounded-3xl shadow-lg mt-8">
        <h3 className="text-xl font-bold mb-4">Invoice Management</h3>
        <p className="text-white/70 mb-4">
          You can import and export invoice copies here. This feature would
          require a system to parse and generate documents.
        </p>
        <div className="flex space-x-4">
          <button className="flex-1 bg-[#f5d7a9] text-[#7b4c2b] font-bold py-2 px-4 rounded-lg flex items-center justify-center hover:bg-[#ffe39c] transition-colors">
            <Upload size={20} className="mr-2" /> Import Invoices
          </button>
          <button className="flex-1 bg-[#f5d7a9] text-[#7b4c2b] font-bold py-2 px-4 rounded-lg flex items-center justify-center hover:bg-[#ffe39c] transition-colors">
            <Download size={20} className="mr-2" /> Export Invoices
          </button>
        </div>
      </div>

      <Modal
        isOpen={isAddCourierModalOpen}
        onClose={() => setIsAddCourierModal(false)}
        title="Add New Courier Partner"
      >
        <AddCourierForm
          onSave={handleAddCourier}
          onClose={() => setIsAddCourierModal(false)}
        />
      </Modal>

      <ConfirmationModal
        isOpen={isConfirmationModalOpen}
        onClose={() => setIsConfirmationModalOpen(false)}
        onConfirm={() => handleDeleteCourier(courierToDelete)}
        message="Are you sure you want to delete this courier partner? This will remove them from all future billing options."
      />

      <CourierLogsModal
        isOpen={isCourierLogsModalOpen}
        onClose={closeCourierLogsModal}
        courier={selectedCourier}
        logs={courierBillLogs}
        products={products}
        customers={customers} // Pass customers to CourierLogsModal
      />
    </>
  );
};

// --- CRM Section (Updated with Employee Management and Loyalty Points) ---
const CrmSection = ({ userId }) => {
  // Customer States
  const [customers, setCustomers] = useState([]);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [editingCustomer, setEditingCustomer] = useState(null);

  // Employee States
  const [employees, setEmployees] = useState([]);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null); // Can be customer or employee
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [targets, setTargets] = useState([]);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [loadingTargets, setLoadingTargets] = useState(true);

  // Fetch Customers
  useEffect(() => {
    if (!userId) {
      setLoadingCustomers(false);
      return;
    }
    const customersCollectionPath = `/artifacts/${appId}/users/${userId}/customers`;
    const q = query(collection(db, customersCollectionPath));
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const customersData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCustomers(customersData);
        setLoadingCustomers(false);
      },
      (error) => {
        console.error("Error fetching customers:", error);
        setLoadingCustomers(false);
      }
    );
    return () => unsubscribe();
  }, [userId]);

  const handleAddOrUpdateCustomer = async (formData) => {
    if (!userId) return;
    try {
      const customersCollectionPath = `/artifacts/${appId}/users/${userId}/customers`;
      const docRef = editingCustomer
        ? doc(db, customersCollectionPath, editingCustomer.id)
        : null;

      if (editingCustomer) {
        await updateDoc(docRef, formData);
      } else {
        await addDoc(collection(db, customersCollectionPath), {
          ...formData,
          loyaltyPoints: formData.loyaltyPoints || 0,
        });
      }
      setIsCustomerModalOpen(false);
      setEditingCustomer(null);
    } catch (e) {
      console.error("Error adding/updating customer:", e);
    }
  };

  // Fetch Employees
  useEffect(() => {
    if (!userId) {
      setLoadingEmployees(false);
      return;
    }
    const employeesCollectionPath = `/artifacts/${appId}/users/${userId}/employees`;
    const q = query(collection(db, employeesCollectionPath));
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const employeesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setEmployees(employeesData);
        setLoadingEmployees(false);
      },
      (error) => {
        console.error("Error fetching employees:", error);
        setLoadingEmployees(false);
      }
    );
    return () => unsubscribe();
  }, [userId]);

  // Fetch Targets
  useEffect(() => {
    if (!userId) {
      setLoadingTargets(false);
      return;
    }
    const targetsCollectionPath = `/artifacts/${appId}/users/${userId}/employee_targets`;
    const q = query(collection(db, targetsCollectionPath));
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const targetsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTargets(targetsData);
        setLoadingTargets(false);
      },
      (error) => {
        console.error("Error fetching targets:", error);
        setLoadingTargets(false);
      }
    );
    return () => unsubscribe();
  }, [userId]);

  const handleAddOrUpdateEmployee = async (formData) => {
    if (!userId) return;
    try {
      const employeesCollectionPath = `/artifacts/${appId}/users/${userId}/employees`;
      const docRef = editingEmployee
        ? doc(db, employeesCollectionPath, editingEmployee.id)
        : null;
      if (editingEmployee) {
        await updateDoc(docRef, formData);
      } else {
        await addDoc(collection(db, employeesCollectionPath), formData);
      }
      setIsEmployeeModalOpen(false);
      setEditingEmployee(null);
    } catch (e) {
      console.error("Error adding/updating employee:", e);
    }
  };

  const handleSetEmployeeTarget = async (formData) => {
    if (!userId) return;
    try {
      const targetsCollectionPath = `/artifacts/${appId}/users/${userId}/employee_targets`;
      // Check if a target already exists for this employee and due date
      const q = query(
        collection(db, targetsCollectionPath),
        where("employeeId", "==", formData.employeeId),
        where("dueDate", "==", formData.dueDate)
      );
      const querySnapshot = await getDocs(q); // Use getDocs for a one-time fetch

      if (!querySnapshot.empty) {
        // Update existing target
        const targetDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, targetsCollectionPath, targetDoc.id), {
          targetAmount: formData.targetAmount,
        });
      } else {
        // Add new target
        await addDoc(collection(db, targetsCollectionPath), formData);
      }
      setIsTargetModalOpen(false);
    } catch (e) {
      console.error("Error setting employee target:", e);
    }
  };

  const handleDelete = async () => {
    if (!userId || !itemToDelete) return;
    const { id, type } = itemToDelete;
    const collectionName = type === "employee" ? "employees" : "customers";
    try {
      const docPath = `/artifacts/${appId}/users/${userId}/${collectionName}/${id}`;
      await deleteDoc(doc(db, docPath));
      setIsConfirmationModalOpen(false);
      setItemToDelete(null);
    } catch (e) {
      console.error(`Error deleting ${type}:`, e);
    }
  };

  const calculateAge = (dob) => {
    if (!dob) return "N/A";
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setIsCustomerModalOpen(true);
  };

  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
    setIsEmployeeModalOpen(true);
  };

  return (
    <>
      <h2 className="text-3xl font-bold mb-6 text-[#f5d7a9]">CRM Dashboard</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Customer Management Card */}
        <div className="bg-[#7b4c2b] p-6 rounded-3xl shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Customer Management</h3>
            <button
              onClick={() => {
                setEditingCustomer(null);
                setIsCustomerModalOpen(true);
              }}
              className="bg-[#f5d7a9] text-[#7b4c2b] font-bold py-2 px-4 rounded-lg flex items-center hover:bg-[#ffe39c] transition-colors"
            >
              <UserPlus size={20} className="mr-2" /> Add New
            </button>
          </div>
          <div className="h-64 overflow-y-auto p-4 bg-[#5b361a] rounded-xl">
            {loadingCustomers ? (
              <p>Loading customers...</p>
            ) : customers.length > 0 ? (
              customers.map((customer) => (
                <div
                  key={customer.id}
                  className="p-2 border-b border-gray-600 last:border-b-0 flex justify-between items-center"
                >
                  <div>
                    <p>
                      {customer.name} - {customer.mobile}
                    </p>
                    <span className="text-sm text-gray-400 capitalize">
                      {customer.type}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center text-yellow-400 font-bold">
                      <Star size={16} />
                      <span>{customer.loyaltyPoints || 0}</span>
                    </div>
                    <button
                      onClick={() => handleEditCustomer(customer)}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => {
                        setItemToDelete({ id: customer.id, type: "customer" });
                        setIsConfirmationModalOpen(true);
                      }}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p>No customers found.</p>
            )}
          </div>
        </div>

        {/* Employee Management Card */}
        <div className="bg-[#7b4c2b] p-6 rounded-3xl shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Employee Management</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setIsTargetModalOpen(true)}
                className="bg-[#a86500] text-white font-bold py-2 px-4 rounded-lg flex items-center hover:bg-[#c67c00] transition-colors"
              >
                <DollarSign size={20} className="mr-2" /> Set Target
              </button>
              <button
                onClick={() => {
                  setEditingEmployee(null);
                  setIsEmployeeModalOpen(true);
                }}
                className="bg-[#f5d7a9] text-[#7b4c2b] font-bold py-2 px-4 rounded-lg flex items-center hover:bg-[#ffe39c] transition-colors"
              >
                <Users size={20} className="mr-2" /> Add Employee
              </button>
            </div>
          </div>
          <div className="h-64 overflow-y-auto p-4 bg-[#5b361a] rounded-xl">
            {loadingEmployees ? (
              <p>Loading employees...</p>
            ) : employees.length > 0 ? (
              <table className="min-w-full divide-y divide-[#b37a4e]">
                <thead className="bg-[#5b361a] sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-[#f5d7a9] uppercase">
                      Name
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-[#f5d7a9] uppercase">
                      Age
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-[#f5d7a9] uppercase">
                      DOB
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-[#f5d7a9] uppercase">
                      Target (₹)
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-[#f5d7a9] uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#b37a4e]">
                  {employees.map((emp) => {
                    const employeeTarget = targets.find(
                      (target) => target.employeeId === emp.id
                    );
                    return (
                      <tr key={emp.id}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                          {emp.name}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                          {calculateAge(emp.dob)}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                          {emp.dob}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                          ₹{employeeTarget?.targetAmount?.toFixed(2) || "0.00"}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-right space-x-2">
                          <button
                            onClick={() => handleEditEmployee(emp)}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            onClick={() => {
                              setItemToDelete({ id: emp.id, type: "employee" });
                              setIsConfirmationModalOpen(true);
                            }}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p>No employees found.</p>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={isCustomerModalOpen}
        onClose={() => {
          setIsCustomerModalOpen(false);
          setEditingCustomer(null);
        }}
        title={editingCustomer ? "Edit Customer" : "Add New Customer"}
      >
        {/* Pass a default empty object if editingCustomer is null */}
        <AddCustomerForm
          onSave={handleAddOrUpdateCustomer}
          onClose={() => {
            setIsCustomerModalOpen(false);
            setEditingCustomer(null);
          }}
          initialData={
            editingCustomer || {
              name: "",
              mobile: "",
              type: "permanent",
              loyaltyPoints: 0,
            }
          }
        />
      </Modal>
      <Modal
        isOpen={isEmployeeModalOpen}
        onClose={() => {
          setIsEmployeeModalOpen(false);
          setEditingEmployee(null);
        }}
        title={editingEmployee ? "Edit Employee" : "Add New Employee"}
      >
        {/* Pass a default empty object if editingEmployee is null */}
        <AddEmployeeForm
          onSave={handleAddOrUpdateEmployee}
          onClose={() => {
            setIsEmployeeModalOpen(false);
            setEditingEmployee(null);
          }}
          initialData={editingEmployee || { name: "", dob: "", target: 0 }}
        />
      </Modal>
      <Modal
        isOpen={isTargetModalOpen}
        onClose={() => setIsTargetModalOpen(false)}
        title="Set Employee Target"
      >
        <AddEmployeeTargetForm
          employees={employees}
          onSave={handleSetEmployeeTarget}
          onClose={() => setIsTargetModalOpen(false)}
        />
      </Modal>
      <ConfirmationModal
        isOpen={isConfirmationModalOpen}
        onClose={() => setIsConfirmationModalOpen(false)}
        onConfirm={handleDelete}
        message={`Are you sure you want to delete this ${itemToDelete?.type}?`}
      />
    </>
  );
};

// --- Billing Section (Completed) ---
const BillingSection = ({ setActiveView, userId }) => {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [courierPartners, setCourierPartners] = useState([]);
  const [employees, setEmployees] = useState([]); // New state for employees
  const [searchTerm, setSearchTerm] = useState("");
  const [billItems, setBillItems] = useState([]);
  const [customerType, setCustomerType] = useState("existing");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedCourierId, setSelectedCourierId] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(""); // New state for selected employee
  const [newCustomer, setNewCustomer] = useState({ name: "", mobile: "" });
  const [loading, setLoading] = useState(true);
  const [invoiceData, setInvoiceData] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const [pointsToRedeem, setPointsToRedeem] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [discountApplied, setDiscountApplied] = useState(0);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const productsCollectionPath = `/artifacts/${appId}/users/${userId}/products`;
    const customersCollectionPath = `/artifacts/${appId}/users/${userId}/customers`;
    const courierCollectionPath = `/artifacts/${appId}/users/${userId}/courier_partners`;
    const employeesCollectionPath = `/artifacts/${appId}/users/${userId}/employees`; // Path for employees

    const unsubscribeProducts = onSnapshot(
      collection(db, productsCollectionPath),
      (querySnapshot) => {
        setProducts(
          querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching products:", error);
        setLoading(false);
      }
    );

    const unsubscribeCustomers = onSnapshot(
      collection(db, customersCollectionPath),
      (querySnapshot) => {
        setCustomers(
          querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      },
      (error) => {
        console.error("Error fetching customers:", error);
      }
    );

    const unsubscribeCouriers = onSnapshot(
      collection(db, courierCollectionPath),
      (querySnapshot) => {
        setCourierPartners(
          querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      },
      (error) => {
        console.error("Error fetching courier partners:", error);
      }
    );

    const unsubscribeEmployees = onSnapshot(
      // New subscription for employees
      collection(db, employeesCollectionPath),
      (querySnapshot) => {
        setEmployees(
          querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      },
      (error) => {
        console.error("Error fetching employees:", error);
      }
    );

    return () => {
      unsubscribeProducts();
      unsubscribeCustomers();
      unsubscribeCouriers();
      unsubscribeEmployees(); // Cleanup employee listener
    };
  }, [userId]);

  // Hook to find the selected customer
  useEffect(() => {
    if (selectedCustomerId) {
      const customer = customers.find((c) => c.id === selectedCustomerId);
      setSelectedCustomer(customer || null);
    } else {
      setSelectedCustomer(null);
    }
    setPointsToRedeem("");
    setDiscountApplied(0);
  }, [selectedCustomerId, customers]);

  const filteredProducts = products.filter(
    (product) =>
      product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddItem = (product) => {
    setBillItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id);
      if (existingItem) {
        if (existingItem.quantity >= product.stock) {
          console.error("Not enough stock.");
          return prevItems;
        }
        return prevItems.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                total: (item.quantity + 1) * item.price,
              }
            : item
        );
      } else {
        if (product.stock <= 0) {
          console.error("Out of stock.");
          return prevItems;
        }
        return [
          ...prevItems,
          {
            ...product,
            quantity: 1,
            total: product.price,
          },
        ];
      }
    });
  };

  const handleUpdateItemQuantity = (item, newQuantity) => {
    setBillItems((prevItems) => {
      const productInStock = products.find((p) => p.id === item.id);
      if (newQuantity > productInStock.stock) {
        console.error("Cannot add more than available stock.");
        return prevItems;
      }
      return prevItems
        .map((billItem) =>
          billItem.id === item.id
            ? {
                ...billItem,
                quantity: newQuantity,
                total: newQuantity * billItem.price,
              }
            : billItem
        )
        .filter((billItem) => billItem.quantity > 0);
    });
  };

  // handleRemoveItem is currently unused, but kept for potential future use if user requests it.
  /*
  const handleRemoveItem = (itemId) => {
    setBillItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };
  */

  const subtotal = billItems.reduce((acc, item) => acc + (item.total || 0), 0);
  const totalAmount = subtotal - discountApplied;

  const handleRedeemPoints = () => {
    const points = parseFloat(pointsToRedeem);
    if (
      !selectedCustomer ||
      !points ||
      points <= 0 ||
      points > selectedCustomer.loyaltyPoints
    ) {
      console.error("Invalid points redemption.");
      return;
    }
    // Assume 1 point = $1 for this example
    const discount = points;
    if (discount > subtotal) {
      setDiscountApplied(subtotal);
    } else {
      setDiscountApplied(discount);
    }
    setPointsToRedeem("");
  };

  const handleGenerateInvoice = async () => {
    if (billItems.length === 0) {
      console.error("Bill is empty.");
      return;
    }

    if (customerType === "existing" && !selectedCustomerId) {
      console.error("Please select a customer.");
      return;
    }
    // Courier selection is now optional, so no check here
    if (!selectedEmployeeId) {
      console.error("Please select an employee."); // Ensure an employee is selected
      return;
    }

    try {
      const date = new Date().toISOString().split("T")[0];
      let finalCustomer = selectedCustomer;
      let newCustomerLoyaltyPoints = selectedCustomer
        ? selectedCustomer.loyaltyPoints
        : 0;

      // Handle new customer case
      if (customerType === "new") {
        if (!newCustomer.name || !newCustomer.mobile) {
          console.error("New customer details are required.");
          return;
        }
        const newCustomerDocRef = await addDoc(
          collection(db, `/artifacts/${appId}/users/${userId}/customers`),
          {
            ...newCustomer,
            type: "temporary",
            loyaltyPoints: 0,
          }
        );
        finalCustomer = {
          id: newCustomerDocRef.id,
          ...newCustomer,
          type: "temporary",
          loyaltyPoints: 0,
        };
      }

      // Calculate loyalty points earned (e.g., 1 point per $10 spent)
      const pointsEarned = Math.floor(totalAmount / 10);
      newCustomerLoyaltyPoints =
        (newCustomerLoyaltyPoints || 0) + pointsEarned - discountApplied;

      // Create a sales entry
      const saleDocRef = await addDoc(
        collection(db, `/artifacts/${appId}/users/${userId}/sales`),
        {
          customerId: finalCustomer?.id || "N/A",
          courierId: selectedCourierId || null, // Set to null if no courier is selected
          employeeId: selectedEmployeeId, // Save selected employee ID
          items: billItems,
          subtotal: subtotal,
          discount: discountApplied,
          totalAmount: totalAmount,
          date: date,
          loyaltyPointsEarned: pointsEarned,
          loyaltyPointsRedeemed: discountApplied,
        }
      );

      // Update stock for each product
      const productUpdates = billItems.map(async (item) => {
        const productRef = doc(
          db,
          `/artifacts/${appId}/users/${userId}/products`,
          item.id
        );
        const newStock =
          (products.find((p) => p.id === item.id)?.stock || 0) - item.quantity;
        await updateDoc(productRef, { stock: newStock });
      });
      await Promise.all(productUpdates);

      // Update customer's loyalty points if it's an existing customer
      if (selectedCustomer) {
        const customerRef = doc(
          db,
          `/artifacts/${appId}/users/${userId}/customers`,
          selectedCustomerId
        );
        await updateDoc(customerRef, {
          loyaltyPoints: newCustomerLoyaltyPoints,
        });
      }

      // Only log for courier billing if a courier is selected
      if (selectedCourierId) {
        await addDoc(
          collection(db, `/artifacts/${appId}/users/${userId}/courier_logs`),
          {
            courierId: selectedCourierId,
            saleId: saleDocRef.id,
            totalAmount: totalAmount,
            date: date,
            customerId: finalCustomer?.id || "N/A", // Add customerId to courier log
          }
        );
      }

      // Prepare and show invoice
      const courier = selectedCourierId
        ? courierPartners.find((c) => c.id === selectedCourierId)
        : null;
      setInvoiceData({
        customer: finalCustomer,
        courier: courier,
        items: billItems,
        totalAmount: totalAmount,
        date: date,
      });
      setIsInvoiceModalOpen(true);

      // Reset bill
      setBillItems([]);
      setSearchTerm("");
      setCustomerType("existing");
      setSelectedCustomerId("");
      setSelectedCourierId("");
      setSelectedEmployeeId(""); // Reset selected employee
      setNewCustomer({ name: "", mobile: "" });
      setPointsToRedeem("");
      setDiscountApplied(0);
    } catch (e) {
      console.error("Error generating invoice:", e);
    }
  };

  return (
    <>
      <h2 className="text-3xl font-bold mb-6 text-[#f5d7a9]">New Billing</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Product Search & List */}
          <div className="bg-[#7b4c2b] p-6 rounded-3xl shadow-lg mb-8">
            <div className="flex items-center mb-4">
              <Search className="mr-2" />
              <input
                type="text"
                placeholder="Search products by brand or barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 rounded-lg bg-[#5b361a] text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-[#f5d7a9]"
              />
            </div>
            <div className="h-64 overflow-y-auto pr-2">
              {loading ? (
                <p>Loading products...</p>
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="bg-[#5b361a] p-4 rounded-xl shadow-md flex justify-between items-center mb-2"
                  >
                    <div>
                      <p className="font-bold">{product.brand}</p>
                      <p className="text-sm text-gray-300">
                        Barcode: {product.barcode}
                      </p>
                      <p className="text-sm text-gray-300">
                        Stock: {product.stock}
                      </p>
                    </div>
                    <button
                      onClick={() => handleAddItem(product)}
                      className="bg-[#f5d7a9] text-[#7b4c2b] font-bold py-2 px-4 rounded-lg flex items-center hover:bg-[#ffe39c] transition-colors disabled:opacity-50"
                      disabled={product.stock <= 0}
                    >
                      <Plus size={20} className="mr-2" /> Add
                    </button>
                  </div>
                ))
              ) : (
                <p>No products found.</p>
              )}
            </div>
          </div>

          {/* Customer & Courier Selection */}
          <div className="bg-[#7b4c2b] p-6 rounded-3xl shadow-lg">
            <h3 className="text-xl font-bold mb-4">
              Customer & Courier Details
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium">
                  Customer Type
                </label>
                <select
                  value={customerType}
                  onChange={(e) => setCustomerType(e.target.value)}
                  className="w-full p-3 rounded-lg bg-[#5b361a] text-white focus:outline-none focus:ring-2 focus:ring-[#f5d7a9]"
                >
                  <option value="existing">Existing Customer</option>
                  <option value="new">New Customer</option>
                </select>
              </div>

              {customerType === "existing" && (
                <div>
                  <label className="block mb-2 text-sm font-medium">
                    Select Customer
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full p-3 rounded-lg bg-[#5b361a] text-white focus:outline-none focus:ring-2 focus:ring-[#f5d7a9]"
                  >
                    <option value="">Select a customer...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} - {c.mobile}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {customerType === "new" && (
                <>
                  <div>
                    <label className="block mb-2 text-sm font-medium">
                      New Customer Name
                    </label>
                    <input
                      type="text"
                      value={newCustomer.name}
                      onChange={(e) =>
                        setNewCustomer({ ...newCustomer, name: e.target.value })
                      }
                      className="w-full p-3 rounded-lg bg-[#5b361a] text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-[#f5d7a9]"
                      placeholder="Customer Name"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium">
                      New Customer Mobile
                    </label>
                    <input
                      type="text"
                      value={newCustomer.mobile}
                      onChange={(e) =>
                        setNewCustomer({
                          ...newCustomer,
                          mobile: e.target.value,
                        })
                      }
                      className="w-full p-3 rounded-lg bg-[#5b361a] text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-[#f5d7a9]"
                      placeholder="Mobile Number"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block mb-2 text-sm font-medium">
                  Courier Partner (Optional)
                </label>
                <select
                  value={selectedCourierId}
                  onChange={(e) => setSelectedCourierId(e.target.value)}
                  className="w-full p-3 rounded-lg bg-[#5b361a] text-white focus:outline-none focus:ring-2 focus:ring-[#f5d7a9]"
                >
                  <option value="">No Courier</option>{" "}
                  {/* Added "No Courier" option */}
                  {courierPartners.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Employee Selection */}
              <div>
                <label className="block mb-2 text-sm font-medium">
                  Employee
                </label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  required // Make employee selection mandatory
                  className="w-full p-3 rounded-lg bg-[#5b361a] text-white focus:outline-none focus:ring-2 focus:ring-[#f5d7a9]"
                >
                  <option value="">Select an employee...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Current Bill & Summary */}
        <div className="lg:col-span-1 bg-[#7b4c2b] p-6 rounded-3xl shadow-lg">
          <h3 className="text-xl font-bold mb-4">Current Bill</h3>
          <div className="h-[200px] overflow-y-auto mb-4 pr-2">
            {billItems.length > 0 ? (
              billItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#5b361a] p-3 rounded-xl shadow-md flex items-center mb-2"
                >
                  <div className="flex-1">
                    <p className="font-bold">{item.brand}</p>
                    <p className="text-sm text-gray-300">
                      ₹{item.price?.toFixed(2)} x {item.quantity}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        handleUpdateItemQuantity(item, item.quantity - 1)
                      }
                      className="text-white hover:text-red-400"
                    >
                      <MinusCircle size={20} />
                    </button>
                    <span className="w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() =>
                        handleUpdateItemQuantity(item, item.quantity + 1)
                      }
                      className="text-white hover:text-green-400"
                    >
                      <PlusCircle size={20} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p>No items in the bill.</p>
            )}
          </div>

          <div className="border-t border-[#f5d7a9] pt-4 mt-4 space-y-2">
            {selectedCustomer && (
              <div className="flex justify-between items-center">
                <p>
                  Loyalty Points:{" "}
                  <span className="font-bold text-yellow-400">
                    {selectedCustomer.loyaltyPoints || 0}
                  </span>
                </p>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    placeholder="Redeem points"
                    value={pointsToRedeem}
                    onChange={(e) => setPointsToRedeem(e.target.value)}
                    className="w-28 p-2 rounded-lg bg-[#5b361a] text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-[#f5d7a9]"
                  />
                  <button
                    onClick={handleRedeemPoints}
                    className="bg-[#a86500] text-white p-2 rounded-lg hover:bg-[#c67c00] transition-colors"
                  >
                    Redeem
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-between font-bold text-lg">
              <span>Subtotal:</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            {discountApplied > 0 && (
              <div className="flex justify-between font-bold text-lg text-red-300">
                <span>Discount:</span>
                <span>-₹{discountApplied.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-xl text-[#f5d7a9]">
              <span>Grand Total:</span>
              <span>₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handleGenerateInvoice}
            className="w-full bg-[#f5d7a9] text-[#7b4c2b] font-bold py-3 mt-4 rounded-lg hover:bg-[#ffe39c] transition-colors"
          >
            Generate Invoice
          </button>
        </div>
      </div>

      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        invoiceData={invoiceData}
      />
    </>
  );
};

// --- Inventory Section (New) ---
const InventorySection = ({ userId }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isStockLogModalOpen, setIsStockLogModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [stockLogs, setStockLogs] = useState([]);
  const [logType, setLogType] = useState("inward"); // Default log type
  const [isSavingProduct, setIsSavingProduct] = useState(false); // New state for saving status

  // Filter states
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [searchTerm, setSearchTerm] = useState(""); // For product brand/barcode search

  // Fetch products from Firestore
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    const productsCollectionPath = `/artifacts/${appId}/users/${userId}/products`;
    const unsubscribe = onSnapshot(
      collection(db, productsCollectionPath),
      (querySnapshot) => {
        setProducts(
          querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching products:", error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [userId]);

  // Fetch stock logs from Firestore
  useEffect(() => {
    if (!userId) return;
    const stockLogsCollectionPath = `/artifacts/${appId}/users/${userId}/stock_logs`;
    const unsubscribe = onSnapshot(
      collection(db, stockLogsCollectionPath),
      (querySnapshot) => {
        setStockLogs(
          querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      },
      (error) => {
        console.error("Error fetching stock logs:", error);
      }
    );
    return () => unsubscribe();
  }, [userId]);

  // Handle adding or updating a product
  const handleAddOrUpdateProduct = async (formData) => {
    if (!userId) return;
    setIsSavingProduct(true); // Set saving status to true
    try {
      const productsCollectionPath = `/artifacts/${appId}/users/${userId}/products`;
      let productDataToSave = { ...formData }; // Copy formData

      // If a new picture is selected, upload it to Cloudinary
      if (formData.picture instanceof File) {
        const imageUrl = await uploadToCloudinary(formData.picture);
        productDataToSave.pictureUrl = imageUrl; // Store the Cloudinary URL
      } else if (editingProduct && !formData.picture) {
        // If editing and no new picture, retain existing pictureUrl
        productDataToSave.pictureUrl = editingProduct.pictureUrl || "";
      } else if (!editingProduct) {
        // If adding new product and no picture, ensure pictureUrl is empty
        productDataToSave.pictureUrl = "";
      }

      // Remove the temporary 'picture' File object before saving to Firestore
      delete productDataToSave.picture;

      const docRef = editingProduct
        ? doc(db, productsCollectionPath, editingProduct.id)
        : null;

      if (editingProduct) {
        // Update existing product
        await updateDoc(docRef, productDataToSave);
      } else {
        // Add new product, ensuring initial stock is set
        await addDoc(collection(db, productsCollectionPath), {
          ...productDataToSave,
          stock: productDataToSave.stock || 0,
        });
      }
      setIsProductModalOpen(false);
      setEditingProduct(null);
    } catch (e) {
      console.error("Error adding/updating product:", e);
      // Optionally, show an error message to the user
    } finally {
      setIsSavingProduct(false); // Reset saving status
    }
  };

  // Handle deleting a product
  const handleDeleteProduct = async () => {
    if (!userId || !productToDelete) return;
    try {
      await deleteDoc(
        doc(
          db,
          `/artifacts/${appId}/users/${userId}/products`,
          productToDelete.id
        )
      );
      setIsConfirmationModalOpen(false);
      setProductToDelete(null);
    } catch (e) {
      console.error("Error deleting product:", e);
    }
  };

  // Set product for editing
  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  // Handle stock updates (inward, outward, damage)
  const handleStockUpdate = async (productId, type, quantity) => {
    if (!userId || !productId || quantity <= 0) return;
    try {
      const productRef = doc(
        db,
        `/artifacts/${appId}/users/${userId}/products`,
        productId
      );
      const currentProduct = products.find((p) => p.id === productId);
      const currentStock = currentProduct?.stock || 0;
      let newStock = currentStock;

      if (type === "inward") {
        newStock += quantity;
      } else {
        // 'outward' or 'damage'
        if (currentStock < quantity) {
          console.error("Not enough stock to log outward/damage.");
          return;
        }
        newStock -= quantity;
      }

      // Update product's stock
      await updateDoc(productRef, { stock: newStock });

      // Add a log entry for the stock movement
      await addDoc(
        collection(db, `/artifacts/${appId}/users/${userId}/stock_logs`),
        {
          productId: productId,
          quantity: quantity,
          type: type,
          date: new Date().toISOString().split("T")[0], // Current date in YYYY-MM-DD format
        }
      );
      setIsStockLogModalOpen(false);
      // setLogItem({ id: '', brand: '', quantity: 0, date: '' }); // Unused
    } catch (e) {
      console.error("Error updating stock:", e);
    }
  };

  // Helper to get product brand for display in logs
  const getProductBrand = (productId) => {
    return products.find((p) => p.id === productId)?.brand || "Unknown Product";
  };

  // Filtered products based on search and selected filters
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesColor = selectedColor
      ? product.color?.toLowerCase() === selectedColor.toLowerCase()
      : true;
    const matchesSize = selectedSize
      ? product.size?.toLowerCase() === selectedSize.toLowerCase()
      : true;
    return matchesSearch && matchesColor && matchesSize;
  });

  // Get unique colors and sizes for filter dropdowns
  const uniqueColors = [
    ...new Set(products.map((p) => p.color).filter(Boolean)),
  ];
  const uniqueSizes = [...new Set(products.map((p) => p.size).filter(Boolean))];

  return (
    <>
      <h2 className="text-3xl font-bold mb-6 text-[#f5d7a9]">
        Inventory Management
      </h2>
      <div className="bg-[#7b4c2b] p-6 rounded-3xl shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Product List</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                setLogType("inward");
                setIsStockLogModalOpen(true);
              }}
              className="bg-[#a86500] text-white font-bold py-2 px-4 rounded-lg flex items-center hover:bg-[#c67c00] transition-colors"
            >
              <PlusCircle size={20} className="mr-2" /> Stock In
            </button>
            <button
              onClick={() => {
                setLogType("outward");
                setIsStockLogModalOpen(true);
              }}
              className="bg-[#a86500] text-white font-bold py-2 px-4 rounded-lg flex items-center hover:bg-[#c67c00] transition-colors"
            >
              <MinusCircle size={20} className="mr-2" /> Stock Out
            </button>
            <button
              onClick={() => {
                setLogType("damage");
                setIsStockLogModalOpen(true);
              }}
              className="bg-[#a86500] text-white font-bold py-2 px-4 rounded-lg flex items-center hover:bg-[#c67c00] transition-colors"
            >
              <AlertCircle size={20} className="mr-2" /> Damage
            </button>
            <button
              onClick={() => {
                setEditingProduct(null);
                setIsProductModalOpen(true);
              }}
              className="bg-[#f5d7a9] text-[#7b4c2b] font-bold py-2 px-4 rounded-lg flex items-center hover:bg-[#ffe39c] transition-colors"
            >
              <Plus size={20} className="mr-2" /> Add Product
            </button>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-[#5b361a] p-4 rounded-xl mb-4 flex flex-wrap gap-4 items-center">
          <div className="flex items-center flex-grow">
            <Search className="mr-2 text-white/70" />
            <input
              type="text"
              placeholder="Search by brand or barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 rounded-lg bg-[#7b4c2b] text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-[#f5d7a9]"
            />
          </div>
          <div className="flex items-center">
            <Filter className="mr-2 text-white/70" />
            <select
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="p-2 rounded-lg bg-[#7b4c2b] text-white focus:outline-none focus:ring-2 focus:ring-[#f5d7a9]"
            >
              <option value="">All Colors</option>
              {uniqueColors.map((color) => (
                <option key={color} value={color}>
                  {color}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center">
            <Filter className="mr-2 text-white/70" />
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              className="p-2 rounded-lg bg-[#7b4c2b] text-white focus:outline-none focus:ring-2 focus:ring-[#f5d7a9]"
            >
              <option value="">All Sizes</option>
              {uniqueSizes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => {
              setSelectedColor("");
              setSelectedSize("");
              setSearchTerm("");
            }}
            className="bg-gray-400 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors flex items-center"
          >
            <RefreshCcw size={18} className="mr-2" /> Reset Filters
          </button>
        </div>

        <div className="h-[300px] overflow-y-auto p-4 bg-[#5b361a] rounded-xl mb-8">
          {loading ? (
            <p>Loading products...</p>
          ) : filteredProducts.length > 0 ? (
            <table className="min-w-full divide-y divide-[#b37a4e]">
              <thead className="bg-[#5b361a] sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[#f5d7a9] uppercase">
                    Image
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[#f5d7a9] uppercase">
                    Brand
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[#f5d7a9] uppercase">
                    Barcode
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[#f5d7a9] uppercase">
                    Price
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[#f5d7a9] uppercase">
                    Stock
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[#f5d7a9] uppercase">
                    Color
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[#f5d7a9] uppercase">
                    Size
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-[#f5d7a9] uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#b37a4e]">
                {filteredProducts.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      {p.pictureUrl && (
                        <img
                          src={p.pictureUrl}
                          alt={p.brand}
                          className="w-12 h-12 object-cover rounded-md"
                        />
                      )}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      {p.brand}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      {p.barcode}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      ₹{p.price?.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      {p.stock}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      {p.color}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      {p.size}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-right space-x-2">
                      <button
                        onClick={() => handleEditProduct(p)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => {
                          setProductToDelete(p);
                          setIsConfirmationModalOpen(true);
                        }}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-white/70 py-8">
              No products found matching your criteria. Try adjusting filters or
              adding new products.
            </p>
          )}
        </div>
      </div>

      <div className="bg-[#7b4c2b] p-6 rounded-3xl shadow-lg mt-8">
        <h3 className="text-xl font-bold mb-4">Stock Log History</h3>
        <div className="h-[300px] overflow-y-auto p-4 bg-[#5b361a] rounded-xl">
          {loading ? (
            <p>Loading stock logs...</p>
          ) : stockLogs.length > 0 ? (
            <table className="min-w-full divide-y divide-[#b37a4e]">
              <thead className="bg-[#5b361a] sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[#f5d7a9] uppercase">
                    Date
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[#f5d7a9] uppercase">
                    Product
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[#f5d7a9] uppercase">
                    Type
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[#f5d7a9] uppercase">
                    Quantity
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#b37a4e]">
                {stockLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      {log.date}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      {getProductBrand(log.productId)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm capitalize">
                      {log.type}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      {log.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-white/70 py-8">
              No stock log history found.
            </p>
          )}
        </div>
      </div>

      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={editingProduct ? "Edit Product" : "Add New Product"}
      >
        {/* Pass a default empty object if editingProduct is null */}
        <AddProductForm
          onSave={handleAddOrUpdateProduct}
          onClose={() => setIsProductModalOpen(false)}
          initialData={
            editingProduct || {
              barcode: "",
              brand: "",
              price: 0,
              stock: 0,
              color: "",
              size: "",
              picture: null,
              pictureUrl: "", // Ensure this is passed for initial display
            }
          }
          isSaving={isSavingProduct} // Pass saving status to disable button
        />
      </Modal>

      <Modal
        isOpen={isStockLogModalOpen}
        onClose={() => setIsStockLogModalOpen(false)}
        title={`Log Stock ${
          logType.charAt(0).toUpperCase() + logType.slice(1)
        }`}
      >
        <StockLogForm
          products={products}
          actionType={logType}
          onSave={handleStockUpdate}
          onClose={() => setIsStockLogModalOpen(false)}
        />
      </Modal>

      <ConfirmationModal
        isOpen={isConfirmationModalOpen}
        onClose={() => setIsConfirmationModalOpen(false)}
        onConfirm={handleDeleteProduct}
        message={`Are you sure you want to delete the product: ${productToDelete?.brand}? This action cannot be undone.`}
      />
    </>
  );
};

const SalesFinanceSection = ({ userId }) => {
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState({});
  const [courierPartners, setCourierPartners] = useState({});
  const [loading, setLoading] = useState(true);

  // States for aggregated sales data for charts
  const [dailySalesData, setDailySalesData] = useState([]);
  const [weeklySalesData, setWeeklySalesData] = useState([]);
  const [monthlySalesData, setMonthlySalesData] = useState([]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const salesCollectionPath = `/artifacts/${appId}/users/${userId}/sales`;
    const customersCollectionPath = `/artifacts/${appId}/users/${userId}/customers`;
    const courierCollectionPath = `/artifacts/${appId}/users/${userId}/courier_partners`;

    const unsubscribeSales = onSnapshot(
      collection(db, salesCollectionPath),
      (querySnapshot) => {
        const salesData = [];
        querySnapshot.forEach((doc) =>
          salesData.push({ id: doc.id, ...doc.data() })
        );
        setSales(salesData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching sales:", error);
        setLoading(false);
      }
    );

    const unsubscribeCustomers = onSnapshot(
      collection(db, customersCollectionPath),
      (querySnapshot) => {
        const customersData = {};
        querySnapshot.forEach((doc) => {
          customersData[doc.id] = doc.data();
        });
        setCustomers(customersData);
      },
      (error) => {
        console.error("Error fetching customers:", error);
      }
    );

    const unsubscribeCouriers = onSnapshot(
      collection(db, courierCollectionPath),
      (querySnapshot) => {
        const couriersData = {};
        querySnapshot.forEach((doc) => {
          couriersData[doc.id] = doc.data();
        });
        setCourierPartners(couriersData);
      },
      (error) => {
        console.error("Error fetching courier partners:", error);
      }
    );

    return () => {
      unsubscribeSales();
      unsubscribeCustomers();
      unsubscribeCouriers();
    };
  }, [userId]);

  // Aggregate sales data for charts whenever 'sales' state changes
  useEffect(() => {
    const aggregateSales = (salesList) => {
      const daily = {};
      const weekly = {};
      const monthly = {};

      salesList.forEach((sale) => {
        const saleDate = new Date(sale.date);
        const total = sale.totalAmount || 0;

        // Daily aggregation
        const dayKey = saleDate.toISOString().split("T")[0]; // YYYY-MM-DD
        daily[dayKey] = (daily[dayKey] || 0) + total;

        // Weekly aggregation (ISO week date system)
        const weekStart = new Date(saleDate);
        weekStart.setDate(saleDate.getDate() - ((saleDate.getDay() + 6) % 7)); // Set to Monday of the current week
        const weekKey = `${weekStart.getFullYear()}-W${
          Math.ceil(
            (weekStart.getTime() -
              new Date(weekStart.getFullYear(), 0, 1).getTime()) /
              (7 * 24 * 60 * 60 * 1000)
          ) + 1
        }`;
        weekly[weekKey] = (weekly[weekKey] || 0) + total;

        // Monthly aggregation
        const monthKey = `${saleDate.getFullYear()}-${(saleDate.getMonth() + 1)
          .toString()
          .padStart(2, "0")}`; // YYYY-MM
        monthly[monthKey] = (monthly[monthKey] || 0) + total;
      });

      const sortedDaily = Object.keys(daily)
        .sort()
        .map((date) => ({ date, amount: daily[date] }));
      const sortedWeekly = Object.keys(weekly)
        .sort()
        .map((week) => ({ week, amount: weekly[week] }));
      const sortedMonthly = Object.keys(monthly)
        .sort()
        .map((month) => ({ month, amount: monthly[month] }));

      setDailySalesData(sortedDaily);
      setWeeklySalesData(sortedWeekly);
      setMonthlySalesData(sortedMonthly);
    };

    aggregateSales(sales);
  }, [sales]);

  const handleDownloadReport = () => {
    if (sales.length === 0) {
      console.warn("No sales data to download.");
      return;
    }

    const headers = [
      "Sale ID",
      "Date",
      "Customer Name",
      "Customer Mobile",
      "Courier Partner",
      "Items (Brand - Barcode - Qty - Price)",
      "Subtotal",
      "Discount",
      "Total Amount",
      "Loyalty Points Earned",
      "Loyalty Points Redeemed",
    ];

    const rows = sales.map((sale) => {
      const customer = customers[sale.customerId];
      const courier = courierPartners[sale.courierId];
      const itemsDetails = sale.items
        .map(
          (item) =>
            `${item.brand} - ${item.barcode} - ${
              item.quantity
            } - $${item.price?.toFixed(2)}`
        )
        .join("; ");

      return [
        sale.id,
        sale.date,
        customer?.name || "N/A",
        customer?.mobile || "N/A",
        courier?.name || "N/A",
        itemsDetails,
        sale.subtotal?.toFixed(2),
        sale.discount?.toFixed(2),
        sale.totalAmount?.toFixed(2),
        sale.loyaltyPointsEarned || 0,
        sale.loyaltyPointsRedeemed || 0,
      ]
        .map((field) => `"${String(field).replace(/"/g, '""')}"`)
        .join(","); // Enclose fields in quotes and escape internal quotes
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      // Feature detection for download attribute
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `sales_report_${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      console.error(
        "Your browser does not support the download attribute. Please right-click and 'Save Link As...'"
      );
    }
  };

  if (loading) {
    return (
      <p className="text-white/70 text-center py-8">Loading sales data...</p>
    );
  }

  return (
    <>
      <h2 className="text-3xl font-bold mb-6 text-[#f5d7a9]">
        Sales & Finance
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-[#7b4c2b] p-6 rounded-3xl shadow-lg flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Total Sales Revenue</p>
            <p className="text-4xl font-bold text-[#f5d7a9]">
              &#8377;
              {sales
                .reduce((acc, sale) => acc + sale.totalAmount, 0)
                .toFixed(2)}
            </p>
          </div>
          <IndianRupee size={60} className="text-[#a86500]" />
        </div>
        <div className="bg-[#7b4c2b] p-6 rounded-3xl shadow-lg flex items-center justify-center">
          <button
            onClick={handleDownloadReport}
            className="bg-[#f5d7a9] text-[#7b4c2b] font-bold py-3 px-6 rounded-lg flex items-center justify-center hover:bg-[#ffe39c] transition-colors text-lg"
          >
            <Download size={24} className="mr-3" /> Download Sales Report
          </button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Daily Sales Chart */}
        <div className="bg-[#7b4c2b] p-6 rounded-3xl shadow-lg">
          <h3 className="text-xl font-bold mb-4 text-[#f5d7a9]">Daily Sales</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={dailySalesData}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#b37a4e" />
              <XAxis dataKey="date" stroke="#f5d7a9" />
              <YAxis stroke="#f5d7a9" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#5b361a",
                  border: "none",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#f5d7a9" }}
                itemStyle={{ color: "#f5d7a9" }}
                formatter={(value) => `₹${value.toFixed(2)}`}
              />
              <Legend wrapperStyle={{ color: "#f5d7a9" }} />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#f5d7a9"
                activeDot={{ r: 8 }}
                name="Sales Amount"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly Sales Chart */}
        <div className="bg-[#7b4c2b] p-6 rounded-3xl shadow-lg">
          <h3 className="text-xl font-bold mb-4 text-[#f5d7a9]">
            Weekly Sales
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={weeklySalesData}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#b37a4e" />
              <XAxis dataKey="week" stroke="#f5d7a9" />
              <YAxis stroke="#f5d7a9" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#5b361a",
                  border: "none",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#f5d7a9" }}
                itemStyle={{ color: "#f5d7a9" }}
                formatter={(value) => `₹${value.toFixed(2)}`}
              />
              <Legend wrapperStyle={{ color: "#f5d7a9" }} />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#f5d7a9"
                activeDot={{ r: 8 }}
                name="Sales Amount"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Sales Chart */}
        <div className="bg-[#7b4c2b] p-6 rounded-3xl shadow-lg">
          <h3 className="text-xl font-bold mb-4 text-[#f5d7a9]">
            Monthly Sales
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={monthlySalesData}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#b37a4e" />
              <XAxis dataKey="month" stroke="#f5d7a9" />
              <YAxis stroke="#f5d7a9" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#5b361a",
                  border: "none",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#f5d7a9" }}
                itemStyle={{ color: "#f5d7a9" }}
                formatter={(value) => `₹${value.toFixed(2)}`}
              />
              <Legend wrapperStyle={{ color: "#f5d7a9" }} />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#f5d7a9"
                activeDot={{ r: 8 }}
                name="Sales Amount"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-[#7b4c2b] p-6 rounded-3xl shadow-lg mt-8">
        <h3 className="text-xl font-bold mb-4">Recent Sales Transactions</h3>
        <div className="h-[400px] overflow-y-auto p-4 bg-[#5b361a] rounded-xl">
          {loading ? (
            <p>Loading sales data...</p>
          ) : sales.length > 0 ? (
            <table className="min-w-full divide-y divide-[#b37a4e]">
              <thead className="bg-[#5b361a]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#f5d7a9] uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#f5d7a9] uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#f5d7a9] uppercase tracking-wider">
                    Courier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#f5d7a9] uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#f5d7a9] uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-[#7b4c2b] divide-y divide-[#b37a4e]">
                {sales.map((s) => (
                  <tr key={s.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {s.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {customers[s.customerId]?.name || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {courierPartners[s.courierId]?.name || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {s.items.length}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      ${s.totalAmount?.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No sales records found.</p>
          )}
        </div>
      </div>
    </>
  );
};

// --- Sidebar Component ---
const Sidebar = ({ activeView, setActiveView }) => {
  const navItems = [
    { name: "dashboard", icon: LayoutGrid, label: "Dashboard" },
    { name: "crm", icon: Briefcase, label: "Jeyvanth Silks CRM" }, // Updated label
    { name: "billing", icon: Receipt, label: "Billing" },
    { name: "inventory", icon: Package, label: "Inventory" }, // Added Inventory
    { name: "courier", icon: Truck, label: "Courier" },
    { name: "sales", icon: ChartNoAxesCombined, label: "Sales & Finance" },
  ];

  return (
    <aside className="bg-[#5b361a] fixed left-0 top-4 bottom-4 p-3 flex flex-col items-center space-y-6 rounded-r-3xl shadow-xl w-[70px] hover:w-56 transition-all duration-300 ease-in-out peer z-40">
      <div className="flex justify-center items-center w-full mb-4">
        <h1 className="text-xl font-bold opacity-0 peer-hover:opacity-100 transition-opacity duration-300">
          Dashboard
        </h1>
      </div>
      <div className="space-y-4 w-full">
        {navItems.map((item) => (
          <button
            key={item.name}
            className={`w-full h-14 rounded-xl flex items-center overflow-hidden shadow-lg transition-colors duration-300 hover:bg-[#a86500] ${
              activeView === item.name
                ? "bg-[#a86500] shadow-2xl"
                : "bg-[#7b4c2b]"
            }`}
            onClick={() => setActiveView(item.name)}
            title={item.label}
          >
            <div className="w-[46px] h-full flex-shrink-0 flex items-center justify-center">
              <item.icon size={28} />
            </div>
            {/* Text is now always visible when expanded, clipped when collapsed */}
            <span className="ml-2 text-sm font-medium whitespace-nowrap">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </aside>
  );
};

const DashboardView = ({ userId }) => {
  const [stockLogs, setStockLogs] = useState([]);
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [courierLogs, setCourierLogs] = useState([]);
  const [employees, setEmployees] = useState([]); // New state for employees
  const [targets, setTargets] = useState([]); // New state for targets
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const unsubStockLogs = onSnapshot(
      collection(db, `/artifacts/${appId}/users/${userId}/stock_logs`),
      (snapshot) => {
        setStockLogs(snapshot.docs.map((doc) => doc.data()));
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching stock logs:", error);
        setLoading(false);
      }
    );

    const unsubSales = onSnapshot(
      collection(db, `/artifacts/${appId}/users/${userId}/sales`),
      (snapshot) => {
        setSales(snapshot.docs.map((doc) => doc.data()));
      }
    );

    const unsubProducts = onSnapshot(
      collection(db, `/artifacts/${appId}/users/${userId}/products`),
      (snapshot) => {
        setProducts(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      }
    );

    const unsubCourierLogs = onSnapshot(
      collection(db, `/artifacts/${appId}/users/${userId}/courier_logs`),
      (snapshot) => {
        setCourierLogs(snapshot.docs.map((doc) => doc.data()));
      }
    );

    const unsubEmployees = onSnapshot(
      // New subscription for employees
      collection(db, `/artifacts/${appId}/users/${userId}/employees`),
      (snapshot) => {
        setEmployees(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      }
    );

    const unsubTargets = onSnapshot(
      // New subscription for targets
      collection(db, `/artifacts/${appId}/users/${userId}/employee_targets`),
      (snapshot) => {
        setTargets(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      }
    );

    return () => {
      unsubStockLogs();
      unsubSales();
      unsubProducts();
      unsubCourierLogs();
      unsubEmployees(); // Cleanup employee listener
      unsubTargets(); // Cleanup targets listener
    };
  }, [userId]);

  // --- Data Aggregation for Charts ---

  // Today's Stock Inward/Outward
  const today = new Date().toISOString().split("T")[0];
  const todayStockData = stockLogs
    .filter((log) => log.date === today)
    .reduce(
      (acc, log) => {
        if (log.type === "inward") {
          acc.inward += log.quantity;
        } else if (log.type === "outward" || log.type === "damage") {
          acc.outward += log.quantity;
        }
        return acc;
      },
      { inward: 0, outward: 0 }
    );

  const todayStockChartData = [
    { name: "Inward", value: todayStockData.inward, color: "#f5d7a9" },
    { name: "Outward", value: todayStockData.outward, color: "#a86500" },
  ];

  // Daily Net Stock Change
  const dailyNetStockChange = {};
  stockLogs.forEach((log) => {
    if (!dailyNetStockChange[log.date]) {
      dailyNetStockChange[log.date] = 0;
    }
    if (log.type === "inward") {
      dailyNetStockChange[log.date] += log.quantity;
    } else if (log.type === "outward" || log.type === "damage") {
      dailyNetStockChange[log.date] -= log.quantity;
    }
  });
  const dailyNetStockChartData = Object.keys(dailyNetStockChange)
    .sort()
    .map((date) => ({ date, netChange: dailyNetStockChange[date] }));

  // Day-wise Courier Billing
  const dailyCourierBills = {};
  courierLogs.forEach((log) => {
    if (!dailyCourierBills[log.date]) {
      dailyCourierBills[log.date] = 0;
    }
    dailyCourierBills[log.date] += 1; // Count each log entry as one bill
  });
  const dailyCourierChartData = Object.keys(dailyCourierBills)
    .sort()
    .map((date) => ({ date, count: dailyCourierBills[date] }));

  // Fast-Moving and Slow-Moving Products
  const productSalesCount = {};
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  sales.forEach((sale) => {
    const saleDate = new Date(sale.date);
    if (saleDate >= thirtyDaysAgo) {
      sale.items.forEach((item) => {
        productSalesCount[item.id] =
          (productSalesCount[item.id] || 0) + item.quantity;
      });
    }
  });

  const productsWithSales = products.map((p) => ({
    ...p,
    salesCount: productSalesCount[p.id] || 0,
  }));

  const sortedProductsBySales = productsWithSales.sort(
    (a, b) => b.salesCount - a.salesCount
  );
  const fastMovingProducts = sortedProductsBySales.slice(0, 5);
  const slowMovingProducts = sortedProductsBySales.slice(-5).reverse(); // Get last 5 and reverse to show lowest first

  // Employee Sales Performance
  const employeeSales = {};
  sales.forEach((sale) => {
    if (sale.employeeId) {
      employeeSales[sale.employeeId] =
        (employeeSales[sale.employeeId] || 0) + sale.totalAmount;
    }
  });

  const employeePerformanceData = employees.map((emp) => {
    const salesAmount = employeeSales[emp.id] || 0;
    const employeeTarget = targets.find(
      (target) => target.employeeId === emp.id
    );
    const target = employeeTarget?.targetAmount || 0;
    const percentageAchieved = target > 0 ? (salesAmount / target) * 100 : 0;
    return {
      name: emp.name,
      sales: salesAmount,
      target: target,
      percentage: percentageAchieved,
    };
  });

  if (loading) {
    return (
      <p className="text-white/70 text-center py-8">
        Loading dashboard data...
      </p>
    );
  }

  return (
    <>
      <h2 className="text-3xl font-bold mb-6 text-[#f5d7a9]">
        Dashboard Overview
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Today's Stock Inward/Outward Ring Chart */}
        <div className="bg-[#7b4c2b] p-6 rounded-3xl shadow-lg flex flex-col items-center">
          <h3 className="text-xl font-bold mb-4 text-[#f5d7a9]">
            Today's Stock Movement
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={todayStockChartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
              >
                {todayStockChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#5b361a",
                  border: "none",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#f5d7a9" }}
                itemStyle={{ color: "#f5d7a9" }}
                formatter={(value) => `${value} units`}
              />
              <Legend wrapperStyle={{ color: "#f5d7a9" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 text-center text-sm">
            <p>Inward: {todayStockData.inward} units</p>
            <p>Outward: {todayStockData.outward} units</p>
          </div>
        </div>

        {/* Daily Net Stock Change Line Chart */}
        <div className="bg-[#7b4c2b] p-6 rounded-3xl shadow-lg">
          <h3 className="text-xl font-bold mb-4 text-[#f5d7a9]">
            Daily Net Stock Change
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart
              data={dailyNetStockChartData}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#b37a4e" />
              <XAxis dataKey="date" stroke="#f5d7a9" />
              <YAxis stroke="#f5d7a9" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#5b361a",
                  border: "none",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#f5d7a9" }}
                itemStyle={{ color: "#f5d7a9" }}
                formatter={(value) => `${value} units`}
              />
              <Legend wrapperStyle={{ color: "#f5d7a9" }} />
              <Line
                type="monotone"
                dataKey="netChange"
                stroke="#f5d7a9"
                activeDot={{ r: 8 }}
                name="Net Change"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Day-wise Courier Billing Bar Chart */}
        <div className="bg-[#7b4c2b] p-6 rounded-3xl shadow-lg">
          <h3 className="text-xl font-bold mb-4 text-[#f5d7a9]">
            Daily Courier Billings
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <RechartsBarChart
              data={dailyCourierChartData}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#b37a4e" />
              <XAxis dataKey="date" stroke="#f5d7a9" />
              <YAxis stroke="#f5d7a9" allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#5b361a",
                  border: "none",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#f5d7a9" }}
                itemStyle={{ color: "#f5d7a9" }}
                formatter={(value) => `${value} bills`}
              />
              <Legend wrapperStyle={{ color: "#f5d7a9" }} />
              <Bar dataKey="count" fill="#f5d7a9" name="Number of Bills" />
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Fast-Moving Products */}
        <div className="bg-[#7b4c2b] p-6 rounded-3xl shadow-lg">
          <h3 className="text-xl font-bold mb-4 text-[#f5d7a9]">
            Fast-Moving Products (Last 30 Days)
          </h3>
          <div className="space-y-3">
            {fastMovingProducts.length > 0 ? (
              fastMovingProducts.map((product) => (
                <ProductListItem
                  key={product.id}
                  product={product}
                  type="fast"
                />
              ))
            ) : (
              <p className="text-white/70 text-center py-8">
                No fast-moving products found.
              </p>
            )}
          </div>
        </div>

        {/* Slow-Moving Products */}
        <div className="bg-[#7b4c2b] p-6 rounded-3xl shadow-lg">
          <h3 className="text-xl font-bold mb-4 text-[#f5d7a9]">
            Slow-Moving Products (Last 30 Days)
          </h3>
          <div className="space-y-3">
            {slowMovingProducts.length > 0 ? (
              slowMovingProducts.map((product) => (
                <ProductListItem
                  key={product.id}
                  product={product}
                  type="slow"
                />
              ))
            ) : (
              <p className="text-white/70 text-center py-8">
                No slow-moving products found.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Employee Sales Performance Chart */}
      <div className="mt-8 bg-[#7b4c2b] p-6 rounded-3xl shadow-lg">
        <h3 className="text-xl font-bold mb-4 text-[#f5d7a9]">
          Employee Sales Performance
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <RechartsBarChart
            data={employeePerformanceData}
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#b37a4e" />
            <XAxis dataKey="name" stroke="#f5d7a9" />
            <YAxis stroke="#f5d7a9" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#5b361a",
                border: "none",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#f5d7a9" }}
              itemStyle={{ color: "#f5d7a9" }}
              formatter={(value, name, props) => {
                if (name === "Sales") {
                  return `₹${value.toFixed(2)}`;
                } else if (name === "Target") {
                  return `₹${value.toFixed(2)}`;
                }
                return value;
              }}
            />
            <Legend wrapperStyle={{ color: "#f5d7a9" }} />
            <Bar dataKey="sales" fill="#f5d7a9" name="Sales" />
            <Bar dataKey="target" fill="#a86500" name="Target" />
          </RechartsBarChart>
        </ResponsiveContainer>
        <div className="mt-4 text-center text-white/70">
          {employeePerformanceData.length > 0 ? (
            employeePerformanceData.map((emp) => (
              <p key={emp.name}>
                {emp.name}: Achieved{" "}
                <span className="font-bold">{emp.percentage.toFixed(2)}%</span>{" "}
                of target.
              </p>
            ))
          ) : (
            <p>No employee sales data available.</p>
          )}
        </div>
      </div>
    </>
  );
};

const MainDashboard = ({ activeView, setActiveView, userId }) => {
  const renderContent = () => {
    switch (activeView) {
      case "dashboard":
        return <DashboardView userId={userId} />;
      case "crm":
        return <CrmSection userId={userId} />;
      case "billing":
        return <BillingSection setActiveView={setActiveView} userId={userId} />;
      case "inventory":
        return <InventorySection userId={userId} />;
      case "courier":
        return <CourierSection userId={userId} />;
      case "sales":
        return <SalesFinanceSection userId={userId} />;
      default:
        return <DashboardView userId={userId} />;
    }
  };

  return (
    <main className="flex-1  overflow-auto ml-[calc(70px+1rem)] peer-hover:ml-[calc(224px+1rem)] transition-all duration-300 ease-in-out mt-4 mr-0 mb-4 overflow-y-scroll scrollbar-hide">
      <div className="bg-[#b37a4e] p-8 rounded-l-3xl shadow-xl space-y-8 min-h-full">
        {renderContent()}
      </div>
    </main>
  );
};

const Card = ({ children }) => {
  return (
    <div
      className="bg-[#32190a] mt-12 p-20 text-[#f0c320] text-[2em] md:text-[2.5em] font-serif rounded-xl shadow-lg text-center leading-tight"
      style={{
        wordSpacing: "8px",
        textShadow: "0px 4px 4px rgba(240,195,32,0.45)",
      }}
    >
      {children}
    </div>
  );
};

const SplashScreen = ({ onAnimationEnd }) => {
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setIsAnimatingOut(true), 2000);
    const timer2 = setTimeout(() => onAnimationEnd(), 2500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onAnimationEnd]);

  return (
    <div
      className={`fixed inset-0 z-[100] bg-[#7b4c2b] transition-opacity duration-1000 ease-out flex items-center justify-center ${
        isAnimatingOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden font-sans text-white">
        {/* Left Silk Designs with fade + slide animation */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-20 md:w-60 pl-2 md:pl-4 overflow-hidden transform transition-all duration-1000 ${
            isAnimatingOut
              ? "-translate-x-10 opacity-0"
              : "translate-x-0 opacity-100"
          }`}
        >
          <div className="h-full animate-scroll-vertical">
            {Array.from({ length: 20 }).map((_, i) => (
              <img
                key={i}
                src={i % 2 === 0 ? SilkDesign : SilkDesign2}
                alt={`Silk Design ${i}`}
                className="w-full block -mb-5 p-0"
                draggable={false}
              />
            ))}
          </div>
        </div>

        {/* Center Content with fade + slide animation */}
        <div
          className={`flex flex-col items-center justify-center transform transition-all duration-1000 ${
            isAnimatingOut
              ? "translate-y-6 opacity-0"
              : "translate-y-0 opacity-100"
          }`}
        >
          <Card>
            JEYVANTH SILKS <br /> & <br /> SAREES
          </Card>

          <img
            src={GirlImg}
            alt="Welcome Girl"
            className="w-100 md:w-100 -mt-14"
          />
        </div>
      </div>
    </div>
  );
};

// --- Main App Component ---
function App() {
  const [activeView, setActiveView] = useState("dashboard"); // Set default to dashboard
  const [userId, setUserId] = useState(null);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [showSplashScreen, setShowSplashScreen] = useState(true); // State for splash screen

  const [birthdayEmployees, setBirthdayEmployees] = useState([]);
  const [recentDamageLogs, setRecentDamageLogs] = useState([]);
  const [notifications, setNotifications] = useState({
    hasBirthday: false,
    damageCount: 0,
  });

  useEffect(() => {
    initializeAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Effect for checking notifications (birthdays, damage logs)
  useEffect(() => {
    if (!userId) return;

    // --- Birthday Check ---
    const employeesCollectionPath = `/artifacts/${appId}/users/${userId}/employees`;
    const unsubEmployees = onSnapshot(
      collection(db, employeesCollectionPath),
      (snapshot) => {
        const employeesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        const today = new Date();
        const todayMonth = today.getMonth();
        const todayDay = today.getDate();

        const todaysBirthdays = employeesData.filter((employee) => {
          if (employee.dob) {
            const dob = new Date(employee.dob);
            return (
              dob.getUTCMonth() === todayMonth && dob.getUTCDate() === todayDay
            );
          }
          return false;
        });

        setBirthdayEmployees(todaysBirthdays);
        setNotifications((prev) => ({
          ...prev,
          hasBirthday: todaysBirthdays.length > 0,
        }));
      }
    );

    // --- Damage Log Check ---
    const stockLogsCollectionPath = `/artifacts/${appId}/users/${userId}/stock_logs`;
    const q = query(
      collection(db, stockLogsCollectionPath),
      where("type", "==", "damage")
    );
    const unsubLogs = onSnapshot(q, (snapshot) => {
      const logsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRecentDamageLogs(logsData);
      setNotifications((prev) => ({ ...prev, damageCount: logsData.length }));
    });

    return () => {
      unsubEmployees();
      unsubLogs();
    };
  }, [userId]);

  return (
    <div className="bg-[#7b4c2b] min-h-screen flex text-white font-sans">
      <style>
        {`
          @keyframes float {
            0% { transform: translateY(0px) rotate(-5deg); }
            50% { transform: translateY(-20px) rotate(5deg); }
            100% { transform: translateY(0px) rotate(-5deg); }
          }
          .animate-float {
            animation: float 3s ease-in-out infinite;
          }
          @keyframes fade-in-up {
            0% { opacity: 0; transform: translateY(10px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in-up {
            animation: fade-in-up 0.3s ease-out forwards;
          }
        `}
      </style>
      {showSplashScreen && (
        <SplashScreen onAnimationEnd={() => setShowSplashScreen(false)} />
      )}
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <MainDashboard
        activeView={activeView}
        setActiveView={setActiveView}
        userId={userId}
      />
      <div className="fixed bottom-8 right-8 z-50">
        <NotificationPanel
          isOpen={isNotificationPanelOpen}
          onClose={() => setIsNotificationPanelOpen(false)}
          birthdayEmployees={birthdayEmployees}
          damageLogs={recentDamageLogs}
        />
        <NotificationBell
          notifications={notifications}
          onClick={() => setIsNotificationPanelOpen((prev) => !prev)}
        />
      </div>
    </div>
  );
}

export default App;
