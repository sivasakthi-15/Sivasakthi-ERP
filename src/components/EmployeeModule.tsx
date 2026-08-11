import { safeSetItem, safeGetItem, safeRemoveItem } from '../utils/safeStorage';
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Users, UserPlus, Briefcase, Calendar, DollarSign, Download, 
  Printer, Check, Plus, Trash2, Shield, Settings, Eye, FileText
} from 'lucide-react';
import { api } from '../services/api';

interface Employee {
  id: string;
  name: string;
  mobile: string;
  email: string;
  department: string;
  designation: string;
  doj: string;
  baseSalary: number;
  pfEnabled: boolean;
  esiEnabled: boolean;
  profTaxEnabled: boolean;
  status: 'active' | 'inactive';
}

interface AttendanceLog {
  employeeId: string;
  date: string;
  status: 'Present' | 'Absent' | 'Half Day' | 'On Leave';
  shift: 'General' | 'Morning' | 'Night';
}

export const EmployeeModule: React.FC = () => {
  const { currentBusiness } = useApp();
  const bizId = currentBusiness?.id || 'all';

  // State
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const stored = safeGetItem(`${bizId}_employees`);
    if (stored) return JSON.parse(stored);
    return [
      { id: 'emp_1', name: 'Ramasamy K', mobile: '9443210987', email: 'ramasamy@sivasakthi.com', department: 'Sales', designation: 'Senior Accountant', doj: '2020-04-15', baseSalary: 35000, pfEnabled: true, esiEnabled: true, profTaxEnabled: true, status: 'active' },
      { id: 'emp_2', name: 'Siva G', mobile: '9840123456', email: 'siva.g@sivasakthi.com', department: 'Warehouse', designation: 'Store Incharge', doj: '2022-06-01', baseSalary: 22000, pfEnabled: true, esiEnabled: true, profTaxEnabled: false, status: 'active' },
      { id: 'emp_3', name: 'Anitha S', mobile: '9500456123', email: 'anitha@sivasakthi.com', department: 'Billing', designation: 'Senior Cashier', doj: '2023-01-10', baseSalary: 18000, pfEnabled: false, esiEnabled: false, profTaxEnabled: false, status: 'active' },
    ];
  });

  const [attendance, setAttendance] = useState<AttendanceLog[]>(() => {
    const stored = safeGetItem(`${bizId}_attendance`);
    return stored ? JSON.parse(stored) : [];
  });

  const [activeTab, setActiveTab] = useState<'master' | 'attendance' | 'payroll' | 'holidays'>('master');
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [selectedEmpIdForPayslip, setSelectedEmpIdForPayslip] = useState<string>('');
  const [payrollMonth, setPayrollMonth] = useState('2026-07');

  // New Employee Form States
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [dept, setDept] = useState('Billing');
  const [desg, setDesg] = useState('Cashier');
  const [doj, setDoj] = useState(() => new Date().toISOString().split('T')[0]);
  const [salary, setSalary] = useState('15000');
  const [pf, setPf] = useState(true);
  const [esi, setEsi] = useState(true);
  const [pt, setPt] = useState(true);

  useEffect(() => {
    if (!bizId || bizId === 'all') return;
    
    // Fetch Employees
    api.employees.list(bizId)
      .then(res => {
        if (res && res.length > 0) {
          const mapped = res.map((item: any) => ({
            id: item._id || item.id,
            name: item.name,
            mobile: item.mobile,
            email: item.email || '',
            department: item.department || 'Sales',
            designation: item.designation || '',
            doj: item.doj,
            baseSalary: item.baseSalary,
            pfEnabled: item.pfEnabled,
            esiEnabled: item.esiEnabled,
            profTaxEnabled: item.profTaxEnabled,
            status: item.status || 'active'
          }));
          setEmployees(mapped);
          safeSetItem(`${bizId}_employees`, JSON.stringify(mapped));
        }
      })
      .catch(err => console.warn('Failed to fetch employees live.', err));

    // Fetch Attendance Sheet
    api.attendance.list(bizId)
      .then(res => {
        if (res && res.length > 0) {
          const mapped = res.map((item: any) => ({
            employeeId: item.employeeId,
            date: item.date,
            status: item.status,
            shift: item.shift || 'General'
          }));
          setAttendance(mapped);
          safeSetItem(`${bizId}_attendance`, JSON.stringify(mapped));
        }
      })
      .catch(err => console.warn('Failed to fetch attendance live.', err));
  }, [bizId]);

  // Save helpers
  const saveEmployees = (list: Employee[]) => {
    setEmployees(list);
    safeSetItem(`${bizId}_employees`, JSON.stringify(list));
  };

  const saveAttendance = (list: AttendanceLog[]) => {
    setAttendance(list);
    safeSetItem(`${bizId}_attendance`, JSON.stringify(list));
  };

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !mobile) return;

    const newEmp: Omit<Employee, 'id'> = {
      name,
      mobile,
      email,
      department: dept,
      designation: desg,
      doj,
      baseSalary: Number(salary) || 12000,
      pfEnabled: pf,
      esiEnabled: esi,
      profTaxEnabled: pt,
      status: 'active'
    };

    api.employees.create({ ...newEmp, shopId: bizId })
      .then(saved => {
        const mapped: Employee = {
          id: saved._id || saved.id,
          ...newEmp
        };
        saveEmployees([mapped, ...employees]);
      })
      .catch(err => {
        console.warn('Failed to save employee to server database', err);
        const localEmp: Employee = {
          ...newEmp,
          id: `emp_${Math.random().toString(36).substring(2, 9)}`
        };
        saveEmployees([localEmp, ...employees]);
      });

    setShowAddEmpModal(false);
    setName('');
    setMobile('');
    setEmail('');
    setSalary('15000');
  };

  const handleDeleteEmployee = (id: string) => {
    if (confirm('Are you sure you want to remove this employee from corporate master register?')) {
      api.employees.delete(id)
        .then(() => {
          saveEmployees(employees.filter(e => e.id !== id));
        })
        .catch(err => {
          console.warn('Failed to delete employee on server.', err);
          saveEmployees(employees.filter(e => e.id !== id));
        });
    }
  };

  const handleMarkAttendance = (empId: string, status: AttendanceLog['status'], shift: AttendanceLog['shift'] = 'General') => {
    const todayStr = new Date().toISOString().split('T')[0];
    const updated = attendance.filter(a => !(a.employeeId === empId && a.date === todayStr));
    const newRecord = { employeeId: empId, date: todayStr, status, shift };
    updated.push(newRecord);
    saveAttendance(updated);

    api.attendance.record(bizId, [newRecord])
      .catch(err => console.warn('Failed to post attendance sheet to server.', err));
  };

  // PF, ESI, Professional Tax calculations (Corporate Rules)
  const calculateSalaryMetrics = (emp: Employee) => {
    const base = emp.baseSalary;
    const pfDeduction = emp.pfEnabled ? Number((base * 0.12).toFixed(2)) : 0;
    const esiDeduction = emp.esiEnabled ? Number((base * 0.0075).toFixed(2)) : 0;
    const ptDeduction = emp.profTaxEnabled ? (base > 15000 ? 200 : 125) : 0;
    const totalDeductions = pfDeduction + esiDeduction + ptDeduction;
    const netSalary = base - totalDeductions;

    return {
      pf: pfDeduction,
      esi: esiDeduction,
      pt: ptDeduction,
      totalDeductions,
      netSalary
    };
  };

  return (
    <div className="flex-1 bg-[#f9fafb] p-6 overflow-y-auto space-y-6 font-sans text-xs">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-gray-150 shadow-xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <span>Corporate HRM & Payroll Register</span>
            <Users className="h-5 w-5 text-gray-400" />
          </h1>
          <p className="text-xs text-gray-500 mt-1">Manage employee master records, daily attendance tracking, shifts, and salary slips with EPF & ESI deductions.</p>
        </div>
        <div>
          <button
            onClick={() => setShowAddEmpModal(true)}
            className="flex items-center gap-1.5 bg-black text-white px-3 py-2 rounded-xl text-xs font-semibold hover:bg-neutral-800 transition-all cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            <span>Onboard Employee</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200 pb-px">
        {[
          { id: 'master', label: 'Employee Directory', icon: Users },
          { id: 'attendance', label: 'Daily Attendance Sheet', icon: Calendar },
          { id: 'payroll', label: 'Salary Registers & Payslips', icon: DollarSign },
          { id: 'holidays', label: 'Holiday & Shift Planners', icon: Briefcase },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-4 py-2.5 font-medium transition-all border-b-2 flex items-center gap-1.5 cursor-pointer -mb-px ${
              activeTab === t.id 
                ? 'border-black text-black font-bold' 
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: EMPLOYEE DIRECTORY */}
      {activeTab === 'master' && (
        <div className="bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[10px] text-gray-400 font-bold uppercase tracking-wider text-left">
                  <th className="p-3">Staff Member</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Designation</th>
                  <th className="p-3">Contact info</th>
                  <th className="p-3">Joining Date</th>
                  <th className="p-3 text-right">Base salary</th>
                  <th className="p-3 text-center">EPF / ESI State</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {employees.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50/50">
                    <td className="p-3 font-bold text-gray-900">{e.name}</td>
                    <td className="p-3 font-medium text-gray-600">{e.department}</td>
                    <td className="p-3 font-medium text-gray-600">{e.designation}</td>
                    <td className="p-3 font-mono">
                      <div>{e.mobile}</div>
                      <div className="text-[10px] text-gray-400 font-sans">{e.email}</div>
                    </td>
                    <td className="p-3 font-mono text-gray-500">{e.doj}</td>
                    <td className="p-3 text-right font-mono font-bold text-gray-900">₹{e.baseSalary.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-center">
                      <div className="flex gap-1 justify-center">
                        <span className={`px-1 rounded text-[8px] font-bold ${e.pfEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-400'}`}>PF</span>
                        <span className={`px-1 rounded text-[8px] font-bold ${e.esiEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-400'}`}>ESI</span>
                        <span className={`px-1 rounded text-[8px] font-bold ${e.profTaxEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-400'}`}>PT</span>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-150 uppercase">
                        {e.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button 
                        onClick={() => handleDeleteEmployee(e.id)}
                        className="p-1 text-gray-400 hover:text-red-700 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ATTENDANCE SHEET */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-2xl border border-gray-150 p-5 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">Today's Attendance Grid</h3>
            <span className="text-gray-400 font-mono font-bold">{new Date().toISOString().split('T')[0]}</span>
          </div>

          <div className="space-y-2">
            {employees.map(e => {
              const todayStr = new Date().toISOString().split('T')[0];
              const log = attendance.find(a => a.employeeId === e.id && a.date === todayStr);

              return (
                <div key={e.id} className="flex justify-between items-center p-3 rounded-xl border border-gray-150 bg-gray-50/50">
                  <div>
                    <span className="font-bold text-gray-800 block">{e.name}</span>
                    <span className="text-gray-400 font-medium">{e.designation} ({e.department})</span>
                  </div>
                  <div className="flex gap-2">
                    {[
                      { status: 'Present', color: 'bg-emerald-50 text-emerald-700 border-emerald-150 font-bold' },
                      { status: 'Absent', color: 'bg-red-50 text-red-700 border-red-150 font-bold' },
                      { status: 'Half Day', color: 'bg-amber-50 text-amber-700 border-amber-150 font-bold' },
                      { status: 'On Leave', color: 'bg-blue-50 text-blue-700 border-blue-150 font-bold' }
                    ].map(st => {
                      const isSel = log?.status === st.status;
                      return (
                        <button
                          key={st.status}
                          onClick={() => handleMarkAttendance(e.id, st.status as any)}
                          className={`px-3 py-1.5 border rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                            isSel ? st.color : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-150'
                          }`}
                        >
                          {st.status}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: PAYROLL & PAYSLIPS */}
      {activeTab === 'payroll' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Salary Register Sheet */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-150 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900">Monthly Salary Register Summary</h3>
              <input
                type="month"
                value={payrollMonth}
                onChange={(e) => setPayrollMonth(e.target.value)}
                className="bg-white border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-black font-bold font-mono"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-[10px] text-gray-400 font-bold uppercase tracking-wider text-left">
                    <th className="p-2">Employee Name</th>
                    <th className="p-2 text-right">Basic Pay</th>
                    <th className="p-2 text-right">EPF Deduct</th>
                    <th className="p-2 text-right">ESI Deduct</th>
                    <th className="p-2 text-right">Prof Tax</th>
                    <th className="p-2 text-right font-bold">Net Salary</th>
                    <th className="p-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono">
                  {employees.map(e => {
                    const metrics = calculateSalaryMetrics(e);
                    return (
                      <tr key={e.id} className="hover:bg-gray-50/50">
                        <td className="p-2 font-sans font-bold text-gray-800">{e.name}</td>
                        <td className="p-2 text-right">₹{e.baseSalary.toLocaleString('en-IN')}</td>
                        <td className="p-2 text-right text-red-600">- ₹{metrics.pf.toLocaleString('en-IN')}</td>
                        <td className="p-2 text-right text-red-600">- ₹{metrics.esi.toLocaleString('en-IN')}</td>
                        <td className="p-2 text-right text-red-600">- ₹{metrics.pt.toLocaleString('en-IN')}</td>
                        <td className="p-2 text-right font-bold text-gray-900">₹{metrics.netSalary.toLocaleString('en-IN')}</td>
                        <td className="p-2 text-center">
                          <button
                            onClick={() => setSelectedEmpIdForPayslip(e.id)}
                            className="p-1 bg-black text-white hover:bg-neutral-800 rounded font-semibold text-[10px] px-2 py-1 flex items-center gap-1 cursor-pointer mx-auto"
                          >
                            <Eye className="h-3 w-3" />
                            <span>View Payslip</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payslip preview */}
          <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs space-y-4">
            {selectedEmpIdForPayslip ? (
              (() => {
                const emp = employees.find(e => e.id === selectedEmpIdForPayslip);
                if (!emp) return null;
                const metrics = calculateSalaryMetrics(emp);

                return (
                  <div className="space-y-4 font-mono text-[10px]">
                    <div className="text-center border-b border-gray-100 pb-3 space-y-1">
                      <h4 className="font-bold text-sm text-gray-900">SIVASAKTHI ELECTRICALS</h4>
                      <p className="text-[9px] text-gray-400">Employee Corporate Payslip Statement</p>
                      <span className="bg-black text-white px-2 py-0.5 rounded text-[8px] font-bold tracking-widest uppercase">MONTH: {payrollMonth}</span>
                    </div>

                    <div className="space-y-1 border-b border-gray-100 pb-2 font-sans">
                      <div className="flex justify-between"><strong>Emp Name:</strong> <span>{emp.name}</span></div>
                      <div className="flex justify-between"><strong>Designation:</strong> <span>{emp.designation}</span></div>
                      <div className="flex justify-between"><strong>Department:</strong> <span>{emp.department}</span></div>
                      <div className="flex justify-between"><strong>DOJ:</strong> <span>{emp.doj}</span></div>
                    </div>

                    <div className="space-y-1.5 pb-2 border-b border-gray-100">
                      <div className="flex justify-between"><span>Gross basic salary:</span> <span>₹{emp.baseSalary.toLocaleString('en-IN')}</span></div>
                      <div className="flex justify-between text-red-600"><span>Employee PF contribution:</span> <span>- ₹{metrics.pf.toLocaleString('en-IN')}</span></div>
                      <div className="flex justify-between text-red-600"><span>ESI medical deduction:</span> <span>- ₹{metrics.esi.toLocaleString('en-IN')}</span></div>
                      <div className="flex justify-between text-red-600"><span>Professional Tax (PT):</span> <span>- ₹{metrics.pt.toLocaleString('en-IN')}</span></div>
                    </div>

                    <div className="flex justify-between text-xs font-bold text-gray-900 pt-1 font-sans bg-gray-50 p-2 rounded-xl border border-gray-150">
                      <span>Take Home Salary:</span>
                      <span>₹{metrics.netSalary.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => alert('Sending Payslip to Employee WhatsApp / Email...')}
                        className="flex-1 border border-gray-200 hover:bg-gray-50 py-2 rounded-xl text-[10px] font-bold text-center cursor-pointer"
                      >
                        Share Payslip
                      </button>
                      <button
                        onClick={() => window.print()}
                        className="flex-1 bg-black text-white hover:bg-neutral-800 py-2 rounded-xl text-[10px] font-bold text-center cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Printer className="h-3 w-3" />
                        <span>Print Slip</span>
                      </button>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center text-gray-400 space-y-2 font-sans">
                <FileText className="h-8 w-8 stroke-[1.2px]" />
                <h4 className="font-bold text-gray-700">No Employee Selected</h4>
                <p className="max-w-xs text-[10px]">Select "View Payslip" from the monthly register grid on the left to render a professional corporate salary breakdown sheet.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 4: HOLIDAYS & SHIFTS */}
      {activeTab === 'holidays' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          
          {/* Shift Planner */}
          <div className="bg-white p-5 rounded-2xl border border-gray-150 space-y-4">
            <h3 className="font-bold text-gray-900 pb-2 border-b border-gray-100 uppercase tracking-widest text-[10px]">Shift & Rosters Planner</h3>
            <div className="space-y-3 leading-relaxed text-gray-600 font-sans">
              <p>Active shifts configured in system:</p>
              <div className="space-y-2">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-150 flex justify-between items-center">
                  <div>
                    <strong>General Shift:</strong> <span className="text-gray-400 block text-[10px]">09:30 AM to 07:30 PM (Weekly Off: Sunday)</span>
                  </div>
                  <span className="bg-black text-white px-2 py-0.5 rounded text-[8px] font-mono">DEFAULT</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-150 flex justify-between items-center">
                  <div>
                    <strong>Morning Counter Shift:</strong> <span className="text-gray-400 block text-[10px]">08:00 AM to 05:00 PM</span>
                  </div>
                  <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-[8px] font-mono">ACTIVE</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-150 flex justify-between items-center">
                  <div>
                    <strong>Night Warehouse Shift:</strong> <span className="text-gray-400 block text-[10px]">04:00 PM to 01:00 AM</span>
                  </div>
                  <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-[8px] font-mono">ACTIVE</span>
                </div>
              </div>
            </div>
          </div>

          {/* Corporate Holidays */}
          <div className="bg-white p-5 rounded-2xl border border-gray-150 space-y-4">
            <h3 className="font-bold text-gray-900 pb-2 border-b border-gray-100 uppercase tracking-widest text-[10px]">Active Corporate Holidays List (2026)</h3>
            <div className="space-y-2 font-mono">
              {[
                { date: '2026-01-01', name: 'New Year' },
                { date: '2026-01-14', name: 'Pongal / Makar Sankranti' },
                { date: '2026-01-26', name: 'Republic Day' },
                { date: '2026-05-01', name: 'May Day' },
                { date: '2026-08-15', name: 'Independence Day' },
                { date: '2026-10-02', name: 'Gandhi Jayanti' },
                { date: '2026-11-08', name: 'Deepavali' },
              ].map(h => (
                <div key={h.date} className="flex justify-between items-center p-2 border-b border-gray-100">
                  <span className="font-bold text-gray-800">{h.name}</span>
                  <span className="text-gray-400 font-bold">{h.date}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ADD EMPLOYEE MODAL */}
      {showAddEmpModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-xs">
          <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-xl max-w-sm w-full space-y-4 animate-fade-in">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <h4 className="text-sm font-bold text-gray-900">Onboard Employee</h4>
              <button onClick={() => setShowAddEmpModal(false)} className="text-gray-400 hover:text-black font-semibold text-sm cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">Full Staff Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senthil Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black font-bold text-gray-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">Mobile No *</label>
                  <input
                    type="tel"
                    required
                    placeholder="9876543210"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Email ID</label>
                  <input
                    type="email"
                    placeholder="senthil@sivasakthi.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">Department</label>
                  <select
                    value={dept}
                    onChange={(e) => setDept(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white"
                  >
                    <option value="Billing">Billing</option>
                    <option value="Warehouse">Warehouse</option>
                    <option value="Accounting">Accounting</option>
                    <option value="Administration">Administration</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">Designation</label>
                  <select
                    value={desg}
                    onChange={(e) => setDesg(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white"
                  >
                    <option value="Cashier">Cashier</option>
                    <option value="Store Incharge">Store Incharge</option>
                    <option value="Accountant">Accountant</option>
                    <option value="Helper">Helper</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">Monthly Gross Salary (₹)</label>
                  <input
                    type="number"
                    required
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">Joining Date</label>
                  <input
                    type="date"
                    required
                    value={doj}
                    onChange={(e) => setDoj(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div className="p-3 bg-gray-50 border border-gray-150 rounded-xl space-y-2">
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">EPF / ESI State</span>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1 cursor-pointer font-medium">
                    <input type="checkbox" checked={pf} onChange={(e) => setPf(e.target.checked)} />
                    <span>Provident Fund (EPF 12%)</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer font-medium">
                    <input type="checkbox" checked={esi} onChange={(e) => setEsi(e.target.checked)} />
                    <span>Employee State Insurance (ESI)</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddEmpModal(false)}
                  className="px-3 py-2 border border-gray-200 rounded-lg font-bold hover:bg-gray-50 cursor-pointer text-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-black text-white px-3 py-2 rounded-lg font-bold hover:bg-neutral-800 cursor-pointer"
                >
                  Onboard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
