/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  ClipboardCheck, 
  Package, 
  AlertTriangle, 
  Calendar, 
  Box, 
  Layers, 
  CheckCircle2, 
  Loader2,
  AlertCircle,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface QCStep {
  step: string;
  description: string;
  category: 'Basic' | 'Safety' | 'Product-Specific' | 'Material-Based' | 'Handling';
}

interface ProductData {
  name: string;
  type: string;
  material: string;
  mfgDate: string;
  expDate: string;
  isFragile: boolean;
}

export default function App() {
  const [product, setProduct] = useState<ProductData>({
    name: '',
    type: 'electronic',
    material: '',
    mfgDate: '',
    expDate: '',
    isFragile: false
  });

  const [qcSteps, setQcSteps] = useState<QCStep[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const productTypes = [
    'food', 'electronic', 'medicine', 'textile', 'chemical', 'furniture', 'other'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setProduct(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const generateQC = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setQcSteps([]);

    try {
      const prompt = `
        You are an expert Industrial Quality Control (QC) Agent.
        Generate a comprehensive set of QC procedures for the following product:
        
        Product Name: ${product.name}
        Product Type: ${product.type}
        Material/Ingredients: ${product.material}
        Manufacturing Date: ${product.mfgDate}
        Expiry Date: ${product.expDate}
        Fragile: ${product.isFragile ? 'Yes' : 'No'}
        
        Requirements:
        1. Analyze the product type and material.
        2. Generate specific QC steps including:
           - Basic checks (labeling, packaging)
           - Safety checks
           - Product-specific tests (e.g., voltage for electronics, taste/purity for food)
           - Material-based checks
           - Special handling instructions if fragile
        3. Ensure the output is clear, structured, and practical for an industrial setting.
        
        Return the result as a JSON array of objects, where each object has:
        - "step": A short title for the QC step.
        - "description": A detailed explanation of what to check.
        - "category": One of ["Basic", "Safety", "Product-Specific", "Material-Based", "Handling"].
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                step: { type: Type.STRING },
                description: { type: Type.STRING },
                category: { 
                  type: Type.STRING,
                  enum: ["Basic", "Safety", "Product-Specific", "Material-Based", "Handling"]
                }
              },
              required: ["step", "description", "category"]
            }
          }
        }
      });

      const result = JSON.parse(response.text || '[]');
      setQcSteps(result);
    } catch (err) {
      console.error("Error generating QC:", err);
      setError("Failed to generate QC procedures. Please check your inputs and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] font-sans text-[#1A1A1A] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-12 flex items-center gap-4">
          <div className="bg-[#141414] p-3 rounded-xl shadow-lg">
            <ClipboardCheck className="text-white w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#141414]">QC Agent</h1>
            <p className="text-[#8E9299] text-sm font-medium uppercase tracking-wider">Intelligent Quality Control Generator</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Input Form */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-5"
          >
            <div className="bg-white rounded-2xl shadow-sm border border-[#E5E5E5] p-6 md:p-8">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Box className="w-5 h-5 text-[#141414]" />
                Product Specifications
              </h2>
              
              <form onSubmit={generateQC} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-[#8E9299] mb-2">Product Name</label>
                  <input
                    required
                    type="text"
                    name="name"
                    value={product.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Smart Watch X1"
                    className="w-full bg-[#F9F9F9] border border-[#E5E5E5] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#141414] transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-[#8E9299] mb-2">Type</label>
                    <select
                      name="type"
                      value={product.type}
                      onChange={handleInputChange}
                      className="w-full bg-[#F9F9F9] border border-[#E5E5E5] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#141414] transition-all"
                    >
                      {productTypes.map(t => (
                        <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-[#8E9299] mb-2">Material</label>
                    <input
                      required
                      type="text"
                      name="material"
                      value={product.material}
                      onChange={handleInputChange}
                      placeholder="e.g. Aluminum, Glass"
                      className="w-full bg-[#F9F9F9] border border-[#E5E5E5] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#141414] transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-[#8E9299] mb-2">Mfg Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E9299]" />
                      <input
                        required
                        type="date"
                        name="mfgDate"
                        value={product.mfgDate}
                        onChange={handleInputChange}
                        className="w-full bg-[#F9F9F9] border border-[#E5E5E5] rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#141414] transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-[#8E9299] mb-2">Exp Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E9299]" />
                      <input
                        type="date"
                        name="expDate"
                        value={product.expDate}
                        onChange={handleInputChange}
                        className="w-full bg-[#F9F9F9] border border-[#E5E5E5] rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#141414] transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-[#F9F9F9] rounded-xl border border-[#E5E5E5]">
                  <input
                    type="checkbox"
                    id="isFragile"
                    name="isFragile"
                    checked={product.isFragile}
                    onChange={handleInputChange}
                    className="w-5 h-5 rounded border-[#E5E5E5] text-[#141414] focus:ring-[#141414]"
                  />
                  <label htmlFor="isFragile" className="text-sm font-medium flex items-center gap-2 cursor-pointer">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Fragile Product
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#141414] text-white font-bold py-4 rounded-xl shadow-lg hover:bg-[#2A2A2A] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyzing Specifications...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Generate QC Procedures
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>

          {/* Results Display */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-4 mb-6"
                >
                  <AlertCircle className="text-red-500 w-6 h-6 shrink-0" />
                  <div>
                    <h3 className="text-red-800 font-bold">Generation Error</h3>
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                </motion.div>
              )}

              {qcSteps.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <FileText className="w-5 h-5 text-[#141414]" />
                      QC Procedure Report
                    </h2>
                    <span className="bg-[#141414] text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest">
                      {qcSteps.length} Steps Generated
                    </span>
                  </div>

                  {qcSteps.map((step, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-2xl shadow-sm border border-[#E5E5E5] p-5 flex gap-5 group hover:border-[#141414] transition-colors"
                    >
                      <div className="flex flex-col items-center shrink-0">
                        <div className="w-10 h-10 rounded-full bg-[#F9F9F9] border border-[#E5E5E5] flex items-center justify-center font-mono text-sm font-bold group-hover:bg-[#141414] group-hover:text-white transition-colors">
                          {index + 1}
                        </div>
                        <div className="w-[1px] h-full bg-[#E5E5E5] mt-2 group-last:hidden" />
                      </div>
                      <div className="pb-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                            step.category === 'Basic' ? 'bg-blue-100 text-blue-700' :
                            step.category === 'Safety' ? 'bg-red-100 text-red-700' :
                            step.category === 'Product-Specific' ? 'bg-purple-100 text-purple-700' :
                            step.category === 'Material-Based' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {step.category}
                          </span>
                        </div>
                        <h3 className="font-bold text-[#141414] mb-1">{step.step}</h3>
                        <p className="text-[#555] text-sm leading-relaxed">{step.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : !loading && !error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-white rounded-2xl border border-dashed border-[#E5E5E5]"
                >
                  <div className="bg-[#F9F9F9] p-6 rounded-full mb-6">
                    <Layers className="w-12 h-12 text-[#8E9299]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#141414] mb-2">Ready to Generate</h3>
                  <p className="text-[#8E9299] max-w-xs mx-auto">
                    Fill in the product specifications and click the button to generate a custom quality control procedure.
                  </p>
                </motion.div>
              )}

              {loading && (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-white rounded-2xl p-5 border border-[#E5E5E5] animate-pulse flex gap-5">
                      <div className="w-10 h-10 rounded-full bg-[#F9F9F9] shrink-0" />
                      <div className="flex-1 space-y-3">
                        <div className="h-3 bg-[#F9F9F9] rounded w-20" />
                        <div className="h-4 bg-[#F9F9F9] rounded w-1/2" />
                        <div className="h-3 bg-[#F9F9F9] rounded w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
