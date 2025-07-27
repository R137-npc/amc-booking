import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useEffect } from 'react';
import { Machine, MachineType, AuditLog } from '../types';

// Use the same storage system as AuthContext
const STORAGE_VERSION = '1.0';
const STORAGE_KEY_PREFIX = 'amc_booking_system_v' + STORAGE_VERSION + '_';

const getStoredData = (key: string, defaultValue: any) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.error('Error loading stored data:', error);
    return defaultValue;
  }
};

const saveStoredData = (key: string, data: any) => {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving data:', error);
  }
};

interface MachineContextType {
  machines: Machine[];
  machineTypes: MachineType[];
  auditLogs: AuditLog[];
  addMachine: (machine: Omit<Machine, 'id' | 'created_at'>) => Machine;
  updateMachine: (id: string, updates: Partial<Machine>) => void;
  deleteMachine: (id: string) => void;
  addMachineType: (machineType: Omit<MachineType, 'id'>) => MachineType;
  updateMachineType: (id: string, updates: Partial<MachineType>) => void;
  deleteMachineType: (id: string) => void;
  getMachineById: (id: string) => Machine | undefined;
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
}

const MachineContext = createContext<MachineContextType | undefined>(undefined);

export const useMachine = () => {
  const context = useContext(MachineContext);
  if (!context) {
    throw new Error('useMachine must be used within a MachineProvider');
  }
  return context;
};

// Mock machine types
const mockMachineTypes: MachineType[] = [
  {
    id: 'C01',
    name: '3D Printer',
    description: 'High-precision 3D printing capabilities'
  },
  {
    id: 'C02',
    name: 'CNC Machine',
    description: 'Computer numerical control machining'
  },
  {
    id: 'C03',
    name: 'Laser Cutter',
    description: 'Precision laser cutting and engraving'
  }
];

// Mock machines with consistent IDs
const mockMachines: Machine[] = [
  {
    id: 'C01M01',
    name: '3D Printer #1',
    machine_type_id: 'C01',
    status: 'available',
    custom_token_cost: 5,
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'C01M02',
    name: '3D Printer #2',
    machine_type_id: 'C01',
    status: 'available',
    custom_token_cost: 5,
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'C02M01',
    name: 'CNC Machine #1',
    machine_type_id: 'C02',
    status: 'maintenance',
    custom_token_cost: 8,
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'C03M01',
    name: 'Laser Cutter #1',
    machine_type_id: 'C03',
    status: 'available',
    custom_token_cost: 6,
    created_at: '2024-01-01T00:00:00Z'
  }
];

const mockAuditLogs: AuditLog[] = [];
export const MachineProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [machines, setMachines] = useState<Machine[]>(() => getStoredData('machines', mockMachines));
  
  const [machineTypes, setMachineTypes] = useState<MachineType[]>(() => getStoredData('machineTypes', mockMachineTypes));

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => getStoredData('auditLogs', mockAuditLogs));
  // Save to localStorage whenever data changes
  useEffect(() => {
    saveStoredData('machines', machines);
  }, [machines]);

  useEffect(() => {
    saveStoredData('machineTypes', machineTypes);
  }, [machineTypes]);

  useEffect(() => {
    saveStoredData('auditLogs', auditLogs);
  }, [auditLogs]);
  // Generate category-based machine IDs (e.g., C01M01, C02M03)
  const generateMachineId = () => {
    return (machineTypeId: string) => {
      const machinesInType = machines.filter(m => m.machine_type_id === machineTypeId);
      const maxMachineNum = machinesInType.reduce((max, machine) => {
        const machineNum = parseInt(machine.id.substring(4)); // Extract number after C##M
        return machineNum > max ? machineNum : max;
      }, 0);
      return `${machineTypeId}M${String(maxMachineNum + 1).padStart(2, '0')}`;
    };
  };

  // Generate category IDs (C01, C02, C03...)
  const generateMachineTypeId = () => {
    const maxId = machineTypes.reduce((max, type) => {
      const idNum = parseInt(type.id.replace('C', ''));
      return idNum > max ? idNum : max;
    }, 0);
    return `C${String(maxId + 1).padStart(2, '0')}`;
  };

  // Generate audit log IDs
  const generateAuditLogId = () => {
    const maxId = auditLogs.reduce((max, log) => {
      const idNum = parseInt(log.id.replace('AL', ''));
      return idNum > max ? idNum : max;
    }, 0);
    return `AL${String(maxId + 1).padStart(3, '0')}`;
  };

  const addAuditLog = (logData: Omit<AuditLog, 'id' | 'timestamp'>) => {
    const newLog: AuditLog = {
      ...logData,
      id: generateAuditLogId(),
      timestamp: new Date().toISOString()
    };
    setAuditLogs(prev => [...prev, newLog]);
  };

  const addMachine = (machineData: Omit<Machine, 'id' | 'created_at'>): Machine => {
    const generateId = generateMachineId();
    const newMachine: Machine = {
      ...machineData,
      id: generateId(machineData.machine_type_id),
      created_at: new Date().toISOString()
    };
    setMachines(prev => [...prev, newMachine]);
    
    addAuditLog({
      action: 'create',
      entity_type: 'machine',
      entity_id: newMachine.id,
      description: `Created machine "${newMachine.name}" in category ${newMachine.machine_type_id}`,
      user_name: 'Current User',
      changes: {
        name: newMachine.name,
        machine_type_id: newMachine.machine_type_id,
        status: newMachine.status,
        custom_token_cost: newMachine.custom_token_cost
      }
    });
    
    return newMachine;
  };

  const updateMachine = (id: string, updates: Partial<Machine>) => {
    const oldMachine = machines.find(m => m.id === id);
    setMachines(prev => 
      prev.map(machine => 
        machine.id === id ? { ...machine, ...updates } : machine
      )
    );
    
    if (oldMachine) {
      const changes: any = {};
      Object.keys(updates).forEach(key => {
        if (updates[key as keyof Machine] !== oldMachine[key as keyof Machine]) {
          changes[key] = {
            from: oldMachine[key as keyof Machine],
            to: updates[key as keyof Machine]
          };
        }
      });
      
      addAuditLog({
        action: 'update',
        entity_type: 'machine',
        entity_id: id,
        description: `Updated machine "${oldMachine.name}"`,
        user_name: 'Current User',
        changes
      });
    }
  };

  const deleteMachine = (id: string) => {
    const machine = machines.find(m => m.id === id);
    setMachines(prev => prev.filter(machine => machine.id !== id));
    
    if (machine) {
      addAuditLog({
        action: 'delete',
        entity_type: 'machine',
        entity_id: id,
        description: `Deleted machine "${machine.name}"`,
        user_name: 'Current User',
        changes: { deleted_machine: machine }
      });
    }
  };

  const addMachineType = (machineTypeData: Omit<MachineType, 'id'>): MachineType => {
    const newMachineType: MachineType = {
      ...machineTypeData,
      id: generateMachineTypeId()
    };
    setMachineTypes(prev => [...prev, newMachineType]);
    
    addAuditLog({
      action: 'create',
      entity_type: 'machine_type',
      entity_id: newMachineType.id,
      description: `Created machine category "${newMachineType.name}"`,
      user_name: 'Current User',
      changes: {
        name: newMachineType.name,
        description: newMachineType.description
      }
    });
    
    return newMachineType;
  };

  const updateMachineType = (id: string, updates: Partial<MachineType>) => {
    const oldType = machineTypes.find(t => t.id === id);
    setMachineTypes(prev => 
      prev.map(type => 
        type.id === id ? { ...type, ...updates } : type
      )
    );
    
    if (oldType) {
      const changes: any = {};
      Object.keys(updates).forEach(key => {
        if (updates[key as keyof MachineType] !== oldType[key as keyof MachineType]) {
          changes[key] = {
            from: oldType[key as keyof MachineType],
            to: updates[key as keyof MachineType]
          };
        }
      });
      
      addAuditLog({
        action: 'update',
        entity_type: 'machine_type',
        entity_id: id,
        description: `Updated machine category "${oldType.name}"`,
        user_name: 'Current User',
        changes
      });
    }
  };

  const deleteMachineType = (id: string) => {
    const type = machineTypes.find(t => t.id === id);
    setMachineTypes(prev => prev.filter(type => type.id !== id));
    
    if (type) {
      addAuditLog({
        action: 'delete',
        entity_type: 'machine_type',
        entity_id: id,
        description: `Deleted machine category "${type.name}"`,
        user_name: 'Current User',
        changes: { deleted_type: type }
      });
    }
  };

  const getMachineById = (id: string) => {
    return machines.find(machine => machine.id === id);
  };


  return (
    <MachineContext.Provider value={{
      machines,
      machineTypes,
      auditLogs,
      addMachine,
      updateMachine,
      deleteMachine,
      addMachineType,
      updateMachineType,
      deleteMachineType,
      getMachineById,
      addAuditLog
    }}>
      {children}
    </MachineContext.Provider>
  );
};