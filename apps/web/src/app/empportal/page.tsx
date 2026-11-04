'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, getUserSession } from '@/lib/auth-context';
import {
  getEmployees,
  fetchEmployees,
  addLeaveRecord,
  Employee,
  LeaveRecord,
} from '@/lib/employee-store';
import { api } from '@/lib/api-client';
import { getTestDrives, TestDrive } from '@/lib/test-drive-store';
import { Modal } from '@/components/ui/Modal';
import {
  Filter,
  Users,
  Gauge,
  Car,
  BadgePercent,
  Layers,
  CreditCard,
  FileText,
  BarChart3,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  ShieldCheck,
  Send,
  Briefcase,
  Sparkles,
} from 'lucide-react';

export default function EmployeePortalPage() {
  const router = useRouter();
  const { userContext, logout } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [testDrives, setTestDrives] = useState<TestDrive[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Leave Request Form State
  const [leaveForm, setLeaveForm] = useState({
    leaveType: 'casual' as 'casual' | 'sick' | 'paid' | 'emergency',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    days: 1,
    reason: '',
  });

  useEffect(() => {
    setIsMounted(true);
    setEmployees(getEmployees());
    setLeads(api.getLeads());
    setTestDrives(getTestDrives());
    setCustomers(api.getCustomers());
    setVehicles(api.getVehicles());
    setDeals(api.getDeals());

    fetchEmployees().then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        setEmployees(data);
      }
    });

    const handleChanged = () => {
      setEmployees(getEmployees());
      setLeads(api.getLeads());
      setTestDrives(getTestDrives());
      setCustomers(api.getCustomers());
      setVehicles(api.getVehicles());
      setDeals(api.getDeals());
    };

    window.addEventListener('crm-employees-changed', handleChanged);
    window.addEventListener('crm-testdrives-changed', handleChanged);
    return () => {
      window.removeEventListener('crm-employees-changed', handleChanged);
      window.removeEventListener('crm-testdrives-changed', handleChanged);
    };
  }, []);

  const session = isMounted ? getUserSession() : null;

  // Resolve current active employee
  const currentEmp: Employee = useMemo(() => {
    if (!session?.employeeId && !session?.employeeCode && !session?.email) {
      return {
        id: 'emp-fallback',
        employeeCode: 'EMP-001',
        fullName: session?.fullName || 'Staff Member',
        email: session?.email || 'staff@dealership.com',
        phone: session?.phone || '+91 98000 00000',
        designation: 'Sales Consultant',
        department: 'Sales',
        branch: 'Apex Downtown Flagship',
        joiningDate: new Date().toISOString().split('T')[0],
        salary: '₹6,00,000',
        status: 'active',
        password: '',
        leaveBalance: {
          casual: { total: 12, used: 0 },
          sick: { total: 7, used: 0 },
          paid: { total: 18, used: 0 },
        },
        leaveHistory: [],
        accessControl: session?.accessControl || {
          pipeline: true,
          customers: true,
          inventory: true,
          procurement: false,
          deals: true,
          finance: false,
          testDrives: true,
          documents: false,
          reports: false,
          settings: false,
        },
      };
    }

    const found = employees.find(
      (e) =>
        e.id === session.employeeId ||
        (session.employeeCode && e.employeeCode.toLowerCase() === session.employeeCode.toLowerCase()) ||
        (session.email && e.email.toLowerCase() === session.email.toLowerCase())
    );

    if (found) return found;

    return {
      id: session.employeeId || 'emp-current',
      employeeCode: session.employeeCode || 'EMP-001',
      fullName: session.fullName || 'Staff Member',
      email: session.email || 'staff@dealership.com',
      phone: session.phone || '+91 98000 00000',
      designation: 'Sales Executive',
      department: 'Sales',
      branch: 'Apex Downtown Flagship',
      joiningDate: new Date().toISOString().split('T')[0],
      salary: '',
      status: 'active',
      password: '',
      avatarUrl: session.avatarUrl,
      leaveBalance: {
        casual: { total: 12, used: 0 },
        sick: { total: 7, used: 0 },
        paid: { total: 18, used: 0 },
      },
      leaveHistory: [],
      accessControl: session.accessControl || {
        pipeline: true,
        customers: true,
        inventory: true,
        procurement: false,
        deals: true,
        finance: false,
        testDrives: true,
        documents: false,
        reports: false,
        settings: false,
      },
    };
  }, [session, employees]);

  const access = currentEmp.accessControl;

  // Personalized count calculations
  const myAssignedLeads = useMemo(() => {
    return leads.filter(
      (l) =>
        l.assignedTo === currentEmp.id ||
        l.assigneeName?.toLowerCase().includes(currentEmp.fullName.toLowerCase()) ||
        true // fallback to count total active available if not individually assigned
    ).slice(0, 15);
  }, [leads, currentEmp]);

  const myTestDrives = useMemo(() => {
    return testDrives.filter(
      (td) =>
        td.assignedStaff?.toLowerCase().includes(currentEmp.fullName.toLowerCase()) ||
        td.status === 'scheduled'
    );
  }, [testDrives, currentEmp]);

  const totalLeaveAvailable =
    (currentEmp.leaveBalance?.casual.total || 12) -
    (currentEmp.leaveBalance?.casual.used || 0) +
    ((currentEmp.leaveBalance?.sick.total || 7) - (currentEmp.leaveBalance?.sick.used || 0)) +
    ((currentEmp.leaveBalance?.paid.total || 18) - (currentEmp.leaveBalance?.paid.used || 0));

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveForm.reason.trim()) {
      showToast('Please provide a reason for your leave request.');
      return;
    }

    const success = addLeaveRecord(currentEmp.id, {
      leaveType: leaveForm.leaveType,
      startDate: leaveForm.startDate,
      endDate: leaveForm.endDate,
      days: Number(leaveForm.days) || 1,
      reason: leaveForm.reason.trim(),
      status: 'pending',
    });

    if (success) {
      setEmployees(getEmployees());
      setIsLeaveModalOpen(false);
      showToast('Leave request submitted successfully for supervisor approval.');
      setLeaveForm({
        leaveType: 'casual',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        days: 1,
        reason: '',
      });
    } else {
      showToast('Failed to record leave request. Please contact your manager.');
    }
  };

  // Only cards for permissions granted to this employee
  const authorizedModules = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      description: string;
      href: string;
      icon: any;
      color: string;
      bg: string;
      badgeText?: string;
    }> = [];

    if (access?.pipeline) {
      list.push({
        id: 'pipeline',
        title: 'Lead Pipeline',
        description: 'Track prospect enquiries, update deal stages, book consultations, and log contact activity.',
        href: '/crm/leads',
        icon: Filter,
        color: '#4F46E5',
        bg: '#EEF2FF',
        badgeText: `${leads.length} Enquiries`,
      });
    }

    if (access?.customers) {
      list.push({
        id: 'customers',
        title: 'Customer Directory',
        description: 'Browse client profiles, contact numbers, Aadhaar/PAN KYC documentation and vehicle purchase history.',
        href: '/crm/customers',
        icon: Users,
        color: '#0284C7',
        bg: '#F0F9FF',
        badgeText: `${customers.length} Clients`,
      });
    }

    if (access?.testDrives) {
      list.push({
        id: 'test-drives',
        title: 'Showroom Test Drives',
        description: 'Schedule demo sprints, record start/end odometer mileage readings, and log customer feedback.',
        href: '/test-drives',
        icon: Gauge,
        color: '#10B981',
        bg: '#ECFDF5',
        badgeText: `${myTestDrives.length} Scheduled`,
      });
    }

    if (access?.inventory) {
      list.push({
        id: 'inventory',
        title: 'Vehicle Inventory',
        description: 'Live showroom & yard vehicle stock, transmission & fuel variants, color matrix and asking prices.',
        href: '/vehicles',
        icon: Car,
        color: '#F59E0B',
        bg: '#FFFBEB',
        badgeText: `${vehicles.length} In-Stock`,
      });
    }

    if (access?.deals) {
      list.push({
        id: 'deals',
        title: 'Sales Deals Desk',
        description: 'Commercial deal negotiation, down payments, on-road quotation locking, and delivery scheduling.',
        href: '/sales/deals',
        icon: BadgePercent,
        color: '#8B5CF6',
        bg: '#F5F3FF',
        badgeText: `${deals.length} Active Deals`,
      });
    }

    if (access?.procurement) {
      list.push({
        id: 'procurement',
        title: 'Vehicle Procurement',
        description: 'Used car exchange evaluation engine, multi-point vehicle inspection checklists and refurbishment intake.',
        href: '/vehicles/procurement',
        icon: Layers,
        color: '#EC4899',
        bg: '#FDF2F8',
      });
    }

    if (access?.finance) {
      list.push({
        id: 'finance',
        title: 'Customer Finance & Receipts',
        description: 'Down payment money receipts, bank loan approvals, and customer payment verification.',
        href: '/finance',
        icon: CreditCard,
        color: '#059669',
        bg: '#ECFDF5',
      });
    }

    if (access?.documents) {
      list.push({
        id: 'documents',
        title: 'Invoices & Documents',
        description: 'Official GST vehicle tax invoices, RTO Form 20/21 files, and digital delivery gate passes.',
        href: '/documents',
        icon: FileText,
        color: '#0284C7',
        bg: '#F0F9FF',
      });
    }

    if (access?.reports) {
      list.push({
        id: 'reports',
        title: 'Performance Reports',
        description: 'Review personal sales velocity, enquiry conversion ratios, and test-drive activity summaries.',
        href: '/reports',
        icon: BarChart3,
        color: '#6366F1',
        bg: '#EEF2FF',
      });
    }

    return list;
  }, [access, leads.length, customers.length, myTestDrives.length, vehicles.length, deals.length]);

  if (!isMounted) {
    return (
      <div style={{ paddingBottom: '3.5rem' }}>
        {/* Skeleton Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #4F46E5 0%, #3730A3 60%, #1E1B4B 100%)',
            borderRadius: '24px',
            padding: '28px 32px',
            color: '#FFFFFF',
            marginBottom: '26px',
            minHeight: '140px',
            boxShadow: '0 10px 30px rgba(79, 70, 229, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
          }}
        >
          <div
            style={{
              width: '74px',
              height: '74px',
              borderRadius: '20px',
              backgroundColor: 'rgba(255,255,255,0.2)',
            }}
          />
          <div style={{ flex: 1 }}>
            <div
              style={{
                width: '240px',
                height: '28px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255,255,255,0.25)',
                marginBottom: '10px',
              }}
            />
            <div
              style={{
                width: '340px',
                maxWidth: '80%',
                height: '16px',
                borderRadius: '6px',
                backgroundColor: 'rgba(255,255,255,0.18)',
              }}
            />
          </div>
        </div>

        {/* Skeleton Metric Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '30px',
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                height: '88px',
                borderRadius: '18px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                padding: '18px 20px',
              }}
            />
          ))}
        </div>

        {/* Skeleton Workspaces Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
            gap: '18px',
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                height: '190px',
                borderRadius: '20px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '3.5rem' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '24px',
            background: '#0F172A',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '12px',
            fontSize: '0.88rem',
            fontWeight: 700,
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            zIndex: 100000,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={16} style={{ color: '#10B981' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Welcome Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #4F46E5 0%, #3730A3 60%, #1E1B4B 100%)',
          borderRadius: '24px',
          padding: '28px 32px',
          color: '#FFFFFF',
          marginBottom: '26px',
          boxShadow: '0 10px 30px rgba(79, 70, 229, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Ambient background accent */}
        <div
          style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '240px',
            height: '240px',
            background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', zIndex: 1 }}>
          {/* Avatar Portrait */}
          <div
            style={{
              width: '74px',
              height: '74px',
              borderRadius: '20px',
              backgroundColor: '#FFFFFF',
              color: '#4F46E5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.6rem',
              boxShadow: '0 6px 18px rgba(0,0,0,0.2)',
              overflow: 'hidden',
              flexShrink: 0,
              border: '2.5px solid rgba(255,255,255,0.85)',
            }}
          >
            {currentEmp.avatarUrl ? (
              <img
                src={currentEmp.avatarUrl}
                alt={currentEmp.fullName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              currentEmp.fullName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()
            )}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                Hello, {currentEmp.fullName} 👋
              </h1>
              <span
                style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(4px)',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                }}
              >
                {currentEmp.employeeCode || 'EMP-001'}
              </span>
              <span
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.25)',
                  color: '#6EE7B7',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                Active Staff Session
              </span>
            </div>

            <p style={{ margin: 0, fontSize: '0.88rem', opacity: 0.9, fontWeight: 500 }}>
              {currentEmp.designation} • {currentEmp.department} Department • {currentEmp.branch}
            </p>
          </div>
        </div>

        {/* Quick Leave Request Action */}
        <div style={{ zIndex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setIsLeaveModalOpen(true)}
            style={{
              padding: '10px 20px',
              borderRadius: '12px',
              backgroundColor: '#FFFFFF',
              color: '#3730A3',
              fontSize: '0.84rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              transition: 'all 0.15s ease',
            }}
          >
            <Calendar size={15} />
            <span>Apply for Leave</span>
          </button>
        </div>
      </div>

      {/* Staff Quick Status Metric Cards: Strictly only for assigned employee privileges */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '30px',
        }}
      >
        {/* Metric 1: My Assigned Leads (only if pipeline access is granted) */}
        {access?.pipeline && (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '18px',
              padding: '18px 20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: '#EEF2FF',
                color: '#4F46E5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Filter size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                Enquiries & Leads
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
                {leads.length}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#10B981', fontWeight: 600, marginTop: '2px' }}>
                Active follow-up queue
              </div>
            </div>
          </div>
        )}

        {/* Metric 2: Scheduled Test Drives (only if test drive access is granted) */}
        {access?.testDrives && (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '18px',
              padding: '18px 20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: '#ECFDF5',
                color: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Gauge size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                Test Drives
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
                {myTestDrives.length}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600, marginTop: '2px' }}>
                Demo sprints scheduled
              </div>
            </div>
          </div>
        )}

        {/* Metric 3: Customers Directory (only if customer access is granted) */}
        {access?.customers && (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '18px',
              padding: '18px 20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: '#F0F9FF',
                color: '#0284C7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Users size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                Customer Profiles
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
                {customers.length}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600, marginTop: '2px' }}>
                Direct client records
              </div>
            </div>
          </div>
        )}

        {/* Metric 4: Inventory Stock (only if inventory access is granted) */}
        {access?.inventory && (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '18px',
              padding: '18px 20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: '#FFFBEB',
                color: '#D97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Car size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                Showroom Inventory
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
                {vehicles.length}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600, marginTop: '2px' }}>
                Cars ready for delivery
              </div>
            </div>
          </div>
        )}

        {/* Metric 5: Leave Balance Available (Staff Member Personal Balance) */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '18px',
            padding: '18px 20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: '#F8FAFC',
              color: '#475569',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Calendar size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              My Leave Balance
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
              {totalLeaveAvailable} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748B' }}>days</span>
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600, marginTop: '2px' }}>
              Casual: {(currentEmp.leaveBalance?.casual.total || 12) - (currentEmp.leaveBalance?.casual.used || 0)} • Sick: {(currentEmp.leaveBalance?.sick.total || 7) - (currentEmp.leaveBalance?.sick.used || 0)}
            </div>
          </div>
        </div>

        {/* Metric 6: Assigned Workspaces Count */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '18px',
            padding: '18px 20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: '#FDF2F8',
              color: '#DB2777',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShieldCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Granted Privileges
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
              {authorizedModules.length} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748B' }}>Modules</span>
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600, marginTop: '2px' }}>
              Controlled by administrator
            </div>
          </div>
        </div>
      </div>

      {/* Section: Authorized Workspaces Grid */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              My Authorized Workspaces
            </h2>
            <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '3px 0 0 0', fontWeight: 500 }}>
              Access modules assigned to your profile by dealership administration
            </p>
          </div>
        </div>

        {authorizedModules.length === 0 ? (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1.5px dashed #CBD5E1',
              borderRadius: '18px',
              padding: '40px 20px',
              textAlign: 'center',
              color: '#64748B',
            }}
          >
            <ShieldCheck size={36} style={{ color: '#94A3B8', margin: '0 auto 12px' }} />
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#1E293B', margin: '0 0 4px 0' }}>
              No Custom Modules Assigned Yet
            </h4>
            <p style={{ fontSize: '0.82rem', margin: 0, maxWidth: '420px', marginInline: 'auto' }}>
              Your administrator has not granted any module permissions to your account yet. Please contact your branch manager to enable pipeline or directory access.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
              gap: '18px',
            }}
          >
            {authorizedModules.map((m) => {
              const IconComp = m.icon;
              return (
                <div
                  key={m.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '20px',
                    padding: '22px 24px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.18s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)';
                    e.currentTarget.style.borderColor = '#CBD5E1';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)';
                    e.currentTarget.style.borderColor = '#E2E8F0';
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '14px',
                          backgroundColor: m.bg,
                          color: m.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <IconComp size={24} />
                      </div>

                      {m.badgeText && (
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '999px',
                            backgroundColor: '#F1F5F9',
                            color: '#334155',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                          }}
                        >
                          {m.badgeText}
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: '1.08rem', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>
                      {m.title}
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: '#64748B', lineHeight: 1.5, margin: '0 0 18px 0' }}>
                      {m.description}
                    </p>
                  </div>

                  <Link
                    href={m.href}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '10px 18px',
                      borderRadius: '12px',
                      backgroundColor: m.color,
                      color: '#FFFFFF',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      textDecoration: 'none',
                      boxShadow: `0 4px 12px ${m.color}35`,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>Open {m.title.split(' ')[0]}</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section: Leave Balance & History */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '20px',
          padding: '24px 28px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Leave Balance & Request Tracker
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '3px 0 0 0', fontWeight: 500 }}>
              Track available paid, sick, and casual days and submit time-off requests
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsLeaveModalOpen(true)}
            style={{
              padding: '8px 18px',
              borderRadius: '10px',
              backgroundColor: '#4F46E5',
              color: '#FFFFFF',
              fontSize: '0.82rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Plus size={14} />
            <span>Request Time Off</span>
          </button>
        </div>

        {/* 3 Leave Tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '22px' }}>
          <div style={{ padding: '16px', borderRadius: '14px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Casual Leave</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
              {(currentEmp.leaveBalance?.casual.total || 12) - (currentEmp.leaveBalance?.casual.used || 0)}{' '}
              <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#64748B' }}>/ {currentEmp.leaveBalance?.casual.total || 12} days</span>
            </div>
          </div>

          <div style={{ padding: '16px', borderRadius: '14px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Sick Leave</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
              {(currentEmp.leaveBalance?.sick.total || 7) - (currentEmp.leaveBalance?.sick.used || 0)}{' '}
              <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#64748B' }}>/ {currentEmp.leaveBalance?.sick.total || 7} days</span>
            </div>
          </div>

          <div style={{ padding: '16px', borderRadius: '14px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Paid Annual Leave</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
              {(currentEmp.leaveBalance?.paid.total || 18) - (currentEmp.leaveBalance?.paid.used || 0)}{' '}
              <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#64748B' }}>/ {currentEmp.leaveBalance?.paid.total || 18} days</span>
            </div>
          </div>
        </div>

        {/* Leave Request History Table */}
        <div>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1E293B', marginBottom: '10px' }}>
            Recent Leave Applications
          </h4>

          {(!currentEmp.leaveHistory || currentEmp.leaveHistory.length === 0) ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#94A3B8', fontSize: '0.84rem' }}>
              No leave applications submitted yet. Click "Request Time Off" above when you need time away.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {currentEmp.leaveHistory.map((l) => (
                <div
                  key={l.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #F1F5F9',
                    fontSize: '0.82rem',
                    flexWrap: 'wrap',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: '#EEF2FF',
                        color: '#4F46E5',
                        fontWeight: 700,
                        textTransform: 'capitalize',
                        fontSize: '0.75rem',
                      }}
                    >
                      {l.leaveType}
                    </span>
                    <span style={{ fontWeight: 600, color: '#0F172A' }}>
                      {l.startDate} to {l.endDate} ({l.days} {l.days === 1 ? 'day' : 'days'})
                    </span>
                    <span style={{ color: '#64748B' }}>• {l.reason}</span>
                  </div>

                  <span
                    style={{
                      padding: '3px 10px',
                      borderRadius: '999px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      textTransform: 'capitalize',
                      backgroundColor:
                        l.status === 'approved' ? '#ECFDF5' : l.status === 'pending' ? '#FFFBEB' : '#FEF2F2',
                      color:
                        l.status === 'approved' ? '#059669' : l.status === 'pending' ? '#D97706' : '#DC2626',
                    }}
                  >
                    {l.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Apply for Leave Modal */}
      <Modal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        title="Apply for Employee Leave"
        maxWidth="520px"
      >
        <form onSubmit={handleApplyLeave} style={{ padding: '8px 4px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
              Leave Type <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <select
              value={leaveForm.leaveType}
              onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value as any })}
              style={{
                width: '100%',
                height: '42px',
                padding: '0 12px',
                borderRadius: '10px',
                border: '1.5px solid #CBD5E1',
                fontSize: '0.86rem',
                outline: 'none',
                backgroundColor: '#FFFFFF',
              }}
            >
              <option value="casual">Casual Leave ({ (currentEmp.leaveBalance?.casual.total || 12) - (currentEmp.leaveBalance?.casual.used || 0) } days left)</option>
              <option value="sick">Sick Leave ({ (currentEmp.leaveBalance?.sick.total || 7) - (currentEmp.leaveBalance?.sick.used || 0) } days left)</option>
              <option value="paid">Paid Annual Leave ({ (currentEmp.leaveBalance?.paid.total || 18) - (currentEmp.leaveBalance?.paid.used || 0) } days left)</option>
              <option value="emergency">Emergency Unpaid Leave</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
                Start Date
              </label>
              <input
                type="date"
                required
                value={leaveForm.startDate}
                onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                style={{
                  width: '100%',
                  height: '42px',
                  padding: '0 12px',
                  borderRadius: '10px',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '0.86rem',
                  outline: 'none',
                  backgroundColor: '#FFFFFF',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
                End Date
              </label>
              <input
                type="date"
                required
                value={leaveForm.endDate}
                onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                style={{
                  width: '100%',
                  height: '42px',
                  padding: '0 12px',
                  borderRadius: '10px',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '0.86rem',
                  outline: 'none',
                  backgroundColor: '#FFFFFF',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
              Duration (Number of Days)
            </label>
            <input
              type="number"
              min="1"
              max="30"
              required
              value={leaveForm.days}
              onChange={(e) => setLeaveForm({ ...leaveForm, days: Number(e.target.value) || 1 })}
              style={{
                width: '100%',
                height: '42px',
                padding: '0 12px',
                borderRadius: '10px',
                border: '1.5px solid #CBD5E1',
                fontSize: '0.86rem',
                outline: 'none',
                backgroundColor: '#FFFFFF',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
              Reason for Absence <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <textarea
              required
              rows={3}
              value={leaveForm.reason}
              onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
              placeholder="e.g. Personal family engagement or health check-up..."
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1.5px solid #CBD5E1',
                fontSize: '0.86rem',
                outline: 'none',
                backgroundColor: '#FFFFFF',
                resize: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={() => setIsLeaveModalOpen(false)}
              style={{
                padding: '10px 20px',
                borderRadius: '10px',
                border: '1.5px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                color: '#475569',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              style={{
                padding: '10px 24px',
                borderRadius: '10px',
                backgroundColor: '#4F46E5',
                color: '#FFFFFF',
                fontSize: '0.84rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Send size={14} />
              <span>Submit Request</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
