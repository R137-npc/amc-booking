import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useMachine } from '../../contexts/MachineContext';
import { 
  CpuChipIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  EyeIcon,
  TagIcon,
  WrenchScrewdriverIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const MachineManagement: React.FC = () => {
  const { user } = useAuth();
  const { 
    machines, 
    machineTypes, 
    auditLogs,
    addMachine, 
    updateMachine, 
    deleteMachine,
    addMachineType,
    updateMachineType,
    deleteMachineType,
    addAuditLog
  } = useMachine();

  const [activeTab, setActiveTab] = useState<'machines' | 'types' | 'audit'>('machines');
  const [showMachineForm, setShowMachineForm] = useState(false);
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [editingMachine, setEditingMachine] = useState<any>(null);
  const [editingType, setEditingType] = useState<any>(null);
  const [machineFormData, setMachineFormData] = useState({
    name: '',
    machine_type_id: '',
    status: 'available' as 'available' | 'maintenance' | 'offline',
    custom_token_cost: ''
  });
  const [typeFormData, setTypeFormData] = useState({
    name: '',
    description: ''
  });

  // Group machines by type for display
  const groupedMachines = machines.reduce((groups: any, machine) => {
    const type = machineTypes.find(t => t.id === machine.machine_type_id);
    const typeName = type?.name || 'Unknown Type';
    if (!groups[typeName]) {
      groups[typeName] = [];
    }
    groups[typeName].push({ ...machine, type });
    return groups;
  }, {});

  const handleMachineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!machineFormData.name || !machineFormData.machine_type_id) {
      alert('Please fill in all required fields');
      return;
    }

    const machineData = {
      name: machineFormData.name,
      machine_type_id: machineFormData.machine_type_id,
      status: machineFormData.status,
      custom_token_cost: machineFormData.custom_token_cost ? parseInt(machineFormData.custom_token_cost) : undefined
    };

    if (editingMachine) {
      updateMachine(editingMachine.id, machineData);
    } else {
      addMachine(machineData);
    }

    setShowMachineForm(false);
    setEditingMachine(null);
    setMachineFormData({
      name: '',
      machine_type_id: '',
      status: 'available',
      custom_token_cost: ''
    });
  };

  const handleTypeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!typeFormData.name) {
      alert('Please fill in all required fields');
      return;
    }

    if (editingType) {
      updateMachineType(editingType.id, typeFormData);
    } else {
      addMachineType(typeFormData);
    }

    setShowTypeForm(false);
    setEditingType(null);
    setTypeFormData({
      name: '',
      description: ''
    });
  };

  const handleEditMachine = (machine: any) => {
    setEditingMachine(machine);
    setMachineFormData({
      name: machine.name,
      machine_type_id: machine.machine_type_id,
      status: machine.status,
      custom_token_cost: machine.custom_token_cost?.toString() || ''
    });
    setShowMachineForm(true);
  };

  const handleEditType = (type: any) => {
    setEditingType(type);
    setTypeFormData({
      name: type.name,
      description: type.description
    });
    setShowTypeForm(true);
  };

  const handleDeleteMachine = (machineId: string) => {
    if (confirm('Are you sure you want to delete this machine?')) {
      deleteMachine(machineId);
    }
  };

  const handleDeleteType = (typeId: string) => {
    const machinesUsingType = machines.filter(m => m.machine_type_id === typeId);
    if (machinesUsingType.length > 0) {
      alert(`Cannot delete this machine type. ${machinesUsingType.length} machine(s) are using it.`);
      return;
    }
    
    if (confirm('Are you sure you want to delete this machine type?')) {
      deleteMachineType(typeId);
    }
  };

  const handleStatusChange = (machineId: string, newStatus: string) => {
    updateMachine(machineId, { status: newStatus as any });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
      case 'maintenance': return <WrenchScrewdriverIcon className="h-4 w-4 text-yellow-600" />;
      case 'offline': return <XCircleIcon className="h-4 w-4 text-red-600" />;
      default: return <ClockIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'offline': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const availableMachines = machines.filter(m => m.status === 'available');
  const maintenanceMachines = machines.filter(m => m.status === 'maintenance');
  const offlineMachines = machines.filter(m => m.status === 'offline');

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Machine Management</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('machines')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'machines' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Machines
            </button>
            <button
              onClick={() => setActiveTab('types')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'types' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Categories
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'audit' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Audit Log
            </button>
          </div>
        </div>

        {/* Machines Tab */}
        {activeTab === 'machines' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
              <div className="bg-white border rounded-lg p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <CpuChipIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Machines</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{machines.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border rounded-lg p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircleIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Available</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{availableMachines.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border rounded-lg p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <WrenchScrewdriverIcon className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Maintenance</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{maintenanceMachines.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border rounded-lg p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <XCircleIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Offline</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{offlineMachines.length}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Machine List</h2>
              <button
                onClick={() => setShowMachineForm(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Machine
              </button>
            </div>

            {/* Machines Table */}
            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Machine
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tokens/Hour
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(groupedMachines).map(([typeName, typeMachines]: [string, any[]]) => 
                    typeMachines.map((machine, index) => (
                      <tr key={machine.id} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-4 py-4">
                          {index === 0 && (
                            <div>
                              <div className="text-sm font-medium text-gray-900">{typeName}</div>
                              <div className="text-sm text-gray-500 hidden sm:block">{machine.type?.description}</div>
                            </div>
                          )}
                        </td>
                        <td className="px-3 sm:px-4 py-4">
                          <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg mr-3">
                              <CpuChipIcon className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{machine.name}</div>
                              <div className="text-sm text-gray-500 hidden sm:block">ID: {machine.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 py-4">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(machine.status)}
                            <select
                              value={machine.status}
                              onChange={(e) => handleStatusChange(machine.id, e.target.value)}
                              className={`text-xs px-2 py-1 rounded-full border-0 ${getStatusColor(machine.status)}`}
                            >
                              <option value="available">Available</option>
                              <option value="maintenance">Maintenance</option>
                              <option value="offline">Offline</option>
                            </select>
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 py-4">
                          <div className="text-sm text-gray-900">
                            {machine.custom_token_cost || 'Not set'}
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 py-4 text-sm font-medium">
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleEditMachine(machine)}
                              className="text-indigo-600 hover:text-indigo-900 transition-colors p-1"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteMachine(machine.id)}
                              className="text-red-600 hover:text-red-900 transition-colors p-1"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Machine Types Tab */}
        {activeTab === 'types' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Machine Categories</h2>
              <button
                onClick={() => setShowTypeForm(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Category
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {machineTypes.map((type) => {
                const machineCount = machines.filter(m => m.machine_type_id === type.id).length;
                return (
                  <div key={type.id} className="bg-white border rounded-lg p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                      <div className="flex items-center">
                        <div className="p-2 bg-purple-100 rounded-lg mr-3">
                          <TagIcon className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{type.name} ({type.id})</h3>
                          <p className="text-sm text-gray-600">{machineCount} machines</p>
                        </div>
                      </div>
                      <div className="flex space-x-2 mt-2 sm:mt-0">
                        <button
                          onClick={() => handleEditType(type)}
                          className="text-indigo-600 hover:text-indigo-900 transition-colors p-1"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteType(type.id)}
                          className="text-red-600 hover:text-red-900 transition-colors p-1"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 break-words">{type.description}</p>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Audit Log Tab */}
        {activeTab === 'audit' && (
          <>
            <h2 className="text-lg font-semibold text-gray-900 mb-6">System Audit Log</h2>
            <div className="space-y-4">
              {auditLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ClockIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No audit logs yet</p>
                </div>
              ) : (
                auditLogs.slice().reverse().map((log) => (
                  <div key={log.id} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                    <div className={`p-2 rounded-full ${
                      log.action === 'create' ? 'bg-green-100' :
                      log.action === 'update' ? 'bg-blue-100' :
                      'bg-red-100'
                    }`}>
                      {log.action === 'create' ? (
                        <PlusIcon className={`h-4 w-4 ${
                          log.action === 'create' ? 'text-green-600' : ''
                        }`} />
                      ) : log.action === 'update' ? (
                        <PencilIcon className="h-4 w-4 text-blue-600" />
                      ) : (
                        <TrashIcon className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{log.description}</p>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mt-1 text-xs text-gray-500">
                        <span>ID: {log.id}</span>
                        <span className="hidden sm:inline">•</span>
                        <span>{new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Machine Form Modal */}
      {showMachineForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingMachine ? 'Edit Machine' : 'Add New Machine'}
            </h3>
            <form onSubmit={handleMachineSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  value={machineFormData.machine_type_id}
                  onChange={(e) => setMachineFormData({ ...machineFormData, machine_type_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a category</option>
                  {machineTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Machine Name *
                </label>
                <input
                  type="text"
                  value={machineFormData.name}
                  onChange={(e) => setMachineFormData({ ...machineFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter machine name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  value={machineFormData.status}
                  onChange={(e) => setMachineFormData({ ...machineFormData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="available">Available</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tokens per Hour
                </label>
                <input
                  type="number"
                  value={machineFormData.custom_token_cost}
                  onChange={(e) => setMachineFormData({ ...machineFormData, custom_token_cost: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter token cost per hour"
                  min="1"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowMachineForm(false);
                    setEditingMachine(null);
                    setMachineFormData({
                      name: '',
                      machine_type_id: '',
                      status: 'available',
                      custom_token_cost: ''
                    });
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingMachine ? 'Update Machine' : 'Add Machine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Machine Type Form Modal */}
      {showTypeForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingType ? 'Edit Category' : 'Add New Category'}
            </h3>
            <form onSubmit={handleTypeSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={typeFormData.name}
                  onChange={(e) => setTypeFormData({ ...typeFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter category name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={typeFormData.description}
                  onChange={(e) => setTypeFormData({ ...typeFormData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter category description"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowTypeForm(false);
                    setEditingType(null);
                    setTypeFormData({
                      name: '',
                      description: ''
                    });
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingType ? 'Update Category' : 'Add Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MachineManagement;