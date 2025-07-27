import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Machine, MachineType, AuditLog } from '../types';

interface MachineContextType {
  machines: Machine[];
  machineTypes: MachineType[];
  auditLogs: AuditLog[];
  isLoading: boolean;
  addMachine: (machine: Omit<Machine, 'id' | 'created_at'>) => Promise<Machine>;
  updateMachine: (id: string, updates: Partial<Machine>) => Promise<void>;
  deleteMachine: (id: string) => Promise<void>;
  addMachineType: (machineType: Omit<MachineType, 'id'>) => Promise<MachineType>;
  updateMachineType: (id: string, updates: Partial<MachineType>) => Promise<void>;
  deleteMachineType: (id: string) => Promise<void>;
  getMachineById: (id: string) => Machine | undefined;
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => Promise<void>;
  refreshData: () => Promise<void>;
}

const MachineContext = createContext<MachineContextType | undefined>(undefined);

export const useMachine = () => {
  const context = useContext(MachineContext);
  if (!context) {
    throw new Error('useMachine must be used within a MachineProvider');
  }
  return context;
};

export const MachineProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [machineTypes, setMachineTypes] = useState<MachineType[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from Supabase
  const loadData = async () => {
    try {
      setIsLoading(true);

      // Load machine types
      const { data: typesData, error: typesError } = await supabase
        .from('machine_types')
        .select('*')
        .order('name');

      if (typesError) {
        console.error('Error loading machine types:', typesError);
      } else {
        setMachineTypes(typesData as MachineType[]);
      }

      // Load machines
      const { data: machinesData, error: machinesError } = await supabase
        .from('machines')
        .select('*')
        .order('name');

      if (machinesError) {
        console.error('Error loading machines:', machinesError);
      } else {
        setMachines(machinesData as Machine[]);
      }

      // Load audit logs
      const { data: auditData, error: auditError } = await supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (auditError) {
        console.error('Error loading audit logs:', auditError);
      } else {
        setAuditLogs(auditData as AuditLog[]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize data
  useEffect(() => {
    loadData();

    // Subscribe to real-time changes
    const machinesSubscription = supabase
      .channel('machines_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'machines' },
        () => loadData()
      )
      .subscribe();

    const typesSubscription = supabase
      .channel('machine_types_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'machine_types' },
        () => loadData()
      )
      .subscribe();

    const auditSubscription = supabase
      .channel('audit_logs_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'audit_logs' },
        () => loadData()
      )
      .subscribe();

    return () => {
      machinesSubscription.unsubscribe();
      typesSubscription.unsubscribe();
      auditSubscription.unsubscribe();
    };
  }, []);

  // Generate machine ID based on type
  const generateMachineId = (machineTypeId: string): string => {
    const machinesInType = machines.filter(m => m.machine_type_id === machineTypeId);
    const maxMachineNum = machinesInType.reduce((max, machine) => {
      const machineNum = parseInt(machine.id.substring(4)); // Extract number after C##M
      return machineNum > max ? machineNum : max;
    }, 0);
    return `${machineTypeId}M${String(maxMachineNum + 1).padStart(2, '0')}`;
  };

  // Generate machine type ID
  const generateMachineTypeId = (): string => {
    const maxId = machineTypes.reduce((max, type) => {
      const idNum = parseInt(type.id.replace('C', ''));
      return idNum > max ? idNum : max;
    }, 0);
    return `C${String(maxId + 1).padStart(2, '0')}`;
  };

  const addMachine = async (machineData: Omit<Machine, 'id' | 'created_at'>): Promise<Machine> => {
    try {
      const newId = generateMachineId(machineData.machine_type_id);
      
      const { data, error } = await supabase
        .from('machines')
        .insert({
          ...machineData,
          id: newId
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      const newMachine = data as Machine;
      setMachines(prev => [...prev, newMachine]);
      return newMachine;
    } catch (error) {
      console.error('Error adding machine:', error);
      throw error;
    }
  };

  const updateMachine = async (id: string, updates: Partial<Machine>): Promise<void> => {
    try {
      const { error } = await supabase
        .from('machines')
        .update(updates)
        .eq('id', id);

      if (error) {
        throw error;
      }

      setMachines(prev => 
        prev.map(machine => 
          machine.id === id ? { ...machine, ...updates } : machine
        )
      );
    } catch (error) {
      console.error('Error updating machine:', error);
      throw error;
    }
  };

  const deleteMachine = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('machines')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setMachines(prev => prev.filter(machine => machine.id !== id));
    } catch (error) {
      console.error('Error deleting machine:', error);
      throw error;
    }
  };

  const addMachineType = async (machineTypeData: Omit<MachineType, 'id'>): Promise<MachineType> => {
    try {
      const newId = generateMachineTypeId();
      
      const { data, error } = await supabase
        .from('machine_types')
        .insert({
          ...machineTypeData,
          id: newId
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      const newMachineType = data as MachineType;
      setMachineTypes(prev => [...prev, newMachineType]);
      return newMachineType;
    } catch (error) {
      console.error('Error adding machine type:', error);
      throw error;
    }
  };

  const updateMachineType = async (id: string, updates: Partial<MachineType>): Promise<void> => {
    try {
      const { error } = await supabase
        .from('machine_types')
        .update(updates)
        .eq('id', id);

      if (error) {
        throw error;
      }

      setMachineTypes(prev => 
        prev.map(type => 
          type.id === id ? { ...type, ...updates } : type
        )
      );
    } catch (error) {
      console.error('Error updating machine type:', error);
      throw error;
    }
  };

  const deleteMachineType = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('machine_types')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setMachineTypes(prev => prev.filter(type => type.id !== id));
    } catch (error) {
      console.error('Error deleting machine type:', error);
      throw error;
    }
  };

  const getMachineById = (id: string): Machine | undefined => {
    return machines.find(machine => machine.id === id);
  };

  const addAuditLog = async (logData: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> => {
    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert(logData);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error adding audit log:', error);
      throw error;
    }
  };

  const refreshData = async (): Promise<void> => {
    await loadData();
  };

  return (
    <MachineContext.Provider value={{
      machines,
      machineTypes,
      auditLogs,
      isLoading,
      addMachine,
      updateMachine,
      deleteMachine,
      addMachineType,
      updateMachineType,
      deleteMachineType,
      getMachineById,
      addAuditLog,
      refreshData
    }}>
      {children}
    </MachineContext.Provider>
  );
};