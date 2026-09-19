'use client';

import React from 'react';
import Link from 'next/link';
import {
  Activity, Clock, Sparkles, MapPin, ShieldAlert, FileText,
  UserCheck, HeartPulse, Building2, Pill, CheckCircle2, ArrowRight, Star
} from 'lucide-react';

export default function Home() {
  return (
    <div className="space-y-24 pb-20">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 lg:pt-20 pb-16">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-cyan-500/20 via-teal-400/20 to-emerald-400/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-700 font-semibold text-xs mb-8">
            <Sparkles className="w-4 h-4 text-cyan-600" />
            <span>AI-POWERED HEALTHCARE COORDINATION PLATFORM</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-none max-w-4xl mx-auto">
            MediSync
          </h1>
          <p className="mt-4 text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-cyan-700 via-teal-700 to-emerald-700 bg-clip-text text-transparent">
            "Smarter Healthcare. Less Waiting."
          </p>

          <p className="mt-6 text-slate-600 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            Eliminate hospital queue congestion, receive AI-guided department recommendations, track your token position live, and access digital prescriptions in one unified platform.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white font-bold text-base rounded-2xl shadow-xl shadow-cyan-600/25 transition-all flex items-center justify-center space-x-2"
            >
              <span>Book Your First Token</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-base rounded-2xl shadow-sm transition-all text-center"
            >
              Sign In to Dashboard
            </Link>
          </div>

          {/* Quick Stats Bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto pt-8 border-t border-slate-200/80">
            <div>
              <span className="block text-3xl font-black text-slate-900">65%</span>
              <span className="text-xs text-slate-500 font-medium">Reduced Wait Times</span>
            </div>
            <div>
              <span className="block text-3xl font-black text-cyan-700">Real-Time</span>
              <span className="text-xs text-slate-500 font-medium">Queue Synchronization</span>
            </div>
            <div>
              <span className="block text-3xl font-black text-slate-900">4 Roles</span>
              <span className="text-xs text-slate-500 font-medium">Patient, Doctor, Admin, Pharmacy</span>
            </div>
            <div>
              <span className="block text-3xl font-black text-emerald-700">100%</span>
              <span className="text-xs text-slate-500 font-medium">Digital Prescriptions</span>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-600">Unified Workflow</h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">How MediSync Works</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-lg relative">
            <div className="w-12 h-12 rounded-2xl bg-cyan-100 text-cyan-700 font-bold text-xl flex items-center justify-center mb-6">1</div>
            <h4 className="text-xl font-bold text-slate-900 mb-3">AI Symptom Categorization</h4>
            <p className="text-slate-600 text-sm leading-relaxed">
              Describe your health issue in plain text. MediSync AI categorizes the appropriate hospital department with transparent non-diagnostic reasoning.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-lg relative">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 font-bold text-xl flex items-center justify-center mb-6">2</div>
            <h4 className="text-xl font-bold text-slate-900 mb-3">Hospital Search & Token Booking</h4>
            <p className="text-slate-600 text-sm leading-relaxed">
              Compare nearby hospitals on Leaflet maps, check estimated waiting times, pick an available doctor, and claim your digital token code instantly.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-lg relative">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 font-bold text-xl flex items-center justify-center mb-6">3</div>
            <h4 className="text-xl font-bold text-slate-900 mb-3">Live Tracking & Emergency Recalculation</h4>
            <p className="text-slate-600 text-sm leading-relaxed">
              Watch your queue position update automatically via WebSockets. If an emergency consultation occurs, ETAs recalculate dynamically.
            </p>
          </div>
        </div>
      </section>

      {/* SMART QUEUE FEATURE HIGHLIGHT */}
      <section className="bg-gradient-to-r from-slate-900 to-cyan-950 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 font-bold text-xs rounded-full border border-cyan-500/30">
              CORE INNOVATION
            </span>
            <h3 className="text-3xl sm:text-5xl font-extrabold mt-4 leading-tight">
              Smart Queue Management & Emergency Interruption
            </h3>
            <p className="text-slate-300 text-base mt-4 leading-relaxed">
              Never sit blindly in crowded waiting rooms again. MediSync calculates exact estimated consultation times using real-time doctor progress algorithms.
            </p>

            <ul className="space-y-3 mt-6">
              <li className="flex items-center space-x-3 text-sm text-slate-200">
                <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                <span>Automatic position & ETA countdown updates without page refresh</span>
              </li>
              <li className="flex items-center space-x-3 text-sm text-slate-200">
                <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                <span>Emergency case priority injection with immediate downstream ETA recalculation</span>
              </li>
              <li className="flex items-center space-x-3 text-sm text-slate-200">
                <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                <span>Instant push notifications when your token is called by the doctor</span>
              </li>
            </ul>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 p-6 rounded-3xl shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-700">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Live Demo Preview</span>
              <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 text-xs font-bold rounded-full border border-amber-500/30">
                EMERGENCY ALERT
              </span>
            </div>
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-xs text-slate-400 block">Your Token</span>
                <span className="text-3xl font-black text-cyan-400">A-27</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Patients Ahead</span>
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Updated ETA</span>
                <span className="text-2xl font-bold text-emerald-400">24 mins</span>
              </div>
            </div>
            <p className="text-xs text-amber-300 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
              "Queue updated because an emergency consultation was added. Your estimated wait shifted to 31 mins."
            </p>
          </div>
        </div>
      </section>

      {/* ROLE BENEFITS GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-600">Multi-Stakeholder Ecosystem</h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">Tailored Dashboards for Every Role</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Patient */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md hover:shadow-xl transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
              <HeartPulse className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-lg text-slate-900 mb-2">Patient Benefits</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              AI health issue categorization, hospital distance maps, live token tracking, digital prescriptions & medical history access.
            </p>
          </div>

          {/* Doctor */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md hover:shadow-xl transition-all">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
              <UserCheck className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-lg text-slate-900 mb-2">Doctor Benefits</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              One-click Call Next Token, emergency queue injection controls, patient history drawer, and digital prescription builder.
            </p>
          </div>

          {/* Hospital Admin */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md hover:shadow-xl transition-all">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4">
              <Building2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-lg text-slate-900 mb-2">Hospital Benefits</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Live department queue monitoring, doctor schedule availability, emergency case overrides, and real-time operational analytics.
            </p>
          </div>

          {/* Pharmacy */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md hover:shadow-xl transition-all">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
              <Pill className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-lg text-slate-900 mb-2">Pharmacy Benefits</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Real-time digital prescription fulfillment stream, medicine inventory stock updates, and prescription status tracking.
            </p>
          </div>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 text-white rounded-3xl p-10 sm:p-14 shadow-2xl relative overflow-hidden">
          <h3 className="text-3xl sm:text-5xl font-black">Experience Smarter Healthcare Coordination</h3>
          <p className="text-cyan-100 text-base max-w-xl mx-auto mt-4">
            Join MediSync today to navigate hospital queues effortlessly and streamline your medical care.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="px-8 py-4 bg-white text-cyan-800 hover:bg-slate-100 font-extrabold text-base rounded-2xl shadow-lg transition-all"
            >
              Create Account
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 bg-cyan-700/50 hover:bg-cyan-700/80 border border-white/20 text-white font-extrabold text-base rounded-2xl transition-all"
            >
              Sign In Demo Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
