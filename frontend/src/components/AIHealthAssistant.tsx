'use client';

import React, { useState } from 'react';
import { Sparkles, Bot, AlertCircle, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import api from '@/services/api';
import { AIAnalysis, AIRecommendation } from '@/types';

interface AIHealthAssistantProps {
  onCategorySelected?: (category: string) => void;
}

export const AIHealthAssistant: React.FC<AIHealthAssistantProps> = ({ onCategorySelected }) => {
  const [symptoms, setSymptoms] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [recommendation, setRecommendation] = useState<AIRecommendation | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim()) return;

    setIsAnalyzing(true);
    setAnalysis(null);
    setRecommendation(null);

    try {
      // 1. Analyze symptoms for category
      const res: any = await api.post('/ai/analyze-health-issue', { health_issue: symptoms });
      if (res.success && res.analysis) {
        setAnalysis(res.analysis);

        if (onCategorySelected) {
          onCategorySelected(res.analysis.category);
        }

        // 2. Recommend hospitals
        const recRes: any = await api.post('/ai/recommend-hospitals', {
          health_issue: symptoms,
          department: res.analysis.category
        });
        if (recRes.success && recRes.recommendation) {
          setRecommendation(recRes.recommendation);
        }
      }
    } catch (err) {
      console.error('AI Analysis Error', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const sampleInputs = [
    "I have fever and severe cough.",
    "Persistent skin itching and red rash on my arm.",
    "Sharp knee pain and joint stiffness when walking."
  ];

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
          <Bot className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-white flex items-center space-x-2">
            <span>MediSync AI Assistant</span>
            <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 text-[10px] font-bold rounded-full border border-cyan-500/30">
              SMART NAVIGATION
            </span>
          </h3>
          <p className="text-xs text-slate-400">Describe your health concern for AI-powered category guidance & hospital matching.</p>
        </div>
      </div>

      {/* Symptom Form */}
      <form onSubmit={handleAnalyze} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Describe Your Symptoms or Health Concern
          </label>
          <textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="e.g. I have fever, severe cough, and body ache since yesterday..."
            rows={3}
            className="w-full bg-slate-900/80 border border-slate-700 focus:border-cyan-500 rounded-2xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all resize-none"
          />
        </div>

        {/* Quick Sample Prompts */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-slate-400">Try sample:</span>
          {sampleInputs.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSymptoms(sample)}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-1 rounded-full border border-slate-700 transition-colors"
            >
              "{sample}"
            </button>
          ))}
        </div>

        <button
          type="submit"
          disabled={isAnalyzing || !symptoms.trim()}
          className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center space-x-2"
        >
          {isAnalyzing ? (
            <span className="flex items-center space-x-2">
              <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <span>Analyzing Symptoms...</span>
            </span>
          ) : (
            <span className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-cyan-200" />
              <span>Analyze & Match Healthcare Category</span>
              <ArrowRight className="w-4 h-4" />
            </span>
          )}
        </button>
      </form>

      {/* AI Analysis Output */}
      {analysis && (
        <div className="mt-6 pt-6 border-t border-slate-700/60 animate-in fade-in slide-in-from-top-4 duration-300">
          {/* Department Recommendation Card */}
          <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-5 mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                Recommended Department Category
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold text-xs rounded-full border border-emerald-500/30">
                {(analysis.confidence * 100).toFixed(0)}% Confidence
              </span>
            </div>

            <h4 className="text-2xl font-black text-white mb-2">{analysis.category}</h4>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">{analysis.reasoning}</p>

            {/* Non-Diagnostic Medical Disclaimer */}
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start space-x-2 text-[11px] text-amber-300">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>{analysis.disclaimer}</span>
            </div>
          </div>

          {/* Hospital Recommendation transparent factors */}
          {recommendation && (
            <div className="bg-slate-900/90 border border-slate-700 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-teal-400">
                  Top Recommended Hospital
                </span>
                <span className="px-2.5 py-0.5 bg-cyan-500/20 text-cyan-300 font-bold text-xs rounded-full">
                  {recommendation.match_score}% Match Score
                </span>
              </div>

              <h4 className="text-lg font-bold text-white mb-2">{recommendation.recommended_hospital_name}</h4>

              <div className="space-y-1.5 mt-3">
                {recommendation.reasoning.map((reason, idx) => (
                  <div key={idx} className="flex items-center space-x-2 text-xs text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
